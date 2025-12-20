const express = require("express");
const bodyParser = require("body-parser");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const axios = require("axios");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

/* =====================
   MongoDB Atlas
   ===================== */
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI não definida");
  process.exit(1);
}

const client = new MongoClient(MONGO_URI);
let usersCollection;

async function connectDB() {
  await client.connect();
  const db = client.db("site-romantico");
  usersCollection = db.collection("users");
  console.log("✅ MongoDB conectado");
}
connectDB();

/* =====================
   Página inicial (editor)
   ===================== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/editor.html"));
});

/* =====================
   WEBHOOK MERCADO PAGO
   ===================== */
app.post("/webhook", async (req, res) => {
  try {
    const paymentId = req.body?.data?.id;
    if (!paymentId) return res.sendStatus(200);

    // Consulta pagamento real
    const mpRes = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
        }
      }
    );

    const payment = mpRes.data;

    // Só continua se aprovado
    if (payment.status !== "approved") {
      return res.sendStatus(200);
    }

    // Evita criar duplicado
    const exists = await usersCollection.findOne({ paymentId });
    if (exists) return res.sendStatus(200);

    // Dados enviados no pagamento (metadata)
    const data = payment.metadata;

    const id = uuidv4();
    const link = `${req.protocol}://${req.get("host")}/user.html?id=${id}`;
    const qrData = await QRCode.toDataURL(link, {
      color: { dark: "#ff5fa2", light: "#fff0" }
    });

    await usersCollection.insertOne({
      _id: id,
      paymentId,
      nome: data.nome,
      mensagem: data.mensagem,
      carta: data.carta,
      dataInicio: data.dataInicio,
      fotos: data.fotos || [],
      musica: data.musica || null,
      pago: true,
      qrData,
      createdAt: new Date()
    });

    console.log("💖 Site criado após pagamento:", id);
    res.sendStatus(200);

  } catch (err) {
    console.error("❌ Erro no webhook:", err.message);
    res.sendStatus(500);
  }
});

/* =====================
   Página do usuário
   ===================== */
app.get("/user.html", async (req, res) => {
  const { id } = req.query;

  const user = await usersCollection.findOne({ _id: id });
  if (!user) return res.status(404).send("Site não encontrado");

  res.sendFile(path.join(__dirname, "public/user.html"));
});

/* =====================
   Página de sucesso
   ===================== */
app.get("/success.html", async (req, res) => {
  const { payment_id } = req.query;

  const user = await usersCollection.findOne({ paymentId: Number(payment_id) });
  if (!user) {
    return res.send(`
      <html><body style="background:#000;color:#fff;text-align:center;padding:40px;">
        <h1>Pagamento em processamento 💖</h1>
        <p>Assim que confirmado, seu site será liberado.</p>
      </body></html>
    `);
  }

  const link = `${req.protocol}://${req.get("host")}/user.html?id=${user._id}`;

  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Obrigado 💖</title>
      <style>
        body{background:#000;color:#fff;text-align:center;padding:40px;font-family:Arial}
        img{width:260px;border-radius:20px;box-shadow:0 0 20px #ff5fa2}
        a{color:#ffd400;font-size:1.2em;text-decoration:none}
      </style>
    </head>
    <body>
      <h1>Obrigado pela compra 💖</h1>
      <p>Escaneie o QR Code ou clique no link:</p>
      <img src="${user.qrData}">
      <p><a href="${link}">Acessar meu site romântico</a></p>
    </body>
    </html>
  `);
});

/* =====================
   Start server
   ===================== */
app.listen(PORT, () =>
  console.log(`🚀 Server rodando na porta ${PORT}`)
);
