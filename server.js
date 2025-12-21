const express = require("express");
const bodyParser = require("body-parser");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;

/* =====================
   MIDDLEWARES
===================== */
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

/* =====================
   VARIÁVEIS DE AMBIENTE
===================== */
const MONGO_URI = process.env.MONGO_URI;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

/* ⚠️ NÃO ENCERRA O SERVIDOR (evita erro no Render) */
if (!MONGO_URI) console.warn("⚠️ MONGO_URI não definida");
if (!MP_ACCESS_TOKEN) console.warn("⚠️ MP_ACCESS_TOKEN não definido");

/* =====================
   MONGODB
===================== */
let usersCollection = null;

(async () => {
  try {
    if (!MONGO_URI) return;

    const client = new MongoClient(MONGO_URI);
    await client.connect();

    const db = client.db("site-romantico");
    usersCollection = db.collection("users");

    console.log("✅ MongoDB conectado");
  } catch (err) {
    console.error("❌ Erro MongoDB:", err.message);
  }
})();

/* =====================
   ROTAS
===================== */

/* Página inicial */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/editor.html"));
});

/* Criar pagamento PIX */
app.post("/create-payment", async (req, res) => {
  try {
    const payment = await axios.post(
      "https://api.mercadopago.com/v1/payments",
      {
        transaction_amount: 9.99,
        description: "Site Romântico Premium 💖",
        payment_method_id: "pix",
        payer: { email: "cliente@email.com" },
        metadata: req.body
      },
      {
        headers: {
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    const pix = payment.data.point_of_interaction.transaction_data;

    res.json({
      payment_id: payment.data.id,
      qr_code: pix.qr_code_base64,
      qr_code_text: pix.qr_code
    });

  } catch (err) {
    console.error("❌ Erro pagamento:", err.message);
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
});

/* Webhook Mercado Pago */
app.post("/webhook", async (req, res) => {
  try {
    if (!usersCollection) return res.sendStatus(200);

    const paymentId = req.body?.data?.id;
    if (!paymentId) return res.sendStatus(200);

    const mp = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
    );

    if (mp.data.status !== "approved") return res.sendStatus(200);

    const exists = await usersCollection.findOne({ paymentId });
    if (exists) return res.sendStatus(200);

    const id = uuidv4();
    const link = `${req.protocol}://${req.get("host")}/user.html?id=${id}`;
    const qrData = await QRCode.toDataURL(link);

    await usersCollection.insertOne({
      _id: id,
      paymentId,
      ...mp.data.metadata,
      pago: true,
      qrData,
      createdAt: new Date()
    });

    console.log("💖 Pagamento aprovado | Site criado:", id);
    res.sendStatus(200);

  } catch (err) {
    console.error("❌ Webhook erro:", err.message);
    res.sendStatus(200);
  }
});

/* Verificar pagamento (aguardando.html) */
app.get("/check-payment", async (req, res) => {
  if (!usersCollection) return res.json({ status: "pending" });

  const user = await usersCollection.findOne({
    paymentId: Number(req.query.payment_id)
  });

  res.json({ status: user ? "approved" : "pending" });
});

/* Site do usuário */
app.get("/user.html", async (req, res) => {
  if (!usersCollection) return res.send("Serviço indisponível");
  const user = await usersCollection.findOne({ _id: req.query.id });
  if (!user) return res.status(404).send("Site não encontrado");
  res.sendFile(path.join(__dirname, "public/user.html"));
});

/* Página de sucesso */
app.get("/success.html", async (req, res) => {
  if (!usersCollection) return res.send("Processando pagamento...");
  const user = await usersCollection.findOne({
    paymentId: Number(req.query.payment_id)
  });

  if (!user) {
    return res.sendFile(path.join(__dirname, "public/aguardando.html"));
  }

  let html = fs.readFileSync(
    path.join(__dirname, "public/success.html"),
    "utf8"
  );

  html = html
    .replace("{{QR_CODE}}", `<img src="${user.qrData}">`)
    .replace(
      "{{LINK}}",
      `${req.protocol}://${req.get("host")}/user.html?id=${user._id}`
    );

  res.send(html);
});

/* =====================
   START SERVER (RENDER OK)
===================== */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server rodando na porta ${PORT}`);
});
