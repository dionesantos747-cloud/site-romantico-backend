process.on("unhandledRejection", err => {
  console.error("Unhandled Rejection:", err);
});
const crypto = require("crypto");
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const QRCode = require("qrcode");
const { v4: uuidv4 } = require("uuid");
const { MongoClient } = require("mongodb");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

/* =====================
   MIDDLEWARES
===================== */
app.use(cors());
app.use(bodyParser.json({ limit: "20mb" }));
app.use(express.static(path.join(__dirname, "public"), {
  maxAge: "7d",
  etag: true,
  lastModified: true
}));
// 🔒 PROTEÇÃO CONTRA REQUESTS PRESOS (IMPORTANTE)
app.use((req, res, next) => {
  res.setTimeout(30000); // 30 segundos
  next();
});
/* =====================
   ROTA INICIAL
===================== */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "editor.html"));
});

/* =====================
   CLOUDINARY
===================== */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }
});

/* =====================
   VARIÁVEIS
===================== */
const MONGO_URI = process.env.MONGO_URI;


let payments, users;

if (!MONGO_URI || !process.env.PAGSEGURO_TOKEN) {
  console.error("❌ Variáveis de ambiente não definidas");
  process.exit(1);
}

/* =====================
   MONGODB
===================== */
(async () => {
  try {
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
   UPLOAD FOTO (FIX HEIC DEFINITIVO)
===================== */
app.post("/upload-image", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Arquivo não enviado" });
  }

  // 🔒 PROTEÇÃO REAL (ADICIONAR AQUI)
  if (!req.file.mimetype.startsWith("image/")) {
    return res.status(400).json({ error: "Arquivo inválido" });
  }

  cloudinary.uploader.upload_stream(
    {
      folder: "site-romantico/fotos",
      resource_type: "image",

      // 🔥 FORÇA CONVERSÃO UNIVERSAL
      format: "jpg",

      transformation: [
        { width: 1600, height: 1600, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" }
      ]
    },
    (err, result) => {
      if (err) {
        console.error("Erro Cloudinary:", err);
        return res.status(500).json({ error: "Erro imagem" });
      }

      res.json({ url: result.secure_url });
    }
  ).end(req.file.buffer);
});

/* =====================
   UPLOAD MÚSICA
===================== */
app.post("/upload-music", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Arquivo não enviado" });
  }

  // ✅ AQUI (EXATAMENTE AQUI)
  if (!req.file.mimetype.startsWith("audio/")) {
    return res.status(400).json({ error: "Arquivo inválido. Envie um áudio." });
  }

  cloudinary.uploader.upload_stream(
    { resource_type: "auto", folder: "site-romantico/musicas" },
    (err, result) => {
      if (err) return res.status(500).json({ error: "Erro música" });
      res.json({ url: result.secure_url });
    }
  ).end(req.file.buffer);
});

