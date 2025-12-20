const express = require("express");
const bodyParser = require("body-parser");
const fs = require("fs");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const DATA_FILE = path.join(__dirname, "data/users.json");

// Função para carregar dados
function loadUsers() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

// Função para salvar dados
function saveUsers(users) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2));
}

// Criar link único para usuário
app.post("/create", async (req, res) => {
  const { nome, mensagem, carta, dataInicio, fotos, musica } = req.body;
  const id = uuidv4();

  const users = loadUsers();
  users[id] = { nome, mensagem, carta, dataInicio, fotos, musica };
  saveUsers(users);

  // Gerar QR code do link único
  const link = `${req.protocol}://${req.get("host")}/user.html?id=${id}`;
  const qrData = await QRCode.toDataURL(link, { color: { dark: "#ff5fa2", light: "#fff0" } });

  res.json({ id, link, qrData });
});

// Webhook Mercado Pago
app.post("/webhook", (req, res) => {
  const { id, status } = req.body; // Ajuste conforme webhook do Mercado Pago
  if (status === "approved") {
    console.log(`Pagamento aprovado para: ${id}`);
    // Aqui você pode enviar e-mail, atualizar DB, etc.
  }
  res.sendStatus(200);
});

// Servir página do usuário
app.get("/user.html", (req, res) => {
  const { id } = req.query;
  const users = loadUsers();
  if (!users[id]) return res.status(404).send("Usuário não encontrado");
  res.sendFile(path.join(__dirname, "public/user.html"));
});

// Página de sucesso
app.get("/success.html", async (req, res) => {
  const { id } = req.query;
  const users = loadUsers();
  if (!users[id]) return res.status(404).send("Usuário não encontrado");

  const link = `${req.protocol}://${req.get("host")}/user.html?id=${id}`;
  const qrData = await QRCode.toDataURL(link, { color: { dark: "#ff5fa2", light: "#fff0" } });

  // Página HTML simples com QR code e agradecimento
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <title>Obrigado!</title>
      <style>
        body{background:#000;color:#fff;font-family:'Playfair Display', serif;text-align:center;padding:40px;}
        img{width:250px;height:250px;margin:20px;}
        h1{color:#ff5fa2;}
        p{font-size:1.4em;}
      </style>
    </head>
    <body>
      <h1>Obrigado pela compra! 💖</h1>
      <p>Compartilhe o link com quem você ama ou escaneie o QR code:</p>
      <img src="${qrData}" alt="QR Code">
      <p><a href="${link}" style="color:#ffd400;">Acesse seu site personalizado</a></p>
    </body>
    </html>
  `);
});

app.listen(PORT, () => console.log(`Server rodando na porta ${PORT}`));

