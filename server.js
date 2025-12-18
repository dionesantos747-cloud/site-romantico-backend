const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const shortid = require('shortid');
const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Pastas de upload
const uploadFotos = multer({ dest: 'uploads/fotos/' });
const uploadMusicas = multer({ dest: 'uploads/musicas/' });

// Simula banco de dados
let sites = {}; // { siteId: { nome, mensagem, carta, data, fotos[], musica } }
let pagamentos = {}; // { paymentId: true }

// ROOT
app.get('/', (req,res)=>res.send('Servidor rodando, backend do site romântico OK! ❤️'));

// SALVAR SITE (com arquivos)
app.post('/save-site', uploadFotos.array('fotos'), uploadMusicas.single('musica'), (req,res)=>{
  const { nome, mensagem, carta, data } = req.body;
  const siteId = shortid.generate();

  let fotosURLs = [];
  if(req.files && req.files.length>0){
    fotosURLs = req.files.map(f => `/uploads/fotos/${f.filename}`);
  }

  let musicaURL = '';
  if(req.file) musicaURL = `/uploads/musicas/${req.file.filename}`;

  sites[siteId] = { nome, mensagem, carta, data, fotos: fotosURLs, musica: musicaURL, pago:false };
  res.json({ success:true, siteId });
});

// CONSULTAR PAGAMENTO
app.get('/latest-payment/:siteId', (req,res)=>{
  const { siteId } = req.params;
  if(!sites[siteId]) return res.json({ success:false });
  res.json({ pago: sites[siteId].pago });
});

// WEBHOOK MERCADO PAGO
app.post('/webhook', (req,res)=>{
  const paymentId = req.body.data?.id || 'desconhecido';
  const siteId = req.body.additional_info?.siteId; // enviar siteId como info adicional
  if(siteId && sites[siteId]){
    sites[siteId].pago = true;
  }
  pagamentos[paymentId] = true;
  res.status(200).send('OK');
});

// SERVIR SITE SALVO
app.get('/site/:siteId', (req,res)=>{
  const { siteId } = req.params;
  const site = sites[siteId];
  if(!site) return res.status(404).send('Site não encontrado');

  let fotosHtml = site.fotos.map(f => `<img src="${f}" class="foto">`).join('');
  res.send(`
    <html>
      <head>
        <title>Para ${site.nome}</title>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Dancing+Script:wght@600&display=swap" rel="stylesheet">
        <style>
          body{background:#000;color:#fff;font-family:'Playfair Display',serif;text-align:center;padding:20px;}
          .foto{width:90%;max-width:340px;border-radius:30px;border:4px solid #ffb3d9;margin:18px auto;display:block;}
        </style>
      </head>
      <body>
        <h1>${site.nome}</h1>
        <p style="font-family:'Dancing Script',cursive;font-size:1.6em;">${site.mensagem}</p>
        ${fotosHtml}
        ${site.musica ? `<audio controls src="${site.musica}"></audio>` : ''}
        <p style="font-family:'Dancing Script',cursive;font-size:1.5em;">${site.carta}</p>
      </body>
    </html>
  `);
});

// SERVIR UPLOADS
app.use('/uploads', express.static('uploads'));

// START
app.listen(port, ()=>console.log(`Servidor rodando na porta ${port}`));

