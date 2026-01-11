document.addEventListener("DOMContentLoaded", () => {

  const isEditor = !!document.getElementById("editor");
  if (!isEditor) return;

  /* =====================
     ELEMENTOS
  ===================== */
  const nomeInput  = document.getElementById("nomeInput");
  const msgInput   = document.getElementById("msgInput");
  const cartaInput = document.getElementById("cartaInput");
  const dataInput  = document.getElementById("dataInput");

  const nome     = document.getElementById("nome");
  const mensagem = document.getElementById("mensagem");
  const carta    = document.getElementById("carta");
  const tempo    = document.getElementById("tempo");
  const preview  = document.getElementById("preview");

  const btnCarta   = document.getElementById("btnCarta");
  const btnComprar = document.getElementById("btnComprar");
  const lerBtn     = document.getElementById("lerBtn");
  const btnFecharCarta = document.getElementById("btnFecharCarta");

  const fotoInput = document.getElementById("fotoInput");
  const midias    = document.getElementById("midias");

  const musicBox    = document.getElementById("musicBox");
  const musicaInput = document.getElementById("musicaInput");
  const audio       = document.getElementById("audioPlayer");
  const removeMusic = document.getElementById("removeMusic");

  /* =====================
     ESTADO
  ===================== */
  let fotos = [null, null, null];
  let musicaUrl = null;
  let contadorInterval = null;

  /* =====================
     HELPERS (VALIDAÇÃO)
  ===================== */
  function erro(input) {
    input.classList.add("error");
    const txt = input.nextElementSibling;
    if (txt && txt.classList.contains("error-text")) {
      txt.style.display = "block";
    }
    input.scrollIntoView({ behavior: "smooth", block: "center" });
    input.focus();
  }

  function limparErro(input) {
    input.classList.remove("error");
    const txt = input.nextElementSibling;
    if (txt && txt.classList.contains("error-text")) {
      txt.style.display = "none";
    }
  }

  /* =====================
     TEXTO AO VIVO
  ===================== */
  let textoExpandido = false;

  msgInput.oninput = () => {
    mensagem.innerText = msgInput.value;
    limparErro(msgInput);

    if (mensagem.innerText.length > 500) {
      mensagem.classList.add("limitada");
      lerBtn.style.display = "block";
      lerBtn.innerText = textoExpandido
        ? "Ler menos ⬆️"
        : "Continuar lendo ⬇️";
    } else {
      mensagem.classList.remove("limitada");
      lerBtn.style.display = "none";
    }
  };

  lerBtn.onclick = () => {
    textoExpandido = !textoExpandido;
    if (textoExpandido) {
      mensagem.classList.remove("limitada");
      lerBtn.innerText = "Ler menos ⬆️";
    } else {
      mensagem.classList.add("limitada");
      lerBtn.innerText = "Continuar lendo ⬇️";
      mensagem.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  /* =====================
     CARTA
  ===================== */
  cartaInput.oninput = () => {
    carta.innerText = cartaInput.value;
    limparErro(cartaInput);
    btnCarta.style.display = cartaInput.value.trim() ? "block" : "none";
  };

  btnCarta.onclick = () => {
    carta.style.display = "block";
    btnCarta.style.display = "none";
  };

  btnFecharCarta.onclick = () => {
    carta.style.display = "none";
    btnCarta.style.display = "block";
    btnCarta.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  /* =====================
     FUNDOS
  ===================== */
  document.querySelectorAll(".bg-card").forEach(card => {
    card.onclick = () => {
      document.querySelectorAll(".bg-card").forEach(c =>
        c.classList.remove("selected")
      );
      card.classList.add("selected");
      preview.className = "preview " + card.dataset.bg;
    };
  });

  /* =====================
     FOTOS
  ===================== */
  document.querySelectorAll(".photo-slot").forEach(slot => {
    slot.onclick = () => {
      if (slot.classList.contains("filled")) return;
      fotoInput.dataset.slot = slot.dataset.slot;
      fotoInput.click();
    };
  });

  fotoInput.onchange = async () => {
    const file = fotoInput.files[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 8MB.");
      fotoInput.value = "";
      return;
    }

    const slot = Number(fotoInput.dataset.slot);
    if (slot < 0) return;

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/upload-image", {
        method: "POST",
        body: form
      });
      const data = await res.json();
      if (!data.url) throw new Error();

      fotos[slot] = data.url;

      const slotEl = document.querySelector(
        `.photo-slot[data-slot="${slot}"]`
      );

      slotEl.classList.add("filled");
      slotEl.innerHTML = `
        <img src="${data.url}">
        <div class="photo-remove">×</div>
      `;

      slotEl.querySelector(".photo-remove").onclick = () => {
        fotos[slot] = null;
        slotEl.classList.remove("filled");
        slotEl.innerHTML = "+";
        atualizarMidias();
      };

      atualizarMidias();
      fotoInput.value = "";

    } catch {
      alert("Erro ao enviar imagem");
    }
  };

  function atualizarMidias() {
    midias.innerHTML = "";

    const slider = document.createElement("div");
    slider.className = "slider";

    const track = document.createElement("div");
    track.className = "slider-track";

    fotos.filter(Boolean).forEach(url => {
      const slide = document.createElement("div");
      slide.className = "slide";
      slide.innerHTML = `
        <div class="polaroid">
          <img src="${url}">
        </div>
      `;
      track.appendChild(slide);
    });

    slider.appendChild(track);
    midias.appendChild(slider);

    iniciarSlider(track);
  }

  let sliderInterval = null;

  function iniciarSlider(track) {
    const slides = track.querySelectorAll(".slide");
    if (sliderInterval) clearInterval(sliderInterval);

    if (slides.length <= 1) return;

    const clone = slides[0].cloneNode(true);
    clone.classList.add("clone");
    track.appendChild(clone);

    let index = 0;

    sliderInterval = setInterval(() => {
      index++;
      track.style.transform = `translateX(-${index * 100}%)`;

      if (index === slides.length) {
        setTimeout(() => {
          track.style.transition = "none";
          index = 0;
          track.style.transform = "translateX(0)";
          track.offsetHeight;
          track.style.transition = "transform .8s ease";
        }, 800);
      }
    }, 3500);
  }

  /* =====================
     MÚSICA
  ===================== */
  musicBox.onclick = () => musicaInput.click();

  musicaInput.onchange = () => {
    const file = musicaInput.files[0];
    if (!file) return;

    const audioTest = document.createElement("audio");
    audioTest.src = URL.createObjectURL(file);
    audioTest.onloadedmetadata = () => {
      if (audioTest.duration > 180) {
        alert("A música deve ter no máximo 3 minutos.");
        musicaInput.value = "";
        return;
      }
      enviarMusica(file);
    };
  };

  async function enviarMusica(file) {
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch("/upload-music", {
        method: "POST",
        body: form
      });
      const data = await res.json();

      musicaUrl = data.url;
      audio.src = musicaUrl;
      audio.style.display = "block";
      removeMusic.style.display = "block";
      musicBox.innerText = "🎶 Música adicionada";

    } catch {
      alert("Erro ao enviar música");
    }
  }

  /* =====================
     CONTADOR
  ===================== */
  dataInput.onchange = () => {
    limparErro(dataInput);
    if (contadorInterval) clearInterval(contadorInterval);

    contadorInterval = setInterval(() => {
      const diff = Date.now() - new Date(dataInput.value).getTime();
      if (diff < 0) return;

      tempo.innerHTML = `<span class="titulo">Já estamos juntos 💖</span>`;
    }, 1000);
  };

/* =====================
   COMPRA
===================== */
if (btnComprar) {
  btnComprar.onclick = async () => {

    if (!nomeInput.value.trim()) return erro(nomeInput);
    if (!msgInput.value.trim()) return erro(msgInput);
    if (!cartaInput.value.trim()) return erro(cartaInput);
    if (!dataInput.value) return erro(dataInput);

    const payload = {
      nome: nomeInput.value,
      mensagem: msgInput.value,
      carta: cartaInput.value,
      dataInicio: dataInput.value,
      fotos: fotos.filter(Boolean),
      musica: musicaUrl,
      fundo: document.querySelector(".bg-card.selected")?.dataset.bg || "azul"
    };

    try {
      const res = await fetch("/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!data.payment_id) {
        alert("Erro ao gerar pagamento");
        return;
      }

      window.location.href =
        `/aguardando.html?payment_id=${data.payment_id}`;

    } catch {
      alert("Erro ao gerar pagamento");
    }
  };
}
  /* =====================
     CORAÇÕES
  ===================== */
  function criarCoracoesPreview() {
    document.querySelectorAll(".heart").forEach(h => h.remove());
    for (let i = 0; i < 10; i++) {
      const h = document.createElement("div");
      h.className = "heart";
      h.innerText = "❤️";
      h.style.left = Math.random() * 100 + "%";
      h.style.animationDuration = 6 + Math.random() * 6 + "s";
      preview.appendChild(h);
    }
  }

  criarCoracoesPreview();

});































































































