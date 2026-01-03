document.addEventListener("DOMContentLoaded", () => {

  const isEditor = !!document.getElementById("editor");

  /* =====================
     ELEMENTOS
  ====================== */
  const nomeInput   = document.getElementById("nomeInput");
  const msgInput    = document.getElementById("msgInput");
  const cartaInput  = document.getElementById("cartaInput");
  const dataInput   = document.getElementById("dataInput");

  const nome        = document.getElementById("nome");
  const mensagem    = document.getElementById("mensagem");
  const carta       = document.getElementById("carta");
  const tempo       = document.getElementById("tempo");
  const preview     = document.getElementById("preview");

  const btnCarta    = document.getElementById("btnCarta");
  const btnComprar  = document.getElementById("btnComprar");
  const btnContinuarMensagem = document.getElementById("btnContinuarMensagem");

  const musicBox    = document.getElementById("musicBox");
  const musicaInput = document.getElementById("musicaInput");
  const audio       = document.getElementById("audioPlayer");
  const removeMusic = document.getElementById("removeMusic");

  /* =====================
     TEXTO AO VIVO
  ====================== */
  if (isEditor && nomeInput && nome) {
    nomeInput.addEventListener("input", () => {
      nome.innerText = nomeInput.value;
      limparErro(nomeInput);
    });
  }

  if (isEditor && msgInput && mensagem) {
    msgInput.addEventListener("input", () => {
      mensagem.innerText = msgInput.value;
      limparErro(msgInput);
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

  /* =====================
     CARTA
  ====================== */
  if (isEditor && cartaInput && carta && btnCarta) {
    cartaInput.addEventListener("input", () => {
      carta.innerText = cartaInput.value;
      limparErro(cartaInput);
      btnCarta.style.display = cartaInput.value.trim() ? "block" : "none";
    });

    btnCarta.onclick = () => {
      carta.style.display =
        carta.style.display === "block" ? "none" : "block";
    };
  }

  /* =====================
     FUNDOS
  ====================== */
  if (isEditor && preview) {
    document.querySelectorAll(".bg-card").forEach(card => {
      card.onclick = () => {
        document.querySelectorAll(".bg-card")
          .forEach(c => c.classList.remove("selected"));

        card.classList.add("selected");
        preview.className = "preview " + card.dataset.bg;
      };
    });
  }

  /* =====================
     MÚSICA
  ====================== */
  if (isEditor && musicBox && musicaInput && audio) {
    musicBox.onclick = () => musicaInput.click();

    musicaInput.onchange = () => {
      const file = musicaInput.files[0];
      if (!file) return;

      audio.src = URL.createObjectURL(file);
      audio.style.display = "block";
      musicBox.innerText = "🎶 Música pronta";
      if (removeMusic) removeMusic.style.display = "block";
    };

    if (removeMusic) {
      removeMusic.onclick = () => {
        audio.src = "";
        audio.style.display = "none";
        musicaInput.value = "";
        musicBox.innerText = "Adicionar música 🎵";
        removeMusic.style.display = "none";
      };
    }
  }

  /* =====================
     CONTADOR
  ====================== */
  let contador = null;

  if (isEditor && dataInput && tempo) {
    dataInput.onchange = () => {
      limparErro(dataInput);
      if (contador) clearInterval(contador);

      contador = setInterval(() => {
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
          </div>
        `;
      }, 1000);
    };
  }

  /* =====================
     VALIDAÇÃO + COMPRA
  ====================== */
  if (btnComprar) {
    btnComprar.onclick = () => {
      let valido = true;

      if (!nomeInput.value.trim()) erro(nomeInput);
      if (!msgInput.value.trim()) erro(msgInput);
      if (!cartaInput.value.trim()) erro(cartaInput);
      if (!dataInput.value) erro(dataInput);

      valido =
        nomeInput.value &&
        msgInput.value &&
        cartaInput.value &&
        dataInput.value;

      if (!valido) {
        document.querySelector(".error")?.scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
        return;
      }

      window.location.href = "/aguardando.html";
    };
  }

  function erro(el) {
    el.classList.add("error");
  }

  function limparErro(el) {
    el.classList.remove("error");
  }

});


















































