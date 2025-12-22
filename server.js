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
    const mp = await axios.post(
      "https://api.mercadopago.com/v1/payments",
      {
        transaction_amount: 9.99,
        description: "Site Romântico Premium",
        payment_method_id: "pix",
        payer: { email: "cliente@site.com" },
        notification_url: `${req.protocol}://${req.get("host")}/webhook`,
        metadata: req.body
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
      status: "pending",
      metadata: mp.data.metadata,
      createdAt: new Date()
    });

    const pix = mp.data.point_of_interaction.transaction_data;

    res.json({
      payment_id: String(mp.data.id),
      qr_base64: pix.qr_code_base64,
      copia_cola: pix.qr_code
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Erro pagamento" });
  }
});

/* =====================
   WEBHOOK
===================== */
app.post("/webhook", (req, res) => {
  res.sendStatus(200);

  (async () => {
    try {
      const paymentId = String(req.body?.data?.id);
      if (!paymentId) return;

      const mp = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
      );

      if (mp.data.status === "approved") {
        await payments.updateOne(
          { paymentId },
          { $set: { status: "approved" } }
        );
      }
    } catch {}
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
   SUCCESS
===================== */
app.get("/success.html", async (req, res) => {
  const pay = await payments.findOne({
    paymentId: String(req.query.payment_id),
    status: "approved"
  });

  if (!pay) {
    return res.sendFile(path.join(__dirname, "public/aguardando.html"));
  }

  let user = await users.findOne({ paymentId: pay.paymentId });

  if (!user) {
    const id = uuidv4();
    const link = `${req.protocol}://${req.get("host")}/user.html?id=${id}`;
    const qr = await QRCode.toDataURL(link);

    user = {
      _id: id,
      paymentId: pay.paymentId,
      ...pay.metadata,
      qr
    };

    await users.insertOne(user);
  }

  let html = fs.readFileSync(
    path.join(__dirname, "public/success.html"),
    "utf8"
  );

  html = html
    .replace("{{QR}}", `<img src="${user.qr}">`)
    .replace("{{LINK}}", `${req.protocol}://${req.get("host")}/user.html?id=${user._id}`);

  res.send(html);
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
