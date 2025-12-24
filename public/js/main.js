/* ===============================
   DETECTA CONTEXTO
================================ */
const isEditor = document.getElementById("editor") !== null;

/* ===============================
   ELEMENTOS (COM SEGURANÇA)
================================ */
const nomeInput = document.getElementById("nomeInput");
const msgInput = document.getElementById("msgInput");
const cartaInput = document.getElementById("cartaInput");
const dataInput = document.getElementById("dataInput");

const nome = document.getElementById("nome");
const mensagem = document.getElementById("mensagem");
const carta = document.getElementById("carta");
const tempo = document.getElementById("tempo");
const preview = document.getElementById("preview");

const fotoInput = document.getElementById("fotoInput");
const midias = document.getElementById("midias");

/* ===============================
   CARROSSEL / STACK POLAROID
================================ */
function atualizarStack(index) {
  const fotosDOM = document.querySelectorAll("#midias .photo");

  fotosDOM.forEach((foto, i) => {
    foto.classList.remove("active", "behind-1", "behind-2");

    if (i === index) foto.classList.add("active");
    else if (i === index + 1) foto.classList.add("behind-1");
    else if (i === index + 2) foto.classList.add("behind-2");
  });
}
const swipeSound = new Audio("/sounds/card-swipe.mp3");

function ativarSwipe(cartas) {
   if (document.querySelectorAll("#midias .photo").length < 2) return;

 cartas.forEach(cartaEl => {
  if (cartaEl.dataset.swipe === "true") return;
  cartaEl.dataset.swipe = "true";

    let startX = 0;
    let currentX = 0;
    let dragging = false;

    cartaEl.addEventListener("pointerdown", e => {
      dragging = true;
      startX = e.clientX;
      cartaEl.setPointerCapture(e.pointerId);
      cartaEl.style.transition = "none";
    });

    cartaEl.addEventListener("pointermove", e => {
      if (!dragging) return;
      currentX = e.clientX - startX;

      cartaEl.style.transform =
        `translateX(calc(-50% + ${currentX}px)) rotate(${currentX / 12}deg)`;
    });

    cartaEl.addEventListener("pointerup", () => {
      dragging = false;

      if (Math.abs(currentX) > 120) {
        swipeSound.currentTime = 0;
        swipeSound.play();

        cartaEl.style.transition = "transform 0.4s ease";
        cartaEl.style.transform =
          `translateX(${currentX > 0 ? 150 : -150}vw) rotate(${currentX > 0 ? 25 : -25}deg)`;

        setTimeout(() => {
          cartaEl.remove();
          atualizarStack(0);

      
        }, 300);
      } else {
        cartaEl.style.transition = "transform 0.3s ease";
       cartaEl.style.transform =
  "translateX(-50%) translateY(0) rotate(0deg) scale(1)";

      }

      currentX = 0;
    });
  });
}

const musicBox = document.getElementById("musicBox");
const musicaInput = document.getElementById("musicaInput");
const audio = document.getElementById("audioPlayer");
const removeMusic = document.getElementById("removeMusic");

/* ===============================
   ESTADO
================================ */
let fotos = [null, null, null];
let slotAtual = null;
let fundoSelecionado = "azul";

/* ===============================
   PREVIEW EM TEMPO REAL (EDITOR)
================================ */
if (isEditor) {
  nomeInput.oninput = () => nome.innerText = nomeInput.value;
  msgInput.oninput = () => mensagem.innerText = msgInput.value;
  cartaInput.oninput = () => carta.innerText = cartaInput.value;
}

/* ===============================
   CONTADOR
================================ */
function iniciarContador(dataInicio) {
  if (!dataInicio) return;

  setInterval(() => {
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

    tempo.innerHTML = `
      <span class="titulo">Já estamos juntos há</span>
      <div class="contador">
        <div class="item">${a} ${a === 1 ? "ano" : "anos"}</div>
        <div class="item">${mo} ${mo === 1 ? "mês" : "meses"}</div>
        <div class="item">${d} ${d === 1 ? "dia" : "dias"}</div>
        <div class="item">${h}h ${m}m ${s}s</div>
      </div>
    `;
  }, 1000);
}

if (isEditor && dataInput) {
  dataInput.onchange = () => iniciarContador(dataInput.value);
}

/* ===============================
   CARTA
================================ */
const btnCarta = document.getElementById("btnCarta");
if (btnCarta && carta) {
  btnCarta.onclick = () => {
    carta.style.display = carta.style.display === "block" ? "none" : "block";
    btnCarta.innerText =
      carta.style.display === "block" ? "❌ Fechar carta" : "💌 Abrir carta";
  };
}

