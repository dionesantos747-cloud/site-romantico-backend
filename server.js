// server.js
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Simula armazenamento de pagamentos (em memória)
let pagamentos = {};

// Rota raiz
app.get('/', (req, res) => {
  res.send('Servidor rodando, backend do site romântico OK! ❤️');
});

// Webhook Mercado Pago
app.post('/webhook', (req, res) => {
  console.log('Webhook recebido:', req.body);

  // Exemplo: extrair id do pagamento
  const paymentId = req.body.data?.id || 'desconhecido';
  pagamentos[paymentId] = {
    status: req.body.type || 'desconhecido',
    data: req.body.data || {}
  };

  res.status(200).send('OK');
});

// Consultar pagamento
app.get('/check-payment/:id', (req, res) => {
  const { id } = req.params;
  if (pagamentos[id]) {
    res.json({ success: true, payment: pagamentos[id] });
  } else {
    res.json({ success: false, message: 'Pagamento não encontrado' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

