
// server.js
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Armazenamento temporário de pagamentos
let pagamentos = {};

// Rota raiz
app.get('/', (req, res) => {
  res.send('Servidor rodando, backend do site romântico OK! ❤️');
});

// Webhook Mercado Pago
app.post('/webhook', (req, res) => {
  console.log('Webhook recebido:', req.body);

  const paymentId = req.body.data?.id || 'desconhecido';
  const status = req.body.type === 'payment' && req.body.data?.status === 'approved' ? 'approved' : 'pending';

  pagamentos[paymentId] = {
    status,
    data: req.body.data || {}
  };

  res.status(200).send('OK');
});

// Consultar pagamento
app.get('/check-payment/:id', (req, res) => {
  const { id } = req.params;
  if (pagamentos[id] && pagamentos[id].status === 'approved') {
    res.json({ pago: true });
  } else {
    res.json({ pago: false });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