/* ===============================
   CORAÇÕES
================================ */
function criarCoracoes() {
  if (!preview) return;
  document.querySelectorAll(".heart").forEach(h => h.remove());

  for (let i = 0; i < 12; i++) {
    const h = document.createElement("div");
    h.className = "heart";
    h.innerText = "❤️";
    h.style.left = Math.random() * 100 + "%";
    h.style.animationDuration = 6 + Math.random() * 6 + "s";
    preview.appendChild(h);
  }
}
criarCoracoes();

/* ===============================
   FUNDOS (EDITOR)
================================ */
document.querySelectorAll(".bg-card").forEach(c => {
  c.onclick = () => {
    document.querySelectorAll(".bg-card").forEach(x =>
      x.classList.remove("selected")
    );

    c.classList.add("selected");

    // 🔥 salva o fundo escolhido
    fundoSelecionado = c.dataset.bg;

    // 🔥 usa a variável (não repete dataset)
    preview.className = "preview " + fundoSelecionado;

    criarCoracoes();
  };
});

/* ===============================
   FOTOS (EDITOR)
================================ */
if (isEditor) {
  document.querySelectorAll(".photo-slot").forEach(slot => {
    slot.onclick = () => {
      if (slot.classList.contains("filled")) return;
      slotAtual = slot.dataset.slot;
      fotoInput.click();
    };
  });

  fotoInput.onchange = e => {
    const file = e.target.files[0];
    if (!file || slotAtual === null) return;

    const url = URL.createObjectURL(file);
    fotos[slotAtual] = url;

    const div = document.createElement("div");
div.className = "photo";
div.innerHTML = `<img src="${url}" style="width:100%">`;

midias.appendChild(div); // 🔥 OBRIGATÓRIO
     
setTimeout(() => {
  const fotosDOM = Array.from(document.querySelectorAll("#midias .photo"));

  if (fotosDOM.length < 2) return;

  // 🔁 loop infinito
  midias.appendChild(cartaEl);

  cartaEl.style.transition = "none";
  cartaEl.style.transform =
    "translateX(-50%) translateY(0) rotate(0deg) scale(1)";
  cartaEl.offsetHeight; // 🔥 força reflow

  requestAnimationFrame(() => {
    cartaEl.style.transition = "";
    atualizarStack(0);
  });
}, 300);


}; 

    const s = document.querySelector(`.photo-slot[data-slot="${slotAtual}"]`);
    s.classList.add("filled");
    s.innerText = "";

    slotAtual = null;
    fotoInput.value = "";
  };
}

/* ===============================
   MÚSICA
================================ */
if (musicBox && musicaInput) {
  musicBox.onclick = () => {
    if (musicBox.classList.contains("disabled")) return;
    musicaInput.click();
  };

  musicaInput.onchange = () => {
    if (!musicaInput.files[0]) return;
    audio.src = URL.createObjectURL(musicaInput.files[0]);
    audio.style.display = "block";
    musicBox.innerText = "🎶 Música selecionada";
    musicBox.classList.add("disabled");
    removeMusic.style.display = "block";
  };

  removeMusic.onclick = () => {
    audio.src = "";
    audio.style.display = "none";
    musicaInput.value = "";
    musicBox.innerText = "Adicionar música 🎵";
    musicBox.classList.remove("disabled");
    removeMusic.style.display = "none";
  };
}

/* ===============================
   SITE FINAL – CARREGAR DADOS
================================ */
const params = new URLSearchParams(window.location.search);
const userId = params.get("id");

if (!isEditor && userId) {
  fetch(`/user-data?id=${userId}`)
    .then(res => res.json())
    .then(data => {
      if (!data) return;

      nome.innerText = data.nome;
      mensagem.innerText = data.mensagem;
      carta.innerText = data.carta;
       
      if (data.fundo) {
        preview.className = "preview " + data.fundo;
      } 

      iniciarContador(data.dataInicio);
       
if (Array.isArray(data.fotos)) {
data.fotos.forEach(f => {
  if (!f) return;

  const div = document.createElement("div");
  div.className = "photo";
  div.innerHTML = `<img src="${f}" style="width:100%">`;
  midias.appendChild(div);
});

// 🔥 ativa stack inicial no site final
setTimeout(() => {
  atualizarStack(0);

  // 🔥 ativa swipe na carta visível
  const ativa = document.querySelector("#midias .photo.active");
  if (ativa) ativarSwipe([ativa]);

}, 100);

}

     if (data.musica) {
        audio.src = data.musica;
        audio.preload = "auto";
        audio.volume = 0.8;
        audio.style.display = "block";
      }
    })
  // ✅ ESTE BLOCO FICA AQUI
    .catch(() => {
      document.body.innerHTML = `
        <div style="
          min-height:100vh;
          display:flex;
          align-items:center;
          justify-content:center;
          text-align:center;
          color:white;
          font-family:'Playfair Display', serif;
        ">
          <div>
            <h1>💔 Site não encontrado</h1>
            <p>Este link é inválido ou ainda não foi ativado.</p>
          </div>
        </div>
      `;
    });
}














