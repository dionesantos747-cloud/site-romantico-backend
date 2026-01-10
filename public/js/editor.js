document.addEventListener("DOMContentLoaded", () => {

  const editor = document.getElementById("editor");
  if (!editor) return;

  /* ELEMENTOS */
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
  const btnFecharCarta = document.getElementById("btnFecharCarta");
  const btnComprar = document.getElementById("btnComprar");
  const lerBtn = document.getElementById("lerBtn");

  const fotoInput = document.getElementById("fotoInput");
  const midias    = document.getElementById("midias");

  const musicBox    = document.getElementById("musicBox");
  const musicaInput = document.getElementById("musicaInput");
  const audio       = document.getElementById("audioPlayer");
  const removeMusic = document.getElementById("removeMusic");

  /* ESTADO */
  let fotos = [null, null, null];
  let musicaUrl = null;
  let textoExpandido = false;
  let sliderInterval = null;

  /* TEXTO AO VIVO */
  nomeInput.oninput = () => nome.innerText = nomeInput.value;

  msgInput.oninput = () => {
    mensagem.innerText = msgInput.value;

    if (mensagem.innerText.length > 500 && lerBtn) {
      mensagem.classList.add("limitada");
      lerBtn.style.display = "block";
      lerBtn.innerText = textoExpandido ? "Ler menos ⬆️" : "Continuar lendo ⬇️";
    } else if (lerBtn) {
      mensagem.classList.remove("limitada");
      lerBtn.style.display = "none";
    }
  };

  if (lerBtn) {
    lerBtn.onclick = () => {
      textoExpandido = !textoExpandido;
      mensagem.classList.toggle("limitada", !textoExpandido);
      lerBtn.innerText = textoExpandido ? "Ler menos ⬆️" : "Continuar lendo ⬇️";
    };
  }

  /* CARTA */
  cartaInput.oninput = () => {
    carta.innerText = cartaInput.value;
    btnCarta.style.display = cartaInput.value.trim() ? "block" : "none";
  };

  btnCarta.onclick = () => {
    carta.style.display = "block";
    btnCarta.style.display = "none";
  };

  btnFecharCarta.onclick = () => {
    carta.style.display = "none";
    btnCarta.style.display = "block";
  };

  /* FUNDO */
  document.querySelectorAll(".bg-card").forEach(card => {
    card.onclick = () => {
      document.querySelectorAll(".bg-card").forEach(c => c.classList.remove("selected"));
      card.classList.add("selected");
      preview.className = "preview " + card.dataset.bg;
    };
  });

  /* FOTOS */
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

    const slot = Number(fotoInput.dataset.slot);
    const form = new FormData();
    form.append("file", file);

    const res = await fetch("/upload-image", { method: "POST", body: form });
    const data = await res.json();

    fotos[slot] = data.url;

    const slotEl = document.querySelector(`.photo-slot[data-slot="${slot}"]`);
    slotEl.classList.add("filled");
    slotEl.innerHTML = `<img src="${data.url}"><div class="photo-remove">×</div>`;

    slotEl.querySelector(".photo-remove").onclick = () => {
      fotos[slot] = null;
      slotEl.classList.remove("filled");
      slotEl.innerHTML = "+";
      atualizarMidias();
    };

    atualizarMidias();
  };

  function atualizarMidias() {
    midias.innerHTML = "";
    if (sliderInterval) clearInterval(sliderInterval);

    const urls = fotos.filter(Boolean);
    if (!urls.length) return;

    const slider = document.createElement("div");
    slider.className = "slider";

    const track = document.createElement("div");
    track.className = "slider-track";

    urls.forEach(url => {
      const slide = document.createElement("div");
      slide.className = "slide";
      slide.innerHTML = `<div class="polaroid"><img src="${url}"></div>`;
      track.appendChild(slide);
    });

    slider.appendChild(track);
    midias.appendChild(slider);

    if (urls.length > 1) iniciarSlider(track);
  }

  function iniciarSlider(track) {
    let index = 0;
    const slides = track.children;

    sliderInterval = setInterval(() => {
      index = (index + 1) % slides.length;
      track.style.transform = `translateX(-${index * 100}%)`;
    }, 3500);
  }

});





























































































