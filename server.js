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
   Middlewares
===================== */
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

/* =====================
   Variáveis de ambiente
===================== */
const MONGO_URI = process.env.MONGO_URI;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI não definida");
  process.exit(1);
}

if (!MP_ACCESS_TOKEN) {
  console.error("❌ MP_ACCESS_TOKEN não definido");
  process.exit(1);
}

/* =====================
   MongoDB Atlas
===================== */
const client = new MongoClient(MONGO_URI);
let usersCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db("site-romantico");
    usersCollection = db.collection("users");
    console.log("✅ MongoDB conectado");
  } catch (err) {
    console.error("❌ Erro ao conectar MongoDB:", err);
    process.exit(1);
  }
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

    // Consulta pagamento real no Mercado Pago
    const mpResponse = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`
        }
      }
    );

    const payment = mpResponse.data;

    // Só continua se aprovado
    if (payment.status !== "approved") {
      return res.sendStatus(200);
    }

    // Evita duplicação
    const exists = await usersCollection.findOne({ paymentId });
    if (exists) return res.sendStatus(200);

    // Dados enviados via metadata no pagamento
    const data = payment.metadata || {};

    const id = uuidv4();
    const link = `${req.protocol}://${req.get("host")}/user.html?id=${id}`;

    const qrData = await QRCode.toDataURL(link, {
      color: { dark: "#ff5fa2", light: "#fff0" }
    });

    await usersCollection.insertOne({
      _id: id,
      paymentId,
      nome: data.nome || "",
      mensagem: data.mensagem || "",
      carta: data.carta || "",
      dataInicio: data.dataInicio || "",
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
   Página do usuário (site final)
===================== */
app.get("/user.html", async (req, res) => {
  const { id } = req.query;

  if (!id) return res.status(400).send("ID inválido");

  const user = await usersCollection.findOne({ _id: id });
  if (!user) return res.status(404).send("Site não encontrado");

  // HTML apenas visual — dados carregados via JS se quiser
  res.sendFile(path.join(__dirname, "public/user.html"));
});

/* =====================
   Página de sucesso (pós-pagamento)
===================== */
app.get("/success.html", async (req, res) => {
  const { payment_id } = req.query;

  if (!payment_id) {
    return res.send("Pagamento não identificado");
  }

  const user = await usersCollection.findOne({
    paymentId: Number(payment_id)
  });

  // Pagamento ainda não processado
  if (!user) {
    return res.send(`
      <html>
        <body style="background:black;color:white;text-align:center;padding:40px">
          <h1>Pagamento em processamento 💖</h1>
          <p>Assim que for confirmado, seu site será liberado.</p>
        </body>
      </html>
    `);
  }

  let html = fs.readFileSync(
    path.join(__dirname, "public/success.html"),
    "utf8"
  );

  const link = `${req.protocol}://${req.get("host")}/user.html?id=${user._id}`;

  html = html
    .replace("{{QR_CODE}}", `<img src="${user.qrData}" />`)
    .replace("{{LINK}}", link);

  res.send(html);
});

/* =====================
   Start server
===================== */
app.listen(PORT, () => {
  console.log(`🚀 Server rodando na porta ${PORT}`);
});
