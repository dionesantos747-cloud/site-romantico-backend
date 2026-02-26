process.on("unhandledRejection", err => {
  console.error("Unhandled Rejection:", err);
});
const crypto = require("crypto");
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const { MongoClient } = require("mongodb");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

/* =====================
   MIDDLEWARES
===================== */
app.use(cors());
app.use(bodyParser.json({ limit: "20mb" }));
app.use(express.static(path.join(__dirname, "public"), {
  maxAge: "7d",
  etag: true,
  lastModified: true
}));

/* =====================
   ROTA INICIAL
===================== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "editor.html"));
});

/* =====================
   CLOUDINARY
===================== */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }
});

/* =====================
   VARIÁVEIS
===================== */
const MONGO_URI = process.env.MONGO_URI;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

let payments, users;

if (!MONGO_URI || !MP_ACCESS_TOKEN) {
  console.error("❌ Variáveis de ambiente não definidas");
  process.exit(1);
}

/* =====================
   MONGODB
===================== */
(async () => {
  try {
    const client = new MongoClient(MONGO_URI);
    await client.connect();
    const db = client.db("site-romantico");
    payments = db.collection("payments");
    users = db.collection("users");
    console.log("✅ MongoDB conectado");
  } catch (err) {
    console.error("❌ Erro MongoDB:", err.message);
  }
})();

/* =====================
   UPLOAD FOTO (FIX HEIC DEFINITIVO)
===================== */
app.post("/upload-image", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Arquivo não enviado" });
  }

  cloudinary.uploader.upload_stream(
    {
      folder: "site-romantico/fotos",
      resource_type: "image",

      // 🔥 FORÇA CONVERSÃO UNIVERSAL
      format: "jpg",

      transformation: [
        { width: 1600, height: 1600, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" }
      ]
    },
    (err, result) => {
      if (err) {
        console.error("Erro Cloudinary:", err);
        return res.status(500).json({ error: "Erro imagem" });
      }

      res.json({ url: result.secure_url });
    }
  ).end(req.file.buffer);
});

/* =====================
   UPLOAD MÚSICA
===================== */
app.post("/upload-music", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Arquivo não enviado" });
  }

  // ✅ AQUI (EXATAMENTE AQUI)
  if (!req.file.mimetype.startsWith("audio/")) {
    return res.status(400).json({ error: "Arquivo inválido. Envie um áudio." });
  }

  cloudinary.uploader.upload_stream(
    { resource_type: "auto", folder: "site-romantico/musicas" },
    (err, result) => {
      if (err) return res.status(500).json({ error: "Erro música" });
      res.json({ url: result.secure_url });
    }
  ).end(req.file.buffer);
});

