/* ==========================
   GET USER ID
========================== */
const params = new URLSearchParams(window.location.search);
const userId = params.get("id");

/* ==========================
   ELEMENTOS
========================== */
const nomeEl   = document.getElementById("nome");
const msgEl    = document.getElementById("mensagem");
const cartaEl  = document.getElementById("carta");
const tempoEl  = document.getElementById("tempo");
const midiasEl = document.getElementById("midias");
const musicaEl = document.getElementById("musica");
const lerBtn   = document.getElementById("lerBtn");

/* ==========================
   STATE
========================== */
let textoCompleto = "";
let textoExpandido = false;

/* ==========================
   FETCH USER DATA
========================== */
async function carregar() {
  const res = await fetch(`/user-data?id=${userId}`);
  const data = await res.json();

  if (data.status === "pending") {
    document.body.innerHTML = "Pagamento em processamento...";
    return;
  }

  aplicarFundo(data.fundo);

  nomeEl.innerText = data.nome;
  textoCompleto = data.mensagem;

  if (textoCompleto.length > 500) {
    msgEl.innerText = textoCompleto.slice(0, 500) + "...";
    lerBtn.style.display = "block";
    lerBtn.innerText = "Continuar lendo";
  } else {
    msgEl.innerText = textoCompleto;
  }

  cartaEl.innerText = data.carta;

  criarPolaroids(data.fotos || []);

  if (data.musica) {
    musicaEl.src = data.musica;
    musicaEl.volume = 0.6;
    musicaEl.play().catch(()=>{});
  }

  iniciarTempo(data.dataInicio);
  criarCorações();
}

/* ==========================
   FUNDO (IGUAL AO EDITOR)
========================== */
function aplicarFundo(fundo) {
  document.body.className = fundo || "azul";
}

/* ==========================
   LER MAIS
========================== */
lerBtn.onclick = () => {
  textoExpandido = !textoExpandido;
  msgEl.innerText = textoExpandido
    ? textoCompleto
    : textoCompleto.slice(0, 500) + "...";

  lerBtn.innerText = textoExpandido
    ? "Ler menos"
    : "Continuar lendo";
};

/* ==========================
   POLAROID STACK (SEM SLIDER)
========================== */
function criarPolaroids(fotos) {
  if (!fotos.length) return;

  midiasEl.innerHTML = "";

  fotos.forEach((url, i) => {
    const div = document.createElement("div");
    div.className = "photo";
    if (i === 0) div.classList.add("active");
    div.innerHTML = `<img src="${url}">`;
    midiasEl.appendChild(div);
  });
}

/* ==========================
   CARTA
========================== */
function toggleCarta() {
  cartaEl.style.display =
    cartaEl.style.display === "block" ? "none" : "block";
}

/* ==========================
   TEMPO JUNTOS (COMPLETO)
========================== */
function iniciarTempo(dataInicio) {
  function atualizar() {
    const inicio = new Date(dataInicio);
    const agora = new Date();
    const diff = agora - inicio;

    const s = Math.floor(diff / 1000) % 60;
    const m = Math.floor(diff / 60000) % 60;
    const h = Math.floor(diff / 3600000) % 24;
    const d = Math.floor(diff / 86400000) % 30;
    const mo = Math.floor(diff / 2592000000) % 12;
    const a = Math.floor(diff / 31536000000);

    tempoEl.innerHTML = `
      <span class="titulo">Já estamos juntos há</span>
      <div class="contador">
        <div class="item">${a} anos</div>
        <div class="item">${mo} meses</div>
        <div class="item">${d} dias</div>
        <div class="item">${h}h ${m}m ${s}s</div>
      </div>
    `;
  }

  atualizar();
  setInterval(atualizar, 1000);
}

/* ==========================
   CORAÇÕES
========================== */
function criarCorações() {
  for (let i = 0; i < 12; i++) {
    const h = document.createElement("div");
    h.className = "heart";
    h.innerText = "❤️";
    h.style.left = Math.random() * 100 + "%";
    h.style.animationDuration = 10 + Math.random() * 10 + "s";
    document.body.appendChild(h);
  }
}

/* INIT */
carregar();

