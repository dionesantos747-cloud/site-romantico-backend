document.addEventListener("DOMContentLoaded", () => {

  const isEditor = !!document.getElementById("editor");
  if (!isEditor) return;

  /* =====================
     ELEMENTOS
  ===================== */
  const nomeInput  = document.getElementById("nomeInput");
  const msgInput   = document.getElementById("msgInput");
  const dataInput  = document.getElementById("dataInput");

  const nome     = document.getElementById("nome");
  const mensagem = document.getElementById("mensagem");
  const tempo    = document.getElementById("tempo");
  const preview  = document.getElementById("preview");

   const btnComprar = document.getElementById("btnComprar");
  const lerBtn     = document.getElementById("lerBtn");
 
  const fotoInput = document.getElementById("fotoInput");
  const midias    = document.getElementById("midias");

  const musicBox    = document.getElementById("musicBox");
  const musicaInput = document.getElementById("musicaInput");
  const audio       = document.getElementById("audioPlayer");
  const removeMusic = document.getElementById("removeMusic");
  const musicPlayer = document.getElementById("musicPlayer");
  const playBtn = document.getElementById("playBtn");
  const progress = document.querySelector(".progress");
/* =====================
   DATA
===================== */

const dateBox = document.getElementById("dateBox");

if (dateBox && dataInput) {

  dateBox.addEventListener("click", () => {
    if (dataInput.showPicker) {
      dataInput.showPicker();
    } else {
      dataInput.click();
    }
  });

  dataInput.addEventListener("change", () => {
    const data = dataInput.value;

    if (data) {
      const [ano, mes, dia] = data.split("-");
      dateBox.innerHTML = `📆 ${dia}/${mes}/${ano}`;
    }
    salvarEstado();
  });

}
  /* =====================
     ESTADO
  ===================== */
  let fotos = [null, null, null];
  let musicaUrl = null;
  let contadorInterval = null;
  let sliderInterval = null;

  /* =====================
     HELPERS
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

  function plural(v, s, p) {
    return v === 1 ? s : p;
  }
/* =====================
   PERSISTÊNCIA DA EDIÇÃO
===================== */

const STORAGE_KEY = "romantico_editor_state";

function salvarEstado() {
  const estado = {
    nome: nomeInput.value,
    mensagem: msgInput.value,
    data: dataInput.value,
    musica: musicaUrl,
    fundo: preview.classList.contains("azul") ? "azul" :
           preview.classList.contains("roxo") ? "roxo" :
           preview.classList.contains("rosa") ? "rosa" :
           preview.classList.contains("preto") ? "preto" : "azul",
    fotos
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
}

function carregarEstado() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  const estado = JSON.parse(raw);

  if (estado.nome) {
    nomeInput.value = estado.nome;
    nome.innerText = estado.nome;
  }

  if (estado.mensagem) {
    msgInput.value = estado.mensagem;
    mensagem.innerText = estado.mensagem;
  }

  if (estado.data) {
    dataInput.value = estado.data;
    dataInput.dispatchEvent(new Event("change"));
  }

  if (estado.fundo) {
    preview.classList.remove("azul","roxo","rosa","preto");
    preview.classList.add(estado.fundo);

    document.querySelectorAll(".bg-card").forEach(c => {
      c.classList.toggle("selected", c.dataset.bg === estado.fundo);
    });
  }

  if (estado.fotos?.length) {
    fotos = estado.fotos;
    atualizarMidias();
  }

  if (estado.musica) {
    musicaUrl = estado.musica;
    audio.src = musicaUrl;
    audio.load();

    musicPlayer.style.display = "flex";
    removeMusic.style.display = "block";
    musicBox.innerText = "🎵 Música adicionada";
  }
}
  /* =====================
     TEXTO AO VIVO
  ===================== */
  nomeInput.oninput = () => {
    nome.innerText = nomeInput.value;
    limparErro(nomeInput);
    salvarEstado();
  };

  let textoExpandido = false;

  msgInput.oninput = () => {
    mensagem.innerText = msgInput.value;
    limparErro(msgInput);
    salvarEstado();

   if (mensagem.innerText.length > 300) {
      mensagem.classList.add("limitada");
      lerBtn.style.display = "block";
     if (textoExpandido) {
  lerBtn.innerHTML = `
    <span class="ler-text">Ler menos</span>
    <span class="ler-icon up">⌃</span>
    <span class="ler-icon up">⌃</span>
  `;
} else {
  lerBtn.innerHTML = `
    <span class="ler-text">Continuar lendo</span>
    <span class="ler-icon down">⌄</span>
    <span class="ler-icon down">⌄</span>
  `;
}
    } else {
      mensagem.classList.remove("limitada");
      lerBtn.style.display = "none";
    }
  };

  lerBtn.onclick = () => {
    textoExpandido = !textoExpandido;
    mensagem.classList.toggle("limitada", !textoExpandido);
   if (textoExpandido) {
  lerBtn.innerHTML = `
    <span class="ler-text">Ler menos</span>
    <span class="ler-icon up">⌃</span>
    <span class="ler-icon up">⌃</span>
  `;
} else {
  lerBtn.innerHTML = `
    <span class="ler-text">Continuar lendo</span>
    <span class="ler-icon down">⌄</span>
    <span class="ler-icon down">⌄</span>
  `;
}
  };


  /* =====================
   FUNDOS
===================== */
document.querySelectorAll(".bg-card").forEach(card => {
  card.onclick = () => {
    document.querySelectorAll(".bg-card").forEach(c => c.classList.remove("selected"));
    card.classList.add("selected");

    preview.classList.remove("azul","roxo","rosa","preto");
    preview.classList.add(card.dataset.bg);
     salvarEstado();
  };
});
  /* =====================
     FOTOS + SLIDER
  ===================== */
   async function reduzirImagem(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const img = new Image();

    reader.onload = e => {
      img.onload = () => {
        const MAX = 1400;
        let w = img.width;
        let h = img.height;

        if (w > MAX || h > MAX) {
          const scale = MAX / Math.max(w, h);
          w = Math.floor(w * scale);
          h = Math.floor(h * scale);
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext("2d", { alpha: false });
        ctx.drawImage(img, 0, 0, w, h);

        canvas.toBlob(blob => {
          if (!blob) reject("Falha ao comprimir");
          else resolve(blob);
        }, "image/jpeg", 0.85);
      };

      img.onerror = () => reject("Erro ao carregar imagem");
      img.src = e.target.result;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
  
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

  // valida tamanho original antes de reduzir
  if (file.size > 20 * 1024 * 1024) {
    alert("A imagem deve ter no máximo 20MB.");
    fotoInput.value = "";
    return;
  }

 let imagemReduzida;
try {
  imagemReduzida = await reduzirImagem(file);
} catch {
  imagemReduzida = file; // fallback
}

  const form = new FormData();
  form.append("file", imagemReduzida, "foto.jpg");

  const slot = Number(fotoInput.dataset.slot);
  if (slot < 0) return;

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
       salvarEstado();
    };

    atualizarMidias();
     salvarEstado();
    fotoInput.value = "";

  } catch {
    alert("Erro ao enviar imagem");
  }
};

  function atualizarMidias() {
    midias.innerHTML = `
      <div class="slider">
        <div class="slider-track" id="editorSliderTrack">
          ${fotos.filter(Boolean).map(url => `
            <div class="slide">
              <div class="polaroid">
                <img src="${url}">
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    iniciarSlider(document.getElementById("editorSliderTrack"));
  }

  function iniciarSlider(track) {
  const slides = track.querySelectorAll(".slide");

  if (sliderInterval) clearInterval(sliderInterval);

  if (slides.length <= 1) return;

  // remove clones antigos
  track.querySelectorAll(".clone").forEach(el => el.remove());

  // clona o primeiro
  const clone = slides[0].cloneNode(true);
  clone.classList.add("clone");
  track.appendChild(clone);

  let index = 0;
  const total = slides.length + 1;

track.style.transition = "transform .8s ease";

sliderInterval = setInterval(() => {
  index++;
  track.style.transform = `translateX(-${index * 100}%)`;

  if (index === total - 1) {
    setTimeout(() => {
      track.style.transition = "none";
      index = 0;
      track.style.transform = "translateX(0)";
      track.offsetHeight; // força repaint
      track.style.transition = "transform .8s ease";
    }, 850);
  }
}, 3500);
  }

/* =====================
   MÚSICA (FIX FINAL ESTÁVEL)
===================== */

let isPickingMusic = false;

// abrir seletor
musicBox.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();

  if (isPickingMusic || musicaUrl) return;

  isPickingMusic = true;
  musicBox.classList.add("disabled");
  musicBox.style.pointerEvents = "none";

  musicaInput.click();

  // fallback mobile (cancelar seleção)
  setTimeout(() => {
    if (!musicaInput.files || musicaInput.files.length === 0) {
      isPickingMusic = false;
      musicBox.classList.remove("disabled");
      musicBox.style.pointerEvents = "auto";
    }
  }, 900);
});

