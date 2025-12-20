const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

const upload = multer({ dest: 'uploads/' });

let sitesCriados = {};

app.get('/', (req, res) => {
  res.send('Backend do Site Romântico ativo ❤️');
});

/* WEBHOOK MERCADO PAGO */
app.post('/webhook', async (req, res) => {
  const paymentId = req.body?.data?.id;
  if (!paymentId || !sitesCriados[paymentId]) {
    return res.sendStatus(200);
  }

  try {
    const mpRes = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`
        }
      }
    );

    if (mpRes.data.status === 'approved') {
      sitesCriados[paymentId].liberado = true;
    }
  } catch (e) {
    console.error('Erro MP:', e.message);
  }

  res.sendStatus(200);
});

/* CRIA SITE FINAL */
app.post('/create-site/:id', upload.fields([
  { name: 'fotos' },
  { name: 'musica', maxCount: 1 }
]), (req, res) => {

  const { id } = req.params;
  const { nome, mensagem, carta, fundo } = req.body;

  const siteDir = path.join(__dirname, 'sites', id);
  fs.mkdirSync(siteDir, { recursive: true });

  let fotosHtml = '';
  (req.files['fotos'] || []).forEach((f, i) => {
    const ext = path.extname(f.originalname);
    const dest = `foto${i + 1}${ext}`;
    fs.renameSync(f.path, path.join(siteDir, dest));
    fotosHtml += `<img src="${dest}" class="photo">`;
  });

  let musicaHtml = '';
  if (req.files['musica']) {
    const m = req.files['musica'][0];
    const ext = path.extname(m.originalname);
    const dest = `musica${ext}`;
    fs.renameSync(m.path, path.join(siteDir, dest));
    musicaHtml = `<audio controls src="${dest}"></audio>`;
  }

  const htmlFinal = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${nome} ❤️</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{margin:0;background:#000;color:#fff;text-align:center;font-family:Arial}
.photo{
 background:#fff;padding:10px 10px 28px;
 border-radius:4px;margin:20px auto;
 max-width:280px;
 box-shadow:0 0 18px rgba(255,255,255,.45);
}
</style>
</head>
<body class="${fundo}">
${musicaHtml}
<h1>${nome}</h1>
<h2>${mensagem}</h2>
<p>${carta}</p>
${fotosHtml}
</body>
</html>
`;

  fs.writeFileSync(path.join(siteDir, 'index.html'), htmlFinal);

  sitesCriados[id] = {
    liberado: false,
    link: `https://${process.env.RENDER_EXTERNAL_URL}/sites/${id}/`
  };

  res.json({ success: true });
});

app.use('/sites', express.static(path.join(__dirname, 'sites')));

app.listen(port, () => {
  console.log('Servidor rodando na porta', port);
});

