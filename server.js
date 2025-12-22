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
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/editor.html"));
});
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

    // ✅ 1. CRIA ID TEMPORÁRIO DO SITE
    const tempId = uuidv4();

    // ✅ 2. SALVA DADOS DO USUÁRIO ANTES DO PAGAMENTO
    await users.insertOne({
      _id: tempId,
      status: "pending",
      createdAt: new Date(),
      ...req.body
    });

    // ✅ 3. CRIA PAGAMENTO NO MERCADO PAGO
    const mp = await axios.post(
      "https://api.mercadopago.com/v1/payments",
      {
        transaction_amount: 9.99,
        description: "Site Romântico Premium 💖",
        payment_method_id: "pix",
        payer: { email: "cliente@site.com" },

        // 🔥 ENVIA APENAS O ID (NÃO DADOS GRANDES)
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

    // ✅ 4. SALVA PAGAMENTO
    await payments.insertOne({
      paymentId: String(mp.data.id),
      userId: tempId,
      status: "pending",
      createdAt: new Date()
    });

    // ✅ 5. RETORNA PIX PARA O FRONT
    const pix = mp.data.point_of_interaction.transaction_data;

    res.json({
      payment_id: String(mp.data.id),
      qr_base64: pix.qr_code_base64,
      copia_cola: pix.qr_code
    });

  } catch (err) {
    console.error("Erro pagamento:", err.message);
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
});

/* =====================
   WEBHOOK MERCADO PAGO
===================== */
app.post("/webhook", (req, res) => {

  // ⚠️ RESPONDE IMEDIATAMENTE AO MP (evita erro 502)
  res.sendStatus(200);

  // 🔄 PROCESSA EM BACKGROUND
  (async () => {
    try {
      const paymentId = String(req.body?.data?.id);
      if (!paymentId) return;

      // 🔎 CONSULTA O MERCADO PAGO (fonte da verdade)
      const mp = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${MP_ACCESS_TOKEN}`
          }
        }
      );

      // ❌ SE NÃO APROVADO, IGNORA
      if (mp.data.status !== "approved") return;

      const userId = mp.data.metadata?.userId;
      if (!userId) return;

      // ✅ ATUALIZA PAGAMENTO
      await payments.updateOne(
        { paymentId },
        { $set: { status: "approved", approvedAt: new Date() } }
      );

      // ✅ ATIVA O USUÁRIO (SITE ÚNICO)
      await users.updateOne(
        { _id: userId },
        {
          $set: {
            status: "approved",
            paymentId: paymentId,
            activatedAt: new Date()
          }
        }
      );

      console.log("💖 Pagamento aprovado | Site ativado:", userId);

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

    if (mp.data.status === "approved") {
      return res.json({ status: "approved" });
    }

    res.json({ status: "pending" });

  } catch (err) {
    // evita quebrar o fluxo por erro momentâneo do MP
    console.error("check-payment:", err.response?.status || err.message);
    res.json({ status: "pending" });
  }
});

/* =====================
   SUCCESS (DINÂMICO)
===================== */
app.get("/success.html", async (req, res) => {
  try {
    const paymentId = String(req.query.payment_id);

    const pay = await payments.findOne({
      paymentId,
      status: "approved"
    });

    if (!pay) {
      return res.sendFile(path.join(__dirname, "public/aguardando.html"));
    }

    let user = await users.findOne({ paymentId });

    if (!user) {
      const id = uuidv4();
      const link = `${req.protocol}://${req.get("host")}/user.html?id=${id}`;
      const qr = await QRCode.toDataURL(link);

      user = {
        _id: id,
        paymentId,
        ...pay.metadata,
        qr,
        createdAt: new Date()
      };

      await users.insertOne(user);
    }

    let html = fs.readFileSync(
      path.join(__dirname, "views/success.html"),
      "utf8"
    );

    html = html
      .replace("{{QR}}", `<img src="${user.qr}" alt="QR Code">`)
      .replace("{{LINK}}", `${req.protocol}://${req.get("host")}/user.html?id=${user._id}`);

    res.send(html);

  } catch (err) {
    console.error("Erro success:", err.message);
    res.status(500).send("Erro ao gerar página de sucesso");
  }
});

/* =====================
   USER DATA
===================== */
app.get("/user-data", async (req, res) => {
  const user = await users.findOne({ _id: req.query.id });
  res.json(user);
});

/* =====================
   START
===================== */
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server rodando");
});