/* =====================
   CREATE PAYMENT
===================== */
app.post("/create-payment", async (req, res) => {
  try {
    const {
  nome,
  mensagem,
  dataInicio,
  fotos = [],
  musica = null,
  fundo = "azul"
} = req.body;

/* 🔒 VALIDAÇÃO OBRIGATÓRIA */
if (!nome || !mensagem || !dataInicio) {
  return res.status(400).json({
    error: "Dados obrigatórios não preenchidos"
  });
}

    const tempId = uuidv4();

    await users.insertOne({
  _id: tempId,
  nome,
  mensagem,
  dataInicio,
  fotos,
  musica,
  fundo,
  status: "pending",
  createdAt: new Date()
});

    const mp = await axios.post(
      "https://api.mercadopago.com/v1/payments",
      {
        transaction_amount: 9.99,
        description: "Site Romântico Premium 💖",
        payment_method_id: "pix",
        payer: { email: "dionesantosx7@gmail.com" },
        metadata: { userId: tempId },
        notification_url: `${req.protocol}://${req.get("host")}/webhook`
      },
      {
        headers: {
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": uuidv4()
        }
      }
    );

    await payments.insertOne({
      paymentId: String(mp.data.id),
      userId: tempId,
      status: "pending",
      createdAt: new Date()
    });

    const pix = mp.data.point_of_interaction.transaction_data;

    res.json({
      payment_id: String(mp.data.id),
      qr_base64: pix.qr_code_base64,
      copia_cola: pix.qr_code
    });

  } catch (err) {
    console.error("❌ Erro pagamento:", err.message);
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
});
/* =====================
   PAYMENT INFO (PIX)
===================== */
app.get("/payment-info", async (req, res) => {
  try {
    const paymentId = String(req.query.payment_id);
    if (!paymentId) {
      return res.status(400).json({});
    }

    const mp = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`
        }
      }
    );

    const pix = mp.data.point_of_interaction?.transaction_data;
    if (!pix) {
      return res.status(404).json({});
    }

    res.json({
      qr_base64: pix.qr_code_base64,
      copia_cola: pix.qr_code
    });

  } catch (err) {
    console.error("Erro payment-info:", err.message);
    res.status(500).json({});
  }
});
/* =====================
   WEBHOOK MERCADO PAGO
===================== */
app.post("/webhook", async (req, res) => {
  res.sendStatus(200);

  const paymentId =
    req.body?.data?.id ||
    req.query?.id;

  if (!paymentId) return;

  try {
    const mp = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
    );

    if (mp.data.status !== "approved") return;

    const userId = mp.data.metadata?.userId;
    if (!userId) return;

    await payments.updateOne(
      { paymentId: String(paymentId) },
      { $set: { status: "approved", approvedAt: new Date() } }
    );

    await users.updateOne(
      { _id: userId },
      { $set: { status: "approved", activatedAt: new Date() } }
    );

    console.log("💖 Pagamento aprovado:", paymentId);

  } catch (err) {
    console.error("❌ Webhook erro:", err.message);
  }
});

/* =====================
   CHECK PAYMENT
===================== */
app.get("/check-payment", async (req, res) => {
  try {
    const paymentId = String(req.query.payment_id);

    const pagamento = await payments.findOne({ paymentId });
    if (!pagamento) {
      return res.json({ status: "pending" });
    }

    // consulta fonte da verdade
    const mp = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
    );

    const status = mp.data.status;

    if (status === "approved") {

  let siteId = pagamento.siteId;

  if (!siteId) {
    siteId = crypto.randomUUID();

    await payments.updateOne(
      { paymentId },
      {
        $set: {
          status: "approved",
          siteId,
          aprovadoEm: new Date()
        }
      }
    );

    await users.updateOne(
      { _id: pagamento.userId },
      {
        $set: {
          status: "approved",
          activatedAt: new Date()
        }
      }
    );
  }

  return res.json({
    status: "approved",
    siteId
  });
}

    res.json({ status });

  } catch (err) {
    console.error("❌ check-payment erro:", err.message);
    res.json({ status: "pending" });
  }
});

/* =====================
   SUCCESS
===================== */
app.get("/success.html", async (req, res) => {
  const paymentId = String(req.query.payment_id);

  const pay = await payments.findOne({
  paymentId
});
  
if (!pay || pay.status !== "approved") {
  return res.sendFile(
    path.join(__dirname, "public/aguardando.html")
  );
}

  const user = await users.findOne({ _id: pay.userId });
  if (!user) return res.status(404).send("Usuário não encontrado");

  const link = `${req.protocol}://${req.get("host")}/user.html?id=${user._id}`;
  const qr = await QRCode.toDataURL(link);

  let html = fs.readFileSync(
    path.join(__dirname, "views/success.html"),
    "utf8"
  );

  html = html
    .replace("{{QR}}", `<img src="${qr}" />`)
    .replace("{{LINK}}", link);

  res.send(html);
});

/* =====================
   USER DATA
===================== */
app.get("/user-data", async (req, res) => {
  const user = await users.findOne({ _id: req.query.id });

  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }

if (user.status !== "approved") {
  return res.json({
    status: "pending",
    message: "Pagamento em processamento"
  });
}

  res.json(user);
});

/* =====================
   START
===================== */
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server rodando");
});

