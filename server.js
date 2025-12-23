process.on("unhandledRejection", err => {
  console.error("Unhandled Rejection:", err);
});
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
  maxAge: "7d",          // cache por 7 dias
  etag: true,            // valida cache
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

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }
});

/* =====================
   VARIÁVEIS
===================== */
const MONGO_URI = process.env.MONGO_URI;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

let payments = null;
let users = null;
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
   UPLOAD FOTO
===================== */
app.post("/upload-image", upload.single("file"), (req, res) => {
 if (!req.file) {
  return res.status(400).json({ error: "Arquivo não enviado" });
}
   cloudinary.uploader.upload_stream(
    { folder: "site-romantico/fotos" },
    (err, result) => {
      if (err) return res.status(500).json({ error: "Erro imagem" });
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
   cloudinary.uploader.upload_stream(
    { resource_type: "video", folder: "site-romantico/musicas" },
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

    // 1️⃣ CRIA USUÁRIO TEMPORÁRIO (ANTES DO PAGAMENTO)
    const tempId = uuidv4();

    await users.insertOne({
      _id: tempId,
      status: "pending",
      createdAt: new Date(),
      ...req.body   // nome, mensagem, fotos, musica etc
    });

    // 2️⃣ CRIA PAGAMENTO PIX NO MERCADO PAGO
    const mp = await axios.post(
      "https://api.mercadopago.com/v1/payments",
      {
        transaction_amount: 9.99,
        description: "Site Romântico Premium 💖",
        payment_method_id: "pix",
        payer: { email: "cliente@site.com" },

        // 🔥 LIGA PAGAMENTO AO USUÁRIO
        metadata: {
          userId: tempId
        },

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

    // 3️⃣ SALVA PAGAMENTO
    await payments.insertOne({
      paymentId: String(mp.data.id),
      userId: tempId,
      status: "pending",
      createdAt: new Date()
    });

    // 4️⃣ RETORNA PIX PARA O FRONT
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
   WEBHOOK MERCADO PAGO
===================== */
app.post("/webhook", (req, res) => {

  // RESPONDE IMEDIATO (evita erro 502)
  res.sendStatus(200);

  (async () => {
    try {
      const paymentId =
  req.body?.data?.id ||
  req.body?.id ||
  req.query?.id;
      if (!paymentId) return;

      // CONSULTA MERCADO PAGO
      const mp = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` }
        }
      );

      if (mp.data.status !== "approved") return;

      const userId = mp.data.metadata?.userId;
      if (!userId) return;

      // ATUALIZA PAGAMENTO
      await payments.updateOne(
        { paymentId },
        { $set: { status: "approved", approvedAt: new Date() } }
      );

      // ATIVA USUÁRIO
      await users.updateOne(
        { _id: userId },
        {
          $set: {
            status: "approved",
            paymentId,
            activatedAt: new Date()
          }
        }
      );

      console.log("💖 Pagamento aprovado | Usuário:", userId);

    } catch (err) {
      console.error("❌ Erro webhook:", err.message);
    }
  })();
});

/* =====================
   CHECK PAYMENT
===================== */
app.get("/check-payment", async (req, res) => {
  try {
    const paymentId = String(req.query.payment_id);

    const mp = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
    );

    if (mp.data.status !== "approved") {
      return res.json({ status: "pending" });
    }

    // 🔎 busca pagamento
    const pay = await payments.findOne({ paymentId });

    if (!pay) {
      return res.json({ status: "pending" });
    }

    // 🔎 ativa usuário SE ainda não estiver ativo
    await users.updateOne(
      { _id: pay.userId },
      {
        $set: {
          status: "approved",
          paymentId,
          activatedAt: new Date()
        }
      }
    );

    await payments.updateOne(
      { paymentId },
      { $set: { status: "approved" } }
    );

    return res.json({ status: "approved" });

  } catch (err) {
    console.error("check-payment erro:", err.message);
    res.json({ status: "pending" });
  }
});

/* =====================
   SUCCESS
===================== */
app.get("/success.html", async (req, res) => {
  try {
    const paymentId = String(req.query.payment_id);

    // 🔹 BUSCA PAGAMENTO APROVADO
    const pay = await payments.findOne({
      paymentId,
      status: "approved"
    });

    if (!pay) {
      return res.sendFile(
        path.join(__dirname, "public/aguardando.html")
      );
    }

    // 🔹 BUSCA USUÁRIO PELO userId SALVO NO PAGAMENTO
    const user = await users.findOne({ _id: pay.userId });

    if (!user) {
      return res.status(404).send("Usuário não encontrado");
    }

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

  } catch (err) {
    console.error("Erro success:", err.message);
    res.status(500).send("Erro ao carregar sucesso");
  }
});
/* =====================
   USER DATA
===================== */
app.get("/user-data", async (req, res) => {
  try {
    const id = req.query.id;

    if (!id) {
      return res.status(400).json({ error: "ID não informado" });
    }

    const user = await users.findOne({ _id: id });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // 🔒 só libera se estiver aprovado
    if (user.status !== "approved") {
      return res.json({ status: "pending" });
    }

    res.json(user);

  } catch (err) {
    console.error("Erro /user-data:", err.message);
    res.status(500).json({ error: "Erro interno" });
  }
});
/* =====================
   START
===================== */
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server rodando");
});
