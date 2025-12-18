// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
const port = process.env.PORT || 10000;

// Token Mercado Pago (da variável de ambiente)
const mpToken = process.env.MP_ACCESS_TOKEN;
console.log('Token Mercado Pago carregado:', mpToken);

app.use(cors());
app.use(bodyParser.json());

// Configuração multer
const upload = multer({ dest: 'uploads/' });

// Persistência simples
let pagamentos = {};   // status dos pagamentos
let sitesCriados = {}; // informações do site (link, pasta, qrCode)

// Rota raiz
app.get('/', (req, res) => {
  res.send('Servidor rodando, backend do site romântico OK! ❤️');
});

// Função para consultar pagamento no Mercado Pago
async function verificarPagamentoMercadoPago(paymentId) {
  try {
    const res = await axios.get(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${mpToken}`
      }
    });
    return res.data;
  } catch(err) {
    console.error('Erro ao consultar pagamento:', err.response?.data || err.message);
    return null;
  }
}

// Webhook Mercado Pago
app.post('/webhook', async (req, res) => {
  console.log('Webhook recebido:', req.body);

  const paymentId = req.body.data?.id || 'desconhecido';

  pagamentos[paymentId] = {
    status: req.body.type || 'desconhecido',
    data: req.body.data || {}
  };

  // Consultar status real do pagamento
  const pagamentoInfo = await verificarPagamentoMercadoPago(paymentId);

  if(pagamentoInfo?.status === 'approved' && sitesCriados[paymentId]){
    sitesCriados[paymentId].liberado = true;
    console.log(`Pagamento ${paymentId} aprovado! Site liberado.`);
  }

  res.status(200).send('OK');
});

// Consultar status do pagamento
app.get('/check-payment/:id', (req, res) => {
  const { id } = req.params;
  if(sitesCriados[id] && sitesCriados[id].liberado){
    res.json({ 
      success: true, 
      qrCode: sitesCriados[id].qrCode,
      link: sitesCriados[id].qrCode
    });
  } else {
    res.json({ success: false, message: 'Pagamento não aprovado ou site não liberado ainda' });
  }
});

// Criar site romântico
app.post('/create-site/:id', upload.fields([{ name: 'fotos' }, { name: 'musica', maxCount:1 }]), (req, res) => {
  const { id } = req.params;
  const { nome, mensagem, carta, fundo } = req.body;
  const fotos = req.files['fotos'] || [];
  const musica = req.files['musica'] ? req.files['musica'][0] : null;

  const siteFolder = path.join(__dirname, 'sites', id);
  if(!fs.existsSync(siteFolder)) fs.mkdirSync(siteFolder, { recursive:true });

  // Mover arquivos
  fotos.forEach((f,i)=>{
    const ext = path.extname(f.originalname);
    fs.renameSync(f.path, path.join(siteFolder, `foto${i+1}${ext}`));
  });
  if(musica){
    const ext = path.extname(musica.originalname);
    fs.renameSync(musica.path, path.join(siteFolder, `musica${ext}`));
  }

  // Gerar HTML do site romântico
  const fotosHtml = fotos.map((f,i)=>{
    const ext = path.extname(f.originalname);
    return `<img src="foto${i+1}${ext}" class="foto">`;
  }).join('\n');

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
    liberado: false, // só libera após pagamento aprovado
    pasta: siteFolder,
    qrCode: `https://${process.env.RENDER_EXTERNAL_URL}/sites/${id}/index.html`
  };

  res.json({ success:true, message:'Site criado com sucesso, aguarde pagamento.' });
});

// Servir sites estáticos
app.use('/sites', express.static(path.join(__dirname, 'sites')));

// Start server
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