// seleção da música
musicaInput.addEventListener("change", async () => {
  const file = musicaInput.files[0];

  if (!file) {
    isPickingMusic = false;
    musicBox.classList.remove("disabled");
    musicBox.style.pointerEvents = "auto";
    return;
  }

  musicBox.innerText = "⏳ Enviando música...";
  musicBox.style.pointerEvents = "none";

  const form = new FormData();
  form.append("file", file);

  try {
    const res = await fetch("/upload-music", {
      method: "POST",
      body: form
    });

    const data = await res.json();
    if (!data.url) throw new Error();

    musicaUrl = data.url;
     salvarEstado();

    // prepara áudio corretamente
    audio.pause();
    audio.src = musicaUrl;
    audio.load();

    // mostra player
    musicPlayer.style.display = "flex";
    removeMusic.style.display = "block";

    playBtn.innerHTML = "▶";
    progress.style.width = "0%";

    musicBox.innerText = "🎵 Música adicionada";

  } catch (err) {
    alert("Erro ao enviar música");

    musicaUrl = null;
    musicaInput.value = "";
    musicBox.innerText = "🎵 Adicionar música";
  }

  isPickingMusic = false;
  musicBox.classList.remove("disabled");
  musicBox.style.pointerEvents = "auto";
});

// remover música
removeMusic.addEventListener("click", () => {
  musicaUrl = null;

  audio.pause();
  audio.src = "";
  audio.load();

  musicaInput.value = "";

  musicPlayer.style.display = "none";
  removeMusic.style.display = "none";

  playBtn.innerHTML = "▶";
  progress.style.width = "0%";

  isPickingMusic = false;
  musicBox.classList.remove("disabled");
  musicBox.style.pointerEvents = "auto";
  musicBox.innerText = "🎵 Adicionar música";
});
salvarEstado();
// play / pause
playBtn.addEventListener("click", () => {
  if (!audio.src) return;

  // se terminou, reinicia
  if (audio.ended) {
    audio.currentTime = 0;
    audio.play().catch(() => {});
    playBtn.innerHTML = "❚❚";
    return;
  }

  if (audio.paused) {
    audio.play().catch(() => {});
    playBtn.innerHTML = "❚❚";
  } else {
    audio.pause();
    playBtn.innerHTML = "▶";
  }
});

