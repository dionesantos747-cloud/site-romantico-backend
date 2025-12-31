document.addEventListener("DOMContentLoaded", () => {

  /* ===============================
     DETECTA EDITOR
  ================================ */
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
  const mensagem = document.getElementById("previewMensagem") || document.getElementById("mensagem");
  const carta = document.getElementById("previewCarta") || document.getElementById("carta");
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
    nomeInput.addEventListener("input", () => {
      nome.innerText = nomeInput.value;
    });
  }

  if (isEditor && msgInput) {
    msgInput.addEventListener("input", () => {
      mensagem.innerText = msgInput.value;
      ajustarMensagem();
    });
  }

  if (isEditor && cartaInput) {
    cartaInput.addEventListener("input", () => {
      carta.innerText = cartaInput.value;
      btnCarta.style.display = cartaInput.value.trim() ? "block" : "none";
    });
  }

  function ajustarMensagem() {
    if (!btnContinuarMensagem) return;

    if (mensagem.scrollHeight > 180) {
      mensagem.classList.add("limitada");
      btnContinuarMensagem.style.display = "block";
    } else {
      mensagem.classList.remove("limitada");
      btnContinuarMensagem.style.display = "none";
    }
  }

  if (btnContinuarMensagem) {
    btnContinuarMensagem.addEventListener("click", () => {
      mensagem.classList.remove("limitada");
      btnContinuarMensagem.style.display = "none";
    });
  }

  /* ===============================
     CARTA
  ================================ */
  if (btnCarta) {
    btnCarta.addEventListener("click", () => {
      carta.style.display = carta.style.display === "block" ? "none" : "block";
    });
  }

  /* ===============================
     FOTOS
  ================================ */
  let slotAtual = null;
  let index = 0;

  if (isEditor && fotoInput && midias) {
    document.querySelectorAll(".photo-slot").forEach(slot => {
      slot.addEventListener("click", () => {
        if (slot.classList.contains("filled")) return;
        slotAtual = slot;
        fotoInput.value = "";
        fotoInput.click();
      });
    });

    fotoInput.addEventListener("change", () => {
      const file = fotoInput.files[0];
      if (!file || !slotAtual) return;

      const url = URL.createObjectURL(file);
      const div = document.createElement("div");
      div.className = "photo";
      div.innerHTML = `<img src="${url}">`;
      midias.appendChild(div);

      slotAtual.classList.add("filled");
      slotAtual.innerHTML = "";
      slotAtual = null;

      atualizarStack();
    });
  }

  function atualizarStack() {
    const fotos = document.querySelectorAll("#midias .photo");
    fotos.forEach((foto, i) => {
      foto.classList.toggle("active", i === index);
    });

    if (dots) {
      dots.innerHTML = "";
      fotos.forEach((_, i) => {
        const d = document.createElement("div");
        d.className = "dot" + (i === index ? " active" : "");
        dots.appendChild(d);
      });
    }
  }

  setInterval(() => {
    const fotos = document.querySelectorAll("#midias .photo");
    if (fotos.length > 1) {
      index = (index + 1) % fotos.length;
      atualizarStack();
    }
  }, 3500);

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
          <div class="item">${a} anos</div>
          <div class="item">${mo} meses</div>
          <div class="item">${d} dias</div>
          <div class="item">${h}h ${m}m ${s}s</div>
        </div>
      `;
    }, 1000);
  }

  if (isEditor && dataInput) {
    dataInput.addEventListener("change", () => {
      iniciarContador(dataInput.value);
    });
  }

  /* ===============================
     FUNDOS
  ================================ */
  if (isEditor && preview) {
    document.querySelectorAll(".bg-card").forEach(card => {
      card.addEventListener("click", () => {
        document.querySelectorAll(".bg-card").forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        preview.className = "preview " + card.dataset.bg;
      });
    });
  }

  /* ===============================
     MÚSICA
  ================================ */
  const musicBox = document.getElementById("musicBox");
  const musicaInput = document.getElementById("musicaInput");
  const audio = document.getElementById("audioPlayer");
  const removeMusic = document.getElementById("removeMusic");

  if (isEditor && musicBox && musicaInput && audio) {
    musicBox.addEventListener("click", () => musicaInput.click());

    musicaInput.addEventListener("change", () => {
      if (!musicaInput.files[0]) return;
      audio.src = URL.createObjectURL(musicaInput.files[0]);
      audio.style.display = "block";
      musicBox.innerText = "🎶 Música pronta";
      if (removeMusic) removeMusic.style.display = "block";
    });

    if (removeMusic) {
      removeMusic.addEventListener("click", () => {
        audio.src = "";
        audio.style.display = "none";
        musicaInput.value = "";
        musicBox.innerText = "Adicionar música 🎵";
        removeMusic.style.display = "none";
      });
    }
  }

  /* ===============================
     CORAÇÕES
  ================================ */
  function criarCoracoes() {
    if (!preview) return;
    preview.querySelectorAll(".heart").forEach(h => h.remove());

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
     BOTÃO DE COMPRA
  ================================ */
  const btnComprar = document.getElementById("btnComprar");
  if (btnComprar) {
    btnComprar.addEventListener("click", () => {
      window.location.href = "https://mpago.la/26yFvLc";
    });
  }

});






































