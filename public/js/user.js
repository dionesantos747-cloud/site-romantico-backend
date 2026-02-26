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
   INIT
========================== */
async function carregar() {
  document.body.classList.add("final");

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

  // 🔥 SLIDER AUTOMÁTICO (CORRETO)
  montarSliderFotos(data.fotos);

  textoCompleto = data.mensagem || "";
  atualizarTexto();


if (data.musica) {
  musicaEl.src = data.musica;
  musicaEl.volume = 0.7;
  musicaEl.load();

  const musicPlayer = document.getElementById("musicPlayer");
  const playBtn = document.getElementById("playBtn");
  const progress = document.querySelector(".progress");

  musicPlayer.style.display = "flex";

  // desbloqueio autoplay (Instagram / mobile)
  const unlock = () => {
    musicaEl.play().catch(() => {});
    document.removeEventListener("click", unlock);
    document.removeEventListener("touchstart", unlock);
  };

document.addEventListener("click", unlock, { once: true });
document.addEventListener("touchstart", unlock, { once: true });

  // progresso
  musicaEl.addEventListener("timeupdate", () => {
    if (!musicaEl.duration) return;
    const percent = (musicaEl.currentTime / musicaEl.duration) * 100;
    progress.style.width = percent + "%";
  });

  // fim da música
  musicaEl.addEventListener("ended", () => {
    playBtn.innerHTML = "▶";
    progress.style.width = "0%";
    musicaEl.currentTime = 0;
  });
}
  iniciarTempo(data.dataInicio);
  criarCorações();
}

carregar();

/* ==========================
   TELA ABRIR PRESENTE
========================== */

const giftScreen = document.getElementById("giftScreen");
const openGiftBtn = document.getElementById("openGiftBtn");

if (openGiftBtn) {
  openGiftBtn.addEventListener("click", () => {
    giftScreen.style.opacity = "0";
    giftScreen.style.pointerEvents = "none";

    setTimeout(() => {
      giftScreen.remove();
    }, 600);

    // 🎵 inicia música + sincroniza player
   if (musicaEl && musicaEl.src && musicaEl.paused) {
  musicaEl.play().catch(() => {});
}
        // 🔥 ATUALIZA PLAYER VISUAL
        const playBtn = document.getElementById("playBtn");
        const musicPlayer = document.getElementById("musicPlayer");

        if (musicPlayer) {
          musicPlayer.style.display = "flex";
        }

        if (playBtn) {
          playBtn.innerHTML = "❚❚";
        }
      }).catch(() => {});
    }
  });
}

/* ==========================
   SINCRONIZA PLAYER COM AUDIO
========================== */

const playBtnGlobal = document.getElementById("playBtn");

if (playBtnGlobal) {
  playBtnGlobal.addEventListener("click", () => {
    if (!musicaEl.src) return;

    if (musicaEl.paused) {
      musicaEl.play().catch(() => {});
    } else {
      musicaEl.pause();
    }
  });
}

musicaEl.addEventListener("play", () => {
  const playBtn = document.getElementById("playBtn");
  if (playBtn) playBtn.innerHTML = "❚❚";
});

musicaEl.addEventListener("pause", () => {
  const playBtn = document.getElementById("playBtn");
  if (playBtn) playBtn.innerHTML = "▶";
});

musicaEl.addEventListener("ended", () => {
  const playBtn = document.getElementById("playBtn");
  const progress = document.querySelector(".progress");

  if (playBtn) playBtn.innerHTML = "▶";
  if (progress) progress.style.width = "0%";
});
/* ==========================
   FUNDO
========================== */
function aplicarFundo(fundo) {
  const preview = document.getElementById("preview");
  preview.className = "preview " + (fundo || "azul");
}

/* ==========================
   TEXTO + LER MAIS / MENOS
========================== */
function atualizarTexto() {
  if (textoCompleto.length > 500) {
    msgEl.innerText = textoExpandido
      ? textoCompleto
      : textoCompleto.slice(0, 500) + "...";

    lerBtn.style.display = "block";
    lerBtn.innerText = textoExpandido
      ? "Ler menos ⬆️"
      : "Continuar lendo ⬇️";
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
   SLIDER POLAROID (FINAL)
========================== */
function montarSliderFotos(fotos) {
  if (!midiasEl || !fotos || fotos.length === 0) return;

  // 🔒 1 FOTO → SEM SLIDE (EVITA BUG)
  if (fotos.length === 1) {
    midiasEl.innerHTML = `
      <div class="slider">
        <div class="slider-track">
          <div class="slide">
            <div class="polaroid">
              <img src="${fotos[0]}">
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  // 🔥 2+ FOTOS → SLIDE AUTOMÁTICO
  midiasEl.innerHTML = `
    <div class="slider">
      <div class="slider-track" id="sliderTrack">
        ${fotos.map(url => `
          <div class="slide">
            <div class="polaroid">
            <img src="${url}" loading="lazy">
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  const track = document.getElementById("sliderTrack");
  const slides = track.querySelectorAll(".slide");

  // clone para loop infinito
  const clone = slides[0].cloneNode(true);
  clone.classList.add("clone");
  track.appendChild(clone);

  let index = 0;
  const total = slides.length + 1;

  setInterval(() => {
    index++;
    track.style.transition = "transform .8s ease";
    track.style.transform = `translateX(-${index * 100}%)`;

    if (index === total - 1) {
      setTimeout(() => {
        track.style.transition = "none";
        index = 0;
        track.style.transform = "translateX(0)";
      }, 850);
    }
  }, 3500);
}


/* ==========================
   PLURAL
========================== */
function plural(v, s, p) {
  return v === 1 ? s : p;
}

/* ==========================
   TEMPO JUNTOS (CORRIGIDO)
========================== */
function iniciarTempo(dataInicio) {
  if (!dataInicio) return;

  function atualizar() {
    const inicio = new Date(dataInicio);
    const diff = Date.now() - inicio.getTime();
    if (diff < 0) return;

    const s  = Math.floor(diff / 1000) % 60;
    const m  = Math.floor(diff / 60000) % 60;
    const h  = Math.floor(diff / 3600000) % 24;
    const d  = Math.floor(diff / 86400000) % 30;
    const mo = Math.floor(diff / 2592000000) % 12;
    const a  = Math.floor(diff / 31536000000);

tempoEl.innerHTML = `
  <span class="titulo">compartilhamos a vida já faz:</span>
  <div class="contador">
    <div class="item">${a} ${plural(a,"ano","anos")}</div>
    <div class="item">${mo} ${plural(mo,"mês","meses")}</div>
    <div class="item">${d} ${plural(d,"dia","dias")}</div>
    <div class="item tempo-hms">${h}h ${m}m ${s}s</div>
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
          


