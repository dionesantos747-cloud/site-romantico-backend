const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Armazenamento temporário (em produção usar banco de dados)
let pagamentosAprovados = {};

// Webhook do Mercado Pago
app.post('/webhook', (req, res) => {
    const body = req.body;
    if(body.type === 'payment' && body.data && body.data.status === 'approved'){
        pagamentosAprovados[body.data.id] = true;
        console.log('Pagamento aprovado:', body.data.id);
    }
    res.sendStatus(200);
});

// Endpoint para verificar status do pagamento
app.get('/status/:id', (req, res) => {
    const id = req.params.id;
    const aprovado = pagamentosAprovados[id] || false;
    res.json({aprovado});
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>console.log(`Servidor rodando na porta ${PORT}`));
