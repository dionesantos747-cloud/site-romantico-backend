// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const app = express();
const port = process.env.PORT || 10000;

/* ===============================
   CONFIGURAÇÕES BÁSICAS
================================ */
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/* 👉 ISSO É O MAIS IMPORTANTE 👇
   Permite que o editor.html funcione
*/
app.use(express.static(path.join(__dirname, "public")));

/* ===============================
   MERCADO PAGO
================================ */
const mpToken = process.env.MP_ACCESS_TOKEN;

async function verificarPagamentoMercadoPago(paymentId) {
  try {
    const res = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${mpToken}`,
        },
      }
    );
    return res.data;
  } catch (err) {
    console.error("Erro MP:", err.response?.data || err.message);
    return null;
  }
}

/* ===============================
   MULTER (UPLOAD)
================================ */
const upload = multer({ dest: "uploads/" });

/* ===============================
   BANCO SIMPLES (MEMÓRIA)
================================ */
let sitesCriados = {};

/* ===============================
   ROTAS
================================ */

// Rota raiz (teste)
app.get("/", (req, res) => {
  res.send("Backend do site romântico ativo ❤️");
});

/* ===============================
   WEBHOOK MERCADO PAGO
================================ */
app.post("/webhook", async (req, res) => {
  const paymentId = req.body?.data?.id;
  if (!paymentId) return res.sendStatus(200);

  const pagamento = await verificarPagamentoMercadoPago(paymentId);

  if (
    pagamento &&
    pagamento.status === "approved" &&
    sitesCriados[paymentId]
  ) {
    sitesCriados[paymentId].liberado = true;
    console.log("Pagamento aprovado:", paymentId);
  }

  res.sendStatus(200);
});

/* ===============================
   CRIAR SITE FINAL
================================ */
app.post(
  "/create-site/:id",
  upload.fields([
    { name: "fotos", maxCount: 3 },
    { name: "musica", maxCount: 1 },
  ]),
  (req, res) => {
    const { id } = req.params;
    const { nome, mensagem, carta, fundo, data } = req.body;

    const fotos = req.files["fotos"] || [];
    const musica = req.files["musica"] ? req.files["musica"][0] : null;

    const siteFolder = path.join(__dirname, "sites", id);
    fs.mkdirSync(siteFolder, { recursive: true });

    /* Salvar fotos */
    const fotosHtml = fotos
      .map((f, i) => {
        const ext = path.extname(f.originalname);
        const dest = `foto${i + 1}${ext}`;
        fs.renameSync(f.path, path.join(siteFolder, dest));
        return `<div class="photo"><img src="${dest}"></div>`;
      })
      .join("\n");

    /* Salvar música */
    let musicaHtml = "";
    if (musica) {
      const ext = path.extname(musica.originalname);
      const dest = `musica${ext}`;
      fs.renameSync(musica.path, path.join(siteFolder, dest));
      musicaHtml = `<audio controls src="${dest}"></audio>`;
    }

    /* HTML FINAL DO CLIENTE (SEM EDITOR) */
    const htmlFinal = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${nome} ❤️</title>
<link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&display=swap" rel="stylesheet">
<style>
body{
  margin:0;
  background:#000;
  color:#fff;
  font-family:Arial,sans-serif;
  text-align:center;
}
.photo{
  background:#fff;
  padding:10px 10px 28px;
  border-radius:4px;
  max-width:280px;
  margin:20px auto;
  box-shadow:0 0 18px rgba(255,255,255,.4);
}
.photo img{width:100%}
audio{margin:20px auto;display:block}
.mensagem{
  font-family:'Dancing Script',cursive;
  font-size:1.8em;
}
</style>
</head>
<body class="${fundo}">
${musicaHtml}
<h1>${nome}</h1>
<div class="mensagem">${mensagem}</div>
<p>${carta}</p>
${fotosHtml}
</body>
</html>
`;

    fs.writeFileSync(path.join(siteFolder, "index.html"), htmlFinal);

    sitesCriados[id] = {
      liberado: false,
      link: `${process.env.RENDER_EXTERNAL_URL}/sites/${id}/index.html`,
    };

    res.json({
      success: true,
      message: "Site criado. Aguarde confirmação do pagamento.",
    });
  }
);

/* ===============================
   SERVIR SITES FINAIS
================================ */
app.use("/sites", express.static(path.join(__dirname, "sites")));

/* ===============================
   START
================================ */
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

