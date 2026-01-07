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
  const btnContinuarMensagem = document.getElementById("btnContinuarMensagem");
const btnLerMenos = document.getElementById("btnLerMenos");
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
  nomeInput.oninput = () => {
    nome.innerText = nomeInput.value;
    limparErro(nomeInput);
  };

  msgInput.oninput = () => {
  mensagem.innerText = msgInput.value;
  limparErro(msgInput);

  if (mensagem.innerText.length > 500) {
    mensagem.classList.add("limitada");
    btnContinuarMensagem.style.display = "block";
  } else {
    mensagem.classList.remove("limitada");
    btnContinuarMensagem.style.display = "none";
  }
};

if (btnContinuarMensagem && btnLerMenos) {
  btnContinuarMensagem.onclick = () => {
    mensagem.classList.remove("limitada");
    btnContinuarMensagem.style.display = "none";
    btnLerMenos.style.display = "block";
  };

  btnLerMenos.onclick = () => {
    mensagem.classList.add("limitada");
    btnLerMenos.style.display = "none";
    btnContinuarMensagem.style.display = "block";
      mensagem.scrollIntoView({ behavior: "smooth", block: "center" });
  };
}




  /* =====================
     CARTA
  ===================== */
  cartaInput.oninput = () => {
    carta.innerText = cartaInput.value;
 limparErro(cartaInput);
    btnCarta.style.display = cartaInput.value.trim() ? "block" : "none";
  };

if (btnCarta) {
  btnCarta.onclick = () => {
    carta.style.display = "block";
    btnCarta.style.display = "none";
  };
}

if (btnFecharCarta) {
  btnFecharCarta.onclick = () => {
    carta.style.display = "none";
    btnCarta.style.display = "block";
    btnCarta.scrollIntoView({ behavior: "smooth", block: "center" });
  };
}

  /* =====================
     FUNDOS
  ===================== */
  document.querySelectorAll(".bg-card").forEach(card => {
    card.onclick = () => {
      document.querySelectorAll(".bg-card")
        .forEach(c => c.classList.remove("selected"));

      card.classList.add("selected");
      preview.className = "preview " + card.dataset.bg;
    };
  });

/* =====================
   FOTOS (POLAROID + MINIATURAS)
===================== */
document.querySelectorAll(".photo-slot").forEach(slot => {
  slot.onclick = () => {
    if (slot.classList.contains("filled")) return; // 🔒 bloqueia slot preenchido
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

  fotos.filter(Boolean).forEach(url => {
    const slide = document.createElement("div");
    slide.className = "slide";

    slide.innerHTML = `
      <div class="polaroid">
        <img src="${url}">
      </div>
    `;

    midias.appendChild(slide);
  });

  iniciarSlider();
}

let slideIndex = 0;
let sliderInterval = null;

function iniciarSlider() {
  const track = document.getElementById("midias");
  const slides = track.querySelectorAll(".slide");

  if (slides.length <= 1) return;

  // limpa tudo
  track.querySelectorAll(".clone").forEach(el => el.remove());
  if (sliderInterval) clearInterval(sliderInterval);

  // clona primeiro slide
  const clone = slides[0].cloneNode(true);
  clone.classList.add("clone");
  track.appendChild(clone);

  let index = 0;
  const total = slides.length + 1;

  track.style.transition = "transform .8s ease";
  track.style.transform = "translateX(0)";

  sliderInterval = setInterval(() => {
    index++;
    track.style.transform = `translateX(-${index * 100}%)`;

    if (index === total - 1) {
      setTimeout(() => {
        track.style.transition = "none";
        index = 0;
        track.style.transform = "translateX(0)";
        track.offsetHeight;
        track.style.transition = "transform .8s ease";
      }, 850);
    }
  }, 3500);
}



  /* =====================
     MÚSICA
  ===================== */
musicBox.onclick = () => musicaInput.click();

musicaInput.onchange = async () => {
  const file = musicaInput.files[0];
  if (!file) return;

const allowedTypes = [
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "video/mp4",
  "audio/x-m4a",
  "application/octet-stream"
];

if (!allowedTypes.includes(file.type)) {
  alert("Envie um arquivo MP3 ou MP4.");
  musicaInput.value = "";
  return;
}

// validar duração real
const audioTest = document.createElement("audio");
audioTest.preload = "metadata";
audioTest.src = URL.createObjectURL(file);

audioTest.onloadedmetadata = () => {
  URL.revokeObjectURL(audioTest.src);

  if (audioTest.duration > 180) {
    alert("A música deve ter no máximo 3 minutos.");
    musicaInput.value = "";
    return;
  }

  // ✅ passou na validação → segue upload
  enviarMusica(file);
};


async function enviarMusica(file) {
  const form = new FormData();
  form.append("file", file);

  musicBox.innerText = "⏳ Música carregando...";
  musicBox.classList.add("disabled");

  try {
    const res = await fetch("/upload-music", {
      method: "POST",
      body: form
    });

    const data = await res.json();
    if (!data.url) throw new Error();

    musicaUrl = data.url;
    audio.src = musicaUrl;
    audio.style.display = "block";

    musicBox.innerText = "🎶 Música adicionada";
    removeMusic.style.display = "block";

  } catch {
    alert("Erro ao enviar música");
    musicBox.innerText = "Adicionar música 🎵";
  }

  musicBox.classList.remove("disabled");
}

  /* =====================
     CONTADOR
  ===================== */
function plural(valor, singular, pluralTxt) {
  return valor === 1 ? singular : pluralTxt;
}
  
  dataInput.onchange = () => {
    limparErro(dataInput);
    if (contadorInterval) clearInterval(contadorInterval);

    contadorInterval = setInterval(() => {
      const inicio = new Date(dataInput.value);
      const diff = Date.now() - inicio.getTime();
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
    <div class="item">${a} ${plural(a,"ano","anos")}</div>
    <div class="item">${mo} ${plural(mo,"mês","meses")}</div>
    <div class="item">${d} ${plural(d,"dia","dias")}</div>
    <div class="item">${h}h ${m}m ${s}s</div>
  </div>
`;

    }, 1000);
  };

  /* =====================
     COMPRA (PIX)
  ===================== */
  btnComprar.onclick = async () => {
    if (!nomeInput.value.trim()) return erro(nomeInput);
    if (!msgInput.value.trim()) return erro(msgInput);
    if (!cartaInput.value.trim()) return erro(cartaInput);
    if (!dataInput.value) return erro(dataInput);

    const payload = {
      nome: nomeInput.value.trim(),
      mensagem: msgInput.value.trim(),
      carta: cartaInput.value.trim(),
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
      if (!data.payment_id) throw new Error();

      sessionStorage.setItem("pix_qr", data.qr_base64);
      sessionStorage.setItem("pix_copia", data.copia_cola);

      window.location.href =
        `/aguardando.html?payment_id=${data.payment_id}`;

    } catch {
      alert("Erro ao gerar pagamento");
    }
  };
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





















































































