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

/* =====================
   1️⃣ Criar usuário (antes do pagamento)
   ===================== */
app.post("/create", (req, res) => {
  const { nome, mensagem, carta, dataInicio, fotos, musica } = req.body;
  const id = uuidv4();

  const users = loadUsers();
  users[id] = {
    nome,
    mensagem,
    carta,
    dataInicio,
    fotos,
    musica,
    pago: false // ainda não pago
  };
  saveUsers(users);

  // Retorna apenas o ID, sem gerar link ou QRcode
  res.json({ id });
});

/* =====================
   2️⃣ Webhook do Mercado Pago
   ===================== */
app.post("/webhook", async (req, res) => {
  const { external_reference, status } = req.body; 
  // 'external_reference' deve ser o UUID do usuário enviado no pagamento
  if (status === "approved") {
    const users = loadUsers();
    if (users[external_reference]) {
      users[external_reference].pago = true;
      saveUsers(users);

      // Gerar QR code do link único agora que o pagamento foi aprovado
      const link = `${req.protocol}://${req.get("host")}/user.html?id=${external_reference}`;
      const qrData = await QRCode.toDataURL(link, { color: { dark: "#ff5fa2", light: "#fff0" } });

      // Salva o QR code no usuário (opcional, pode salvar no JSON)
      users[external_reference].qrData = qrData;
      saveUsers(users);

      console.log(`Pagamento aprovado e link gerado para: ${external_reference}`);
    }
  }
  res.sendStatus(200);
});

/* =====================
   3️⃣ Página do usuário
   ===================== */
app.get("/user.html", (req, res) => {
  const { id } = req.query;
  const users = loadUsers();
  if (!users[id]) return res.status(404).send("Usuário não encontrado");
  if (!users[id].pago) return res.send("Pagamento ainda não confirmado!");
  res.sendFile(path.join(__dirname, "public/user.html"));
});

/* =====================
   4️⃣ Página de sucesso
   ===================== */
app.get("/success.html", (req, res) => {
  const { id } = req.query;
  const users = loadUsers();
  if (!users[id]) return res.status(404).send("Usuário não encontrado");

  if (!users[id].pago) {
    // Aguardar pagamento
    return res.send(`
      <html><body style="background:#000;color:#fff;text-align:center;font-family:'Playfair Display', serif;">
      <h1>Pagamento em processamento 💖</h1>
      <p>Assim que confirmado, o link e QR code serão liberados.</p>
      </body></html>
    `);
  }

  const link = `${req.protocol}://${req.get("host")}/user.html?id=${id}`;
  const qrData = users[id].qrData;

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

/* =====================
   5️⃣ Rodar servidor
   ===================== */
app.listen(PORT, () => console.log(`Server rodando na porta ${PORT}`));
