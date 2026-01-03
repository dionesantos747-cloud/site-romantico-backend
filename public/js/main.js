document.addEventListener("DOMContentLoaded", () => {
  const nomeInput = document.getElementById("nomeInput");

if (nomeInput) {
  nomeInput.addEventListener("input", () => {
    console.log("digitando:", nomeInput.value);
  });
}

  console.log("DOM carregado");
  console.log("editor existe?", !!document.getElementById("editor"));
});

  /* ===============================
     ELEMENTOS (TODOS EXISTEM)
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
  const btnComprar = document.getElementById("btnComprar");

  /* ===============================
     TEXTO
  ================================ */
  if (isEditor && nomeInput && nome) {
    nomeInput.addEventListener("input", () => {
      nome.innerText = nomeInput.value;
    });
  }

  if (isEditor && msgInput && mensagem) {
    msgInput.addEventListener("input", () => {
      mensagem.innerText = msgInput.value;

    if (btnContinuarMensagem) {
  if (mensagem.scrollHeight > 180) {
    mensagem.classList.add("limitada");
    btnContinuarMensagem.style.display = "block";
  } else {
    mensagem.classList.remove("limitada");
    btnContinuarMensagem.style.display = "none";
  }
}


  if (btnContinuarMensagem && mensagem) {
    btnContinuarMensagem.addEventListener("click", () => {
      mensagem.classList.remove("limitada");
      btnContinuarMensagem.style.display = "none";
    });
  }

  /* ===============================
     CARTA
  ================================ */
  if (isEditor && cartaInput && carta && btnCarta) {
    cartaInput.addEventListener("input", () => {
      carta.innerText = cartaInput.value;
      btnCarta.style.display = cartaInput.value.trim() ? "block" : "none";
    });

    btnCarta.addEventListener("click", () => {
      carta.style.display =
        carta.style.display === "block" ? "none" : "block";
    });
  }

  /* ===============================
     FUNDOS (FIX REAL)
  ================================ */
  if (isEditor && preview) {
    document.querySelectorAll(".bg-card").forEach(card => {
      card.addEventListener("click", () => {
        document
          .querySelectorAll(".bg-card")
          .forEach(c => c.classList.remove("selected"));

        card.classList.add("selected");

        preview.classList.remove("azul", "roxo", "rosa", "preto");
        preview.classList.add(card.dataset.bg);
      });
    });
  }

  /* ===============================
     MÚSICA (MOBILE OK)
  ================================ */
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
      musicBox.innerText = "🎶 Música pronta";

      if (removeMusic) removeMusic.style.display = "block";
    });

    if (removeMusic) {
      removeMusic.addEventListener("click", () => {
        audio.pause();
        audio.src = "";
        musicaInput.value = "";
        audio.style.display = "none";
        musicBox.innerText = "Adicionar música 🎵";
        removeMusic.style.display = "none";
      });
    }
  }

  /* ===============================
     CONTADOR (FIX)
  ================================ */
let contadorInterval = null;

function iniciarContador(dataInicio) {
  if (!dataInicio || !tempo) return;

  if (contadorInterval) clearInterval(contadorInterval);

  contadorInterval = setInterval(() => {
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
     CORAÇÕES
  ================================ */
  if (preview) {
    for (let i = 0; i < 12; i++) {
      const h = document.createElement("div");
      h.className = "heart";
      h.innerText = "❤️";
      h.style.left = Math.random() * 100 + "%";
      h.style.animationDuration = 6 + Math.random() * 6 + "s";
      preview.appendChild(h);
    }
  }


  /* ===============================
     COMPRA
  ================================ */
  if (btnComprar) {
    btnComprar.addEventListener("click", () => {
      window.location.href = "https://mpago.la/26yFvLc";
    });
  }

});
















































