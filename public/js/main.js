document.addEventListener("DOMContentLoaded", () => {

  const isEditor = !!document.getElementById("editor");
  console.log("EDITOR ATIVO:", isEditor);

  /* ===============================
     ELEMENTOS BASE
  ================================ */
  const preview = document.getElementById("preview");
  const nome = document.getElementById("nome");
  const mensagem = document.getElementById("mensagem");
  const carta = document.getElementById("carta");
  const tempo = document.getElementById("tempo");
  const btnCarta = document.getElementById("btnCarta");
  const btnComprar = document.getElementById("btnComprar");

  /* ===============================
     EDITOR
  ================================ */
  if (isEditor) {

    /* TEXTO */
    const nomeInput = document.getElementById("nomeInput");
    const msgInput = document.getElementById("msgInput");
    const cartaInput = document.getElementById("cartaInput");
    const dataInput = document.getElementById("dataInput");

    nomeInput.oninput = () => nome.innerText = nomeInput.value;
    msgInput.oninput = () => mensagem.innerText = msgInput.value;

    cartaInput.oninput = () => {
      carta.innerText = cartaInput.value;
      btnCarta.style.display = cartaInput.value.trim() ? "block" : "none";
    };

    /* CARTA */
    btnCarta.onclick = () => {
      carta.style.display = carta.style.display === "block" ? "none" : "block";
    };

    /* CONTADOR */
    let contadorInterval = null;
    dataInput.onchange = () => {
      if (contadorInterval) clearInterval(contadorInterval);

      contadorInterval = setInterval(() => {
        const inicio = new Date(dataInput.value);
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
          </div>`;
      }, 1000);
    };

    /* FUNDOS */
    document.querySelectorAll(".bg-card").forEach(card => {
      card.onclick = () => {
        document.querySelectorAll(".bg-card")
          .forEach(c => c.classList.remove("selected"));
        card.classList.add("selected");
        preview.className = "preview " + card.dataset.bg;
      };
    });

    /* MÚSICA */
    const musicBox = document.getElementById("musicBox");
    const musicaInput = document.getElementById("musicaInput");
    const audio = document.getElementById("audioPlayer");
    const removeMusic = document.getElementById("removeMusic");

    musicBox.onclick = () => musicaInput.click();

    musicaInput.onchange = () => {
      const file = musicaInput.files[0];
      if (!file) return;
      audio.src = URL.createObjectURL(file);
      audio.style.display = "block";
      musicBox.innerText = "🎶 Música pronta";
      removeMusic.style.display = "block";
    };

    removeMusic.onclick = () => {
      audio.src = "";
      audio.style.display = "none";
      musicaInput.value = "";
      musicBox.innerText = "Adicionar música 🎵";
      removeMusic.style.display = "none";
    };
  }

  /* ===============================
     CORAÇÕES (EDITOR + FINAL)
  ================================ */
  function criarCoracoes() {
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
     COMPRA
  ================================ */
  if (btnComprar) {
    btnComprar.onclick = () => {
      window.location.href = "https://mpago.la/26yFvLc";
    };
  }

});







