// progresso
audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;
  const percent = (audio.currentTime / audio.duration) * 100;
  progress.style.width = percent + "%";
});
  /* =====================
   FIM DA MÚSICA → RESET
===================== */

audio.addEventListener("ended", () => {
  audio.currentTime = 0;
  playBtn.innerHTML = "▶";
  progress.style.width = "0%";
});
  /* =====================
     CONTADOR
  ===================== */
 dataInput.onchange = () => {
  limparErro(dataInput);

  if (!dataInput.value) return;

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
      <span class="titulo">compartilhamos a vida já faz:</span>
      <div class="contador">
        <div class="item">${a} ${plural(a,"ano","anos")}</div>
        <div class="item">${mo} ${plural(mo,"mês","meses")}</div>
        <div class="item">${d} ${plural(d,"dia","dias")}</div>
        <div class="item tempo-hms">${h}h ${m}m ${s}s</div>
      </div>
    `;
  }, 1000);
};

  /* =====================
     COMPRA
  ===================== */
  btnComprar.onclick = async () => {
    if (!nomeInput.value.trim()) return erro(nomeInput);
    if (!msgInput.value.trim()) return erro(msgInput);
    if (!dataInput.value) return erro(dataInput);

    const payload = {
      nome: nomeInput.value,
      mensagem: msgInput.value,
      dataInicio: dataInput.value,
      fotos: fotos.filter(Boolean),
      musica: musicaUrl || null,
      fundo: document.querySelector(".bg-card.selected")?.dataset.bg || "azul"
    };

    const res = await fetch("/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!data.payment_id) return alert("Erro ao gerar pagamento");

    window.location.href = `/aguardando.html?payment_id=${data.payment_id}`;
  };

  /* =====================
     CORAÇÕES
  ===================== */
function criarCoracoesPreview() {
  // remove corações antigos
  document.querySelectorAll(".heart").forEach(h => h.remove());

  // cria novos corações
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
  carregarEstado();
});
    




















































































































