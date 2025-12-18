// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

// Armazenamento em memória (pode trocar por banco real)
let pagamentos = {};   // status dos pagamentos
let sitesCriados = {}; // dados dos sites românticos

// Rota raiz
app.get('/', (req, res) => {
  res.send('Servidor rodando, backend do site romântico OK! ❤️');
});

// Webhook Mercado Pago
app.post('/webhook', (req, res) => {
  console.log('Webhook recebido:', req.body);

  // ID do pagamento
  const paymentId = req.body.data?.id || 'desconhecido';

  // Armazena status
  pagamentos[paymentId] = {
    status: req.body.type || 'desconhecido',
    data: req.body.data || {}
  };

  // Aqui você pode salvar o site romântico liberando o link e QR code
  if(req.body.type === 'payment' || req.body.type === 'payment.updated'){
    if(req.body.data?.status === 'approved'){
      // Marcar como liberado
      sitesCriados[paymentId] = {
        liberado: true,
        link: req.body.data?.external_reference || '', // se tiver referência
        qrCode: `https://seu-site-romantico.com/?id=${paymentId}`
      };
    }
  }

  res.status(200).send('OK');
});

// Consultar status do pagamento
app.get('/check-payment/:id', (req, res) => {
  const { id } = req.params;
  if(pagamentos[id] && sitesCriados[id]?.liberado){
    res.json({ success: true, link: sitesCriados[id].link, qrCode: sitesCriados[id].qrCode });
  } else {
    res.json({ success: false, message: 'Pagamento não aprovado ou site não liberado ainda' });
  }
});

// Criar site romântico (exemplo de armazenamento)
app.post('/create-site/:id', (req, res) => {
  const { id } = req.params;
  const { nome, mensagem, carta, fotos, fundo, musica } = req.body;

  // Armazena os dados
  sitesCriados[id] = {
    liberado: false, // só libera após pagamento aprovado
    nome,
    mensagem,
    carta,
    fotos,
    fundo,
    musica
  };

  res.json({ success: true, message: 'Site criado com sucesso, aguarde pagamento' });
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

