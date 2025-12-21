const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;

/* =====================
   MIDDLEWARES
===================== */
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

/* Página inicial */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/editor.html"));
});

/* =====================
   VARIÁVEIS DE AMBIENTE
===================== */
const MONGO_URI = process.env.MONGO_URI;
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

if (!MONGO_URI) console.warn("⚠️ MONGO_URI não definida");
if (!MP_ACCESS_TOKEN) console.warn("⚠️ MP_ACCESS_TOKEN não definido");

/* =====================
   MONGODB
===================== */
let payments = null;
let users = null;

(async () => {
  try {
    if (!MONGO_URI) return;

    const client = new MongoClient(MONGO_URI);
    await client.connect();

    const db = client.db("site-romantico");
    payments = db.collection("payments");
    users = db.collection("users");

    console.log("✅ MongoDB conectado");
  } catch (err) {
    console.error("❌ Erro MongoDB:", err.message);
  }
})();

/* =====================
   CRIAR PAGAMENTO PIX
===================== */
app.post("/create-payment", async (req, res) => {
  try {
    if (!payments) {
      return res.status(503).json({ error: "Banco indisponível" });
    }

    const mp = await axios.post(
  "https://api.mercadopago.com/v1/payments",
  {
    transaction_amount: 9.99,
    description: "Site Romântico Premium",
    payment_method_id: "pix",
    payer: {
      email: "dionesantos747@gmail.com"
    },
    notification_url: `${req.protocol}://${req.get("host")}/webhook`,
    metadata: {
  nome: req.body.nome || "",
  mensagem: req.body.mensagem || "",
  carta: req.body.carta || "",
  dataInicio: req.body.dataInicio || null,
  fotos: req.body.fotos || [],
  musica: req.body.musica || null
}
  },
  {
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": uuidv4()
    }
  }
);

    await payments.insertOne({
  paymentId: String(mp.data.id),
  status: "pending",
  metadata: mp.data.metadata,
  createdAt: new Date()
});

const pix = mp.data.point_of_interaction.transaction_data;

res.json({
  payment_id: String(mp.data.id),
  qr_base64: pix.qr_code_base64,
  copia_cola: pix.qr_code
});

  } catch (err) {
    console.error("❌ Erro ao criar pagamento:", err.message);
    res.status(500).json({ error: "Erro ao criar pagamento" });
  }
});

/* =====================
   WEBHOOK MERCADO PAGO
===================== */
app.post("/webhook", (req, res) => {
  // responde IMEDIATAMENTE ao Mercado Pago
  res.sendStatus(200);

  // processa em background
  (async () => {
    try {
      if (!payments) return;

      const paymentId = String(req.body?.data?.id);
      if (!paymentId) return;

      const mp = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${MP_ACCESS_TOKEN}`
          }
        }
      );

      if (mp.data.status === "approved") {
        await payments.updateOne(
          { paymentId },
          { $set: { status: "approved" } }
        );
      }
    } catch (err) {
      console.error("Webhook erro:", err.message);
    }
  })();
});
/* =====================
   CHECK PAGAMENTO
===================== */
app.get("/check-payment", async (req, res) => {
  try {
    const paymentId = String(req.query.payment_id);

    // consulta direta ao Mercado Pago (fonte da verdade)
    const mp = await axios.get(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${MP_ACCESS_TOKEN}`
        }
      }
    );

    if (mp.data.status === "approved") {
      // atualiza banco (se existir)
      if (payments) {
        await payments.updateOne(
          { paymentId },
          { $set: { status: "approved" } },
          { upsert: true }
        );
      }

      return res.json({ status: "approved" });
    }

    res.json({ status: "pending" });

  } catch (err) {
    console.error("Erro check-payment:", err.message);
    res.json({ status: "pending" });
  }
});

/* =====================
   SUCCESS (QR + LINK)
===================== */
app.get("/success.html", async (req, res) => {
  if (!payments || !users) {
    return res.sendFile(path.join(__dirname, "public/aguardando.html"));
  }

  const pay = await payments.findOne({
    paymentId: String(req.query.payment_id),
    status: "approved"
  });

  if (!pay) {
    return res.sendFile(path.join(__dirname, "public/aguardando.html"));
  }

  let user = await users.findOne({ paymentId: pay.paymentId });

  if (!user) {
    const id = uuidv4();
    const link = `${req.protocol}://${req.get("host")}/user.html?id=${id}`;
    const qr = await QRCode.toDataURL(link);

    user = {
      _id: id,
      paymentId: pay.paymentId,
      ...pay.metadata,
      qr,
      createdAt: new Date()
    };

    await users.insertOne(user);
  }

  let html = fs.readFileSync(
    path.join(__dirname, "public/success.html"),
    "utf8"
  );

  html = html
    .replace("{{QR}}", `<img src="${user.qr}" />`)
    .replace(
      "{{LINK}}",
      `${req.protocol}://${req.get("host")}/user.html?id=${user._id}`
    );

  res.send(html);
});

/* =====================
   USER (SITE FINAL)
===================== */
app.get("/user-data", async (req, res) => {
  try {
    if (!users) {
      return res.status(503).json({ error: "Banco indisponível" });
    }

    const id = req.query.id;
    if (!id) {
      return res.status(400).json({ error: "ID não informado" });
    }

    const user = await users.findOne({ _id: id });
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    res.json({
      nome: user.nome,
      mensagem: user.mensagem,
      carta: user.carta,
      dataInicio: user.dataInicio || null,
      fotos: user.fotos || [],
      musica: user.musica || null
    });

  } catch (err) {
    console.error("Erro user-data:", err.message);
    res.status(500).json({ error: "Erro interno" });
  }
});
app.get("/user.html", async (req, res) => {
  if (!users) {
    return res.send("Serviço indisponível");
  }

  const user = await users.findOne({ _id: req.query.id });
  if (!user) {
    return res.status(404).send("Site não encontrado");
  }

  res.sendFile(path.join(__dirname, "public/user.html"));
});
/* =====================
   START SERVER
===================== */
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