/* =====================
   CREATE PAYMENT
===================== */
app.post("/create-payment", async (req, res) => {
  try {
    const {
      nome,
      mensagem,
      dataInicio,
      fotos = [],
      musica = null,
      nomeMusica = "Nossa Música",
      fundo = "azul"
    } = req.body;

    if (!nome || !mensagem || !dataInicio) {
      return res.status(400).json({
        error: "Dados obrigatórios não preenchidos"
      });
    }

    const tempId = uuidv4();

    await users.insertOne({
      _id: tempId,
      nome,
      mensagem,
      dataInicio,
      fotos,
      musica,
      nomeMusica,
      fundo,
      status: "pending",
      createdAt: new Date()
    });

    const response = await axios.post(
      "https://sandbox.api.pagseguro.com/orders",
      {
        reference_id: "pedido_" + tempId,
        customer: {
          name: nome,
          email: "dionesantosx7@gmail.com",
          tax_id: "12345678909",
          phones: [
            {
              country: "55",
              area: "11",
              number: "999999999",
              type: "MOBILE"
            }
          ]
        },
        items: [
          {
            name: "Site Romântico Premium 💖",
            quantity: 1,
            unit_amount: 1580
          }
        ],
        qr_codes: [
          {
            amount: {
              value: 1580
            },
            expiration_date: new Date(Date.now() + 30 * 60 * 1000).toISOString()
          }
        ],
        notification_urls: [
          `${req.protocol}://${req.get("host")}/webhook`
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAGSEGURO_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    const order = response.data;
    const qr = order.qr_codes?.[0];

    if (!qr) {
      throw new Error("QR Code não retornado pelo PagBank");
    }

    await payments.insertOne({
      paymentId: qr.id,
      orderId: order.id,
      userId: tempId,
      status: "pending",
      createdAt: new Date()
    });

    res.json({
      payment_id: qr.id,
      qr_base64: qr.links?.find(link => link.rel === "QRCODE.PNG")?.href || null,
      copia_cola: qr.text
    });

  } catch (err) {
    console.error("❌ ERRO COMPLETO:", err.response?.data || err.message);
    res.status(500).json({
      error: err.response?.data || err.message
    });
  }
});

/* =====================
   WEBHOOK PAGSEGURO
===================== */
app.post("/webhook", async (req, res) => {
  res.sendStatus(200);

  try {
    console.log("🔔 Webhook recebido:", JSON.stringify(req.body, null, 2));

    const charges = req.body?.charges;
    if (!charges || !charges.length) return;

    const charge = charges[0];

    const paymentId = charge.id;
    const status = charge.status;

    console.log("📡 Status PagSeguro:", status);

    if (status !== "PAID") return;

    const pagamento = await payments.findOne({ paymentId });

    if (!pagamento) {
      console.log("❌ Pagamento não encontrado");
      return;
    }

    if (pagamento.status === "approved") {
      console.log("⚠️ Já aprovado");
      return;
    }

    const siteId = crypto.randomUUID();

    await payments.updateOne(
      { paymentId },
      {
        $set: {
          status: "approved",
          siteId,
          aprovadoEm: new Date()
        }
      }
    );

    await users.updateOne(
      { _id: pagamento.userId },
      {
        $set: {
          status: "approved",
          activatedAt: new Date()
        }
      }
    );

    console.log("💖 Pagamento aprovado:", paymentId);

  } catch (err) {
    console.error("❌ Erro webhook:", err.message);
  }
});

/* =====================
   CHECK PAYMENT
===================== */
app.get("/check-payment", async (req, res) => {
  try {
    const paymentId = String(req.query.payment_id);

    const pagamento = await payments.findOne({ paymentId });

    if (!pagamento) {
      return res.json({ status: "pending" });
    }

    // 🔥 CONSULTA DIRETO NO PAGSEGURO
    const response = await axios.get(
      `https://sandbox.api.pagseguro.com/charges/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAGSEGURO_TOKEN}`
        }
      }
    );

    const status = response.data.status;

    if (status === "PAID") {

      let siteId = pagamento.siteId;

      if (!siteId) {
        siteId = crypto.randomUUID();

        await payments.updateOne(
          { paymentId },
          {
            $set: {
              status: "approved",
              siteId,
              aprovadoEm: new Date()
            }
          }
        );

        await users.updateOne(
          { _id: pagamento.userId },
          {
            $set: {
              status: "approved",
              activatedAt: new Date()
            }
          }
        );
      }

      return res.json({
        status: "approved",
        siteId
      });
    }

    res.json({ status: "pending" });

  } catch (err) {
    console.error("❌ check-payment erro:", err.response?.data || err.message);
    res.json({ status: "pending" });
  }
});



app.get("/payment-info", async (req, res) => {
  try {
    const paymentId = String(req.query.payment_id);

    const pagamento = await payments.findOne({ paymentId });
    if (!pagamento?.orderId) {
      return res.status(404).json({ error: "Pagamento não encontrado" });
    }

    const response = await axios.get(
      `https://sandbox.api.pagseguro.com/orders/${pagamento.orderId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAGSEGURO_TOKEN}`
        }
      }
    );

    const qr = response.data.qr_codes?.find(q => q.id === paymentId) || response.data.qr_codes?.[0];

    if (!qr) {
      return res.status(404).json({ error: "QR não encontrado" });
    }

    res.json({
      qr_base64: qr.links?.find(link => link.rel === "QRCODE.PNG")?.href || null,
      copia_cola: qr.text
    });

  } catch (err) {
    console.error("❌ payment-info erro:", err.response?.data || err.message);
    res.status(500).json({ error: "Erro ao buscar PIX" });
  }
});
/* =====================
   SUCCESS
===================== */
app.get("/success.html", async (req, res) => {
  const paymentId = String(req.query.payment_id);

  const pay = await payments.findOne({
  paymentId
});
  
if (!pay || pay.status !== "approved") {
  return res.sendFile(
    path.join(__dirname, "public/aguardando.html")
  );
}

  const user = await users.findOne({ _id: pay.userId });
  if (!user) return res.status(404).send("Usuário não encontrado");

  const link = `${req.protocol}://${req.get("host")}/user.html?id=${user._id}`;
  const qr = await QRCode.toDataURL(link);

  let html = fs.readFileSync(
    path.join(__dirname, "views/success.html"),
    "utf8"
  );

  html = html
    .replace("{{QR}}", `<img src="${qr}" />`)
    .replace("{{LINK}}", link);

  res.send(html);
});

/* =====================
   USER DATA
===================== */
app.get("/user-data", async (req, res) => {
  const user = await users.findOne({ _id: req.query.id });

  if (!user) {
    return res.status(404).json({ error: "Usuário não encontrado" });
  }

if (user.status !== "approved") {
  return res.json({
    status: "pending",
    message: "Pagamento em processamento"
  });
}

  res.json(user);
});

/* =====================
   START
===================== */
app.listen(PORT, "0.0.0.0", () => {
  console.log("🚀 Server rodando");
});

