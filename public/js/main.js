document.addEventListener("DOMContentLoaded", () => {
  const isEditor = !!document.getElementById("editor");
  console.log("EDITOR ATIVO:", isEditor);


  /* ===============================
     ELEMENTOS
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
  const dots = document.getElementById("dots");

  const btnCarta = document.getElementById("btnCarta");
  const btnContinuarMensagem = document.getElementById("btnContinuarMensagem");


  /* ===============================
     TEXTO — EDITOR
  ================================ */
  if (isEditor && nomeInput) {
    nomeInput.oninput = () => nome.innerText = nomeInput.value;
  }

  if (isEditor && msgInput) {
    msgInput.oninput = () => {
      mensagem.innerText = msgInput.value;
      ajustarMensagem();
    };
  }

if (isEditor && cartaInput && carta && btnCarta) {
  cartaInput.addEventListener("input", () => {
    carta.innerText = cartaInput.value;

    btnCarta.style.display =
      cartaInput.value.trim().length > 0 ? "block" : "none";
  });
}

if (isEditor && msgInput && mensagem) {
  msgInput.addEventListener("input", () => {
    mensagem.innerText = msgInput.value;
    ajustarMensagem();
  });
}


  function ajustarMensagem() {
    if (!mensagem || !btnContinuarMensagem) return;

    if (mensagem.scrollHeight > 180) {
      mensagem.classList.add("limitada");
      btnContinuarMensagem.style.display = "block";
    } else {
      mensagem.classList.remove("limitada");
      btnContinuarMensagem.style.display = "none";
    }
  }

  if (btnContinuarMensagem) {
    btnContinuarMensagem.onclick = () => {
      mensagem.classList.remove("limitada");
      btnContinuarMensagem.style.display = "none";
    };
  }

  /* ===============================
     CARTA
  ================================ */
  if (btnCarta) {
    btnCarta.onclick = () => {
      carta.style.display =
        carta.style.display === "block" ? "none" : "block";
    };
  }

  /* ===============================
   FOTOS (EDITOR) — CORRIGIDO
=============================== */
let slotAtual = null;

if (isEditor && fotoInput && midias) {

  document.querySelectorAll(".photo-slot").forEach(slot => {
    slot.onclick = () => {
      if (slot.classList.contains("filled")) return;
      slotAtual = slot;
      fotoInput.value = "";
      fotoInput.click();
    };
  });

  fotoInput.onchange = e => {
    const file = e.target.files[0];
    if (!file || !slotAtual) return;

    const url = URL.createObjectURL(file);

    const div = document.createElement("div");
    div.className = "photo";
    div.innerHTML = `<img src="${url}">`;
    midias.appendChild(div);

    slotAtual.classList.add("filled");
    slotAtual.innerHTML = "";
    slotAtual = null;

    criarDots();
    atualizarStack();
  };
}

  /* ===============================
     CARROSSEL SIMPLES
  ================================ */
  let index = 0;

function atualizarStack() {
  const fotos = document.querySelectorAll("#midias .photo");

  fotos.forEach((foto, i) => {
    foto.classList.toggle("active", i === index);
  });

  if (dots) {
    dots.innerHTML = "";
    fotos.forEach((_, i) => {
      const d = document.createElement("div");
      d.className = "dot";
      if (i === index) d.classList.add("active");
      dots.appendChild(d);
    });
  }
}
function criarDots() {
  if (!dots) return;

  const fotos = document.querySelectorAll("#midias .photo");
  dots.innerHTML = "";

  fotos.forEach((_, i) => {
    const d = document.createElement("div");
    d.className = "dot";
    if (i === index) d.classList.add("active");
    dots.appendChild(d);
  });
}

function ativarSwipe() {
  const foto = document.querySelector("#midias .photo.active");
  if (!foto) return;

  let startX = 0;
  let currentX = 0;
  let dragging = false;

  foto.onpointerdown = e => {
    dragging = true;
    startX = e.clientX;
    foto.setPointerCapture(e.pointerId);
    foto.style.transition = "none";
  };

  foto.onpointermove = e => {
    if (!dragging) return;
    currentX = e.clientX - startX;
    foto.style.transform = `translateX(calc(-50% + ${currentX}px))`;
  };

  foto.onpointerup = () => {
    dragging = false;

    if (Math.abs(currentX) > 80) {
      index =
        currentX < 0
          ? (index + 1) % document.querySelectorAll("#midias .photo").length
          : (index - 1 + document.querySelectorAll("#midias .photo").length) %
            document.querySelectorAll("#midias .photo").length;
    }

    foto.style.transition = "";
    foto.style.transform = "translateX(-50%)";
    atualizarStack();
    ativarSwipe();
  };
}


 setInterval(() => {
  const fotos = document.querySelectorAll("#midias .photo");
  if (!fotos || fotos.length === 0) return;

  if (fotos.length > 1) {
    index = (index + 1) % fotos.length;
  }

  atualizarStack();
  ativarSwipe();
}, 3500);

function iniciarContador(dataInicio) {
  if (!dataInicio || !tempo) return;

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
        <div class="item">${a} anos</div>
        <div class="item">${mo} meses</div>
        <div class="item">${d} dias</div>
        <div class="item">${h}h ${m}m ${s}s</div>
      </div>
    `;
  }, 1000);
}
/* ===============================
   CONTADOR (EDITOR)
=============================== */
if (isEditor && dataInput && tempo) {
  dataInput.onchange = () => {
    iniciarContador(dataInput.value);
  };
}


/* ===============================
   MÚSICA (EDITOR)
=============================== */
const musicBox = document.getElementById("musicBox");
const musicaInput = document.getElementById("musicaInput");
const audio = document.getElementById("audioPlayer");
const removeMusic = document.getElementById("removeMusic");

if (isEditor && musicBox && musicaInput && audio) {
  musicBox.addEventListener("click", () => musicaInput.click());

  musicaInput.addEventListener("change", () => {
    const file = musicaInput.files[0];
    if (!file) return;

    audio.src = URL.createObjectURL(file);
    audio.style.display = "block";

    musicBox.classList.add("disabled");
    musicBox.innerText = "🎶 Música pronta";

    if (removeMusic) removeMusic.style.display = "block";
  });

  if (removeMusic) {
    removeMusic.addEventListener("click", () => {
      audio.src = "";
      audio.style.display = "none";
      musicaInput.value = "";
      musicBox.classList.remove("disabled");
      musicBox.innerText = "Adicionar música 🎵";
      removeMusic.style.display = "none";
    });
  }
}

/* ===============================
   FUNDOS (EDITOR)
=============================== */
if (isEditor && preview) {
  document.querySelectorAll(".bg-card").forEach(card => {
    card.addEventListener("click", () => {
      document
        .querySelectorAll(".bg-card")
        .forEach(c => c.classList.remove("selected"));

      card.classList.add("selected");
      preview.className = "preview " + card.dataset.bg;
    });
  });
}
/* ===============================
   CORAÇÕES DE FUNDO
=============================== */
function criarCoracoes() {
  const container = document.getElementById("preview");
  if (!container) return;

  container.querySelectorAll(".heart").forEach(h => h.remove());

  for (let i = 0; i < 12; i++) {
    const h = document.createElement("div");
    h.className = "heart";
    h.innerText = "❤️";
    h.style.left = Math.random() * 100 + "%";
    h.style.animationDuration = 6 + Math.random() * 6 + "s";
    container.appendChild(h);
  }
}
criarCoracoes();

const btnComprar = document.getElementById("btnComprar");

if (btnComprar) {
  btnComprar.addEventListener("click", () => {
    window.location.href = "https://mpago.la/26yFvLc";
  
  // 🔒 Marca que o usuário iniciou pagamento
    sessionStorage.setItem("aguardando_pagamento", "true");

    // 👉 Abre o pagamento
    window.location.href = linkPagamento;
  };
}

});





































