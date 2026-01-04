/* ==========================
   GET USER ID
========================== */
const params = new URLSearchParams(window.location.search);
const userId = params.get("id");

/* ==========================
   ELEMENTOS
========================== */
const nomeEl = document.getElementById("nome");
const msgEl = document.getElementById("mensagem");
const cartaEl = document.getElementById("carta");
const tempoEl = document.getElementById("tempo");
const sliderArea = document.getElementById("sliderArea");
const musicaEl = document.getElementById("musica");
const lerBtn = document.getElementById("lerBtn");
const hearts = document.getElementById("hearts");

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

  criarSlider(data.fotos || []);

  if (data.musica) {
    musicaEl.src = data.musica;
    musicaEl.volume = 0.6;
    musicaEl.play().catch(()=>{});
  }

  iniciarTempo(data.dataInicio);
  criarCorações();
}

/* ==========================
   FUNDO
========================== */
function aplicarFundo(fundo) {
  const cores = {
    rosa: "linear-gradient(#ff8fc7,#ff5fa2)",
    azul: "linear-gradient(#4da6ff,#1c3faa)",
    vermelho: "linear-gradient(#ff6b6b,#b30000)",
    preto: "#000",
    branco: "#fff"
  };
  document.body.style.background = cores[fundo] || "#000";
  if (fundo === "branco") document.body.style.color = "#000";
}

/* ==========================
   LER MAIS
========================== */
lerBtn.onclick = () => {
  textoExpandido = !textoExpandido;
  msgEl.innerText = textoExpandido ? textoCompleto : textoCompleto.slice(0, 500) + "...";
  lerBtn.innerText = textoExpandido ? "Ler menos" : "Continuar lendo";
};

/* ==========================
   SLIDER
========================== */
function criarSlider(fotos) {
  if (!fotos.length) return;

  let html = `
  <div class="slider">
    <div class="slider-track">
      ${fotos.map(f => `
        <div class="slide">
          <div class="polaroid">
            <img src="${f}">
          </div>
        </div>
      `).join("")}
    </div>
  </div>
  `;

  if (fotos.length > 1) {
    html += `
    <div class="dots">
      ${fotos.map((_,i)=>`<span class="dot ${i===0?'active':''}"></span>`).join("")}
    </div>`;
  }

  sliderArea.innerHTML = html;

  let index = 0;
  const track = sliderArea.querySelector(".slider-track");
  const dots = sliderArea.querySelectorAll(".dot");

  setInterval(() => {
    if (fotos.length <= 1) return;
    index = (index + 1) % fotos.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach(d => d.classList.remove("active"));
    dots[index].classList.add("active");
  }, 4200);
}

/* ==========================
   CARTA
========================== */
function toggleCarta() {
  cartaEl.style.display =
    cartaEl.style.display === "block" ? "none" : "block";
}

/* ==========================
   TEMPO JUNTOS
========================== */
function iniciarTempo(dataInicio) {
  function atualizar() {
    const ini = new Date(dataInicio);
    const diff = Date.now() - ini.getTime();
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    tempoEl.innerText = `⏳ ${dias} dias juntos`;
  }
  atualizar();
  setInterval(atualizar, 60000);
}

/* ==========================
   CORAÇÕES
========================== */
function criarCorações() {
  for (let i = 0; i < 12; i++) {
    const h = document.createElement("div");
    h.className = "heart";
    h.innerText = "❤";
    h.style.left = Math.random() * 100 + "%";
    h.style.animationDuration = 12 + Math.random() * 10 + "s";
    h.style.fontSize = 12 + Math.random() * 14 + "px";
    hearts.appendChild(h);
  }
}

/* INIT */
carregar();

