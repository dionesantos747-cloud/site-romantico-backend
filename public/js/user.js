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
const musicaEl = document.getElementById("audioPlayer");
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

  if (!data || data.status !== "approved") {
    document.body.innerHTML = `
      <div style="text-align:center;padding:40px">
        <h2>💔 Site ainda não disponível</h2>
      </div>`;
    return;
  }

  aplicarFundo(data.fundo);

  nomeEl.innerText = data.nome || "";

  textoCompleto = data.mensagem || "";
  atualizarTexto();

  cartaEl.innerText = data.carta || "";

  criarPolaroids(data.fotos || []);

  if (data.musica) {
    musicaEl.src = data.musica;
    musicaEl.volume = 0.7;
    musicaEl.style.display = "block";
    musicaEl.play().catch(()=>{});
  }

  iniciarTempo(data.dataInicio);
  criarCorações();
}

/* ==========================
   FUNDO (MESMO DO EDITOR)
========================== */
function aplicarFundo(fundo) {
  const preview = document.getElementById("preview");
  preview.className = "preview " + (fundo || "azul");
}

/* ==========================
   TEXTO + CONTINUAR LENDO
========================== */
function atualizarTexto() {
  if (textoCompleto.length > 500) {
    msgEl.innerText = textoExpandido
      ? textoCompleto
      : textoCompleto.slice(0, 500) + "...";
    lerBtn.style.display = "block";
    lerBtn.innerText = textoExpandido
      ? "Ler menos"
      : "Continuar lendo";
  } else {
    msgEl.innerText = textoCompleto;
    lerBtn.style.display = "none";
  }
}

lerBtn.onclick = () => {
  textoExpandido = !textoExpandido;
  atualizarTexto();
};

/* ==========================
   POLAROID STACK (SEM CORTAR)
========================== */
function criarPolaroids(fotos) {
  if (!fotos.length) return;

  midiasEl.innerHTML = "";

  fotos.forEach((url, i) => {
    const wrap = document.createElement("div");
    wrap.className = "photo polaroid";
    if (i === 0) wrap.classList.add("active");

    wrap.innerHTML = `
      <img src="${url}" loading="lazy">
    `;

    midiasEl.appendChild(wrap);
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
  if (!dataInicio) return;

  function atualizar() {
    const inicio = new Date(dataInicio);
    const agora = new Date();
    const diff = agora - inicio;
    if (diff < 0) return;

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
   CORAÇÕES (FUNDO)
========================== */
function criarCorações() {
  const preview = document.getElementById("preview");
  preview.querySelectorAll(".heart").forEach(h => h.remove());

  for (let i = 0; i < 14; i++) {
    const h = document.createElement("div");
    h.className = "heart";
    h.innerText = "❤️";
    h.style.left = Math.random() * 100 + "%";
    h.style.animationDuration = 8 + Math.random() * 8 + "s";
    preview.appendChild(h);
  }
}

/* INIT */
carregar();
