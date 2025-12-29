document.addEventListener("DOMContentLoaded", () => {

  const isEditor = !!document.getElementById("editor");

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

  if (isEditor && cartaInput) {
    cartaInput.oninput = () => {
      carta.innerText = cartaInput.value;
      btnCarta.style.display =
        cartaInput.value.trim().length ? "block" : "none";
    };
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
  if (fotos.length < 2) return;
  index = (index + 1) % fotos.length;
  atualizarStack();
  ativarSwipe();
}, 3500);

});






























