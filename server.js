// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());
app.use('/sites', express.static(path.join(__dirname, 'sites')));

// Multer para uploads temporários
const upload = multer({ dest: 'tmp/' });

// Armazenamento em memória
let pagamentos = {};   // status dos pagamentos
let sitesCriados = {}; // dados dos sites românticos

// Rota raiz
app.get('/', (req, res) => {
  res.send('Servidor rodando, backend do site romântico OK! ❤️');
});

// Criar site romântico
app.post('/create-site/:id', upload.fields([
  { name: 'fotos' },
  { name: 'musica', maxCount: 1 }
]), async (req, res) => {
  const { id } = req.params;
  const { nome, mensagem, carta, fundo } = req.body;
  const fotos = req.files['fotos'] || [];
  const musica = req.files['musica'] ? req.files['musica'][0] : null;

  const siteFolder = path.join(__dirname, 'sites', id);
  if(!fs.existsSync(siteFolder)) fs.mkdirSync(siteFolder, { recursive:true });

  // Mover arquivos
  fotos.forEach((f,i)=>{
    fs.renameSync(f.path, path.join(siteFolder, `foto${i+1}${path.extname(f.originalname)}`));
  });
  if(musica) fs.renameSync(musica.path, path.join(siteFolder, `musica${path.extname(musica.originalname)}`));

  // Gerar HTML do site romântico
  const fotosHtml = fotos.map((f,i)=>`<img src="foto${i+1}${path.extname(f.originalname)}" class="foto">`).join('\n');
  const musicaHtml = musica ? `<audio controls src="musica${path.extname(musica.originalname)}"></audio>` : '';
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${nome} ❤️</title>
<style>
body{margin:0;background:#000;color:#fff;font-family:Arial,sans-serif;text-align:center;}
.foto{width:80%;max-width:400px;margin:20px auto;border-radius:20px;border:3px solid #ffb3d9;}
audio{width:80%;margin:20px auto;display:block;}
h1,h2{color:#ffb3d9;}
body{background:${fundo || 'black'};}
</style>
</head>
<body>
<h1>${nome}</h1>
<h2>${mensagem}</h2>
<p>${carta}</p>
${fotosHtml}
${musicaHtml}
</body>
</html>
`;

  fs.writeFileSync(path.join(siteFolder, 'index.html'), html);

  // Salvar info no backend
  sitesCriados[id] = {
    liberado: false,
    pasta: siteFolder,
    qrCode: `https://${process.env.RENDER_EXTERNAL_URL || 'site-romantico-backend.onrender.com'}/sites/${id}/index.html`
  };

  res.json({ success:true, message:'Site criado com sucesso, aguarde pagamento.' });
});

// Webhook Mercado Pago
app.post('/webhook', (req,res)=>{
  const paymentId = req.body.data?.id || 'desconhecido';
  pagamentos[paymentId] = {
    status: req.body.type || 'desconhecido',
    data: req.body.data || {}
  };

  if(['payment','payment.updated'].includes(req.body.type)){
    if(req.body.data?.status === 'approved' && sitesCriados[paymentId]){
      sitesCriados[paymentId].liberado = true;
    }
  }

  res.status(200).send('OK');
});

// Consultar pagamento
app.get('/check-payment/:id', (req,res)=>{
  const { id } = req.params;
  if(sitesCriados[id]?.liberado){
    res.json({ success:true, site: sitesCriados[id] });
  } else {
    res.json({ success:false, message:'Pagamento não aprovado ou site não liberado ainda' });
  }
});

app.listen(port, ()=>console.log(`Servidor rodando na porta ${port}`));

