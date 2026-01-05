document.addEventListener("DOMContentLoaded", () => {

  if (!document.getElementById("editor")) return;

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
  const btnContinuarMensagem = document.getElementById("btnContinuarMensagem");

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
     TEXTO
  ===================== */
  nomeInput.oninput = () => nome.innerText = nomeInput.value;

  msgInput.oninput = () => {
    mensagem.innerText = msgInput.value;
    if (mensagem.innerText.length > 500) {
      mensagem.classList.add("limitada");
      btnContinuarMensagem.style.display = "block";
    } else {
      mensagem.classList.remove("limitada");
      btnContinuarMensagem.style.display = "none";
    }
  };

  btnContinuarMensagem.onclick = () => {
    mensagem.classList.remove("limitada");
    btnContinuarMensagem.style.display = "none";
  };

  cartaInput.oninput = () => {
    carta.innerText = cartaInput.value;
    btnCarta.style.display = cartaInput.value.trim() ? "block" : "none";
  };

  btnCarta.onclick = () => {
    carta.style.display = carta.style.display === "block" ? "none" : "block";
  };

  /* =====================
     FUNDOS
  ===================== */
  document.querySelectorAll(".bg-card").forEach(card => {
    card.onclick = () => {
      document.querySelectorAll(".bg-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      preview.className = "preview " + card.dataset.bg;
    };
  });

  /* =====================
     FOTOS (POLAROID REAL)
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

    const slotIndex = Number(fotoInput.dataset.slot);
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/upload-image", { method: "POST", body: form });
    const data = await res.json();
    if (!data.url) return alert("Erro ao enviar imagem");

    fotos[slotIndex] = data.url;

    /* MINIATURA */
    const slot = document.querySelector(`.photo-slot[data-slot="${slotIndex}"]`);
    slot.classList.add("filled");
    slot.innerHTML = `
      <img src="${data.url}" style="width:100%;height:100%;object-fit:cover;border-radius:14px">
      <div class="photo-remove">×</div>
    `;

    slot.querySelector(".photo-remove").onclick = (e) => {
      e.stopPropagation();
      fotos[slotIndex] = null;
      slot.classList.remove("filled");
      slot.innerHTML = "+";
      renderPolaroids();
    };

    renderPolaroids();
    fotoInput.value = "";
  };

  function renderPolaroids() {
    midias.innerHTML = "";

    fotos.filter(Boolean).forEach(url => {
      const div = document.createElement("div");
      div.className = "photo active";
      div.innerHTML = `<img src="${url}">`;
      midias.appendChild(div);
    });
  }

  /* =====================
     MÚSICA
  ===================== */
  musicBox.onclick = () => musicaInput.click();

  musicaInput.onchange = async () => {
    const file = musicaInput.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("A música deve ter até ~1 minuto");
      musicaInput.value = "";
      return;
    }

    const form = new FormData();
    form.append("file", file);

    musicBox.innerText = "⏳ Enviando música...";
    const res = await fetch("/upload-music", { method: "POST", body: form });
    const data = await res.json();

    musicaUrl = data.url;
    audio.src = musicaUrl;
    audio.style.display = "block";
    musicBox.innerText = "🎶 Música pronta";
    removeMusic.style.display = "block";
  };

  removeMusic.onclick = () => {
    musicaUrl = null;
    audio.src = "";
    audio.style.display = "none";
    musicBox.innerText = "Adicionar música 🎵";
    removeMusic.style.display = "none";
  };

  /* =====================
     CONTADOR
  ===================== */
  dataInput.onchange = () => {
    if (contadorInterval) clearInterval(contadorInterval);
    contadorInterval = setInterval(() => {
      const ini = new Date(dataInput.value);
      const diff = Date.now() - ini;
      const dias = Math.floor(diff / 86400000);
      tempo.innerHTML = `<span class="titulo">Já estamos juntos há</span><div class="contador"><div class="item">${dias} dias</div></div>`;
    }, 1000);
  };

});



























































