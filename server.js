const express = require("express");
const bodyParser = require("body-parser");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

// MongoDB Atlas
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ Variável de ambiente MONGO_URI não definida!");
  process.exit(1);
}

const client = new MongoClient(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

let usersCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db("site-romantico");
    usersCollection = db.collection("users");
    console.log("✅ Conectado ao MongoDB Atlas!");
  } catch (err) {
    console.error("❌ Erro ao conectar MongoDB:", err);
    process.exit(1);
  }
}
connectDB();

/* =====================
   Rota raiz "/" → editor.html
   ===================== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/editor.html"));
});

/* =====================
   Criar usuário (antes do pagamento)
   ===================== */
app.post("/create", async (req, res) => {
  const { nome, mensagem, carta, dataInicio, fotos, musica } = req.body;
  const id = uuidv4();

  const userData = {
    _id: id,
    nome,
    mensagem,
    carta,
    dataInicio,
    fotos,
    musica,
    pago: false,
    qrData: null
  };

  try {
    await usersCollection.insertOne(userData);
    res.json({ id });
  } catch (err) {
    console.error("Erro ao criar usuário:", err);
    res.status(500).send("Erro ao criar usuário");
  }
});

/* =====================
   Webhook Mercado Pago
   ===================== */
app.post("/webhook", async (req, res) => {
  const { external_reference, status } = req.body;

  if (status === "approved") {
    const link = `${req.protocol}://${req.get("host")}/user.html?id=${external_reference}`;
    const qrData = await QRCode.toDataURL(link, { color: { dark: "#ff5fa2", light: "#fff0" } });

    try {
      await usersCollection.updateOne(
        { _id: external_reference },
        { $set: { pago: true, qrData } }
      );
      console.log(`✅ Pagamento aprovado e QR code gerado para: ${external_reference}`);
    } catch (err) {
      console.error("Erro ao atualizar usuário no webhook:", err);
    }
  }

  res.sendStatus(200);
});

/* =====================
   Página do usuário
   ===================== */
app.get("/user.html", async (req, res) => {
  const { id } = req.query;
  try {
    const user = await usersCollection.findOne({ _id: id });
    if (!user) return res.status(404).send("Usuário não encontrado");
    if (!user.pago) return res.send("Pagamento ainda não confirmado!");
    res.sendFile(path.join(__dirname, "public/user.html"));
  } catch (err) {
    console.error("Erro ao buscar usuário:", err);
    res.status(500).send("Erro interno");
  }
});

/* =====================
   Página de sucesso
   ===================== */
app.get("/success.html", async (req, res) => {
  const { id } = req.query;
  try {
    const user = await usersCollection.findOne({ _id: id });
    if (!user) return res.status(404).send("Usuário não encontrado");

    if (!user.pago) {
      return res.send(`
        <html><body style="text-align:center;font-family:'Playfair Display', serif;color:#fff;background:#000;padding:40px;">
          <h1>Pagamento em processamento 💖</h1>
          <p>Assim que confirmado, o link e QR code serão liberados.</p>
        </body></html>
      `);
    }

    const link = `${req.protocol}://${req.get("host")}/user.html?id=${id}`;
    const qrData = user.qrData;

    res.send(`
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>Obrigado!</title>
        <style>
          body{background:#000;color:#fff;font-family:'Playfair Display', serif;text-align:center;padding:40px;}
          img{width:250px;height:250px;margin:20px;border-radius:20px;box-shadow:0 0 20px #ff5fa2;}
          h1{color:#ff5fa2;}
          p{font-size:1.4em;}
          a{color:#ffd400;font-weight:bold;text-decoration:none;}
        </style>
      </head>
      <body>
        <h1>Obrigado pela compra! 💖</h1>
        <p>Compartilhe o link com quem você ama ou escaneie o QR code:</p>
        <img src="${qrData}" alt="QR Code">
        <p><a href="${link}">Acesse seu site personalizado</a></p>
      </body>
      </html>
    `);

  } catch (err) {
    console.error("Erro ao acessar success:", err);
    res.status(500).send("Erro interno");
  }
});

/* =====================
   Rodar servidor
   ===================== */
app.listen(PORT, () => console.log(`Server rodando na porta ${PORT}`));
