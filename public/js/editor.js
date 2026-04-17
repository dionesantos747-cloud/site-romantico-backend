document.addEventListener("DOMContentLoaded", () => {

  const isEditor = !!document.getElementById("editor");
  if (!isEditor) return;

  /* =====================
     ELEMENTOS
  ===================== */
const siteAlert = document.getElementById("siteAlert");
const siteAlertMessage = document.getElementById("siteAlertMessage");
const siteAlertOk = document.getElementById("siteAlertOk");

function mostrarAviso(msg) {
  if (!siteAlert || !siteAlertMessage) return;
  siteAlertMessage.innerText = msg;
  siteAlert.style.display = "flex";
}

function fecharAviso() {
  if (!siteAlert) return;
  siteAlert.style.display = "none";
}

if (siteAlertOk) {
  siteAlertOk.addEventListener("click", fecharAviso);
}

if (siteAlert) {
  siteAlert.addEventListener("click", (e) => {
    if (e.target === siteAlert) fecharAviso();
  });
}
  
  const nomeInput  = document.getElementById("nomeInput");
  const msgInput   = document.getElementById("msgInput");
  const dataInput  = document.getElementById("dataInput");

  const nome     = document.getElementById("nome");
  const heartPreviewName = document.getElementById("heartPreviewName");
  const mensagem = document.getElementById("mensagem");
  const tempo    = document.getElementById("tempo");
  const preview  = document.getElementById("preview");

  const cpfInput = document.getElementById("cpfInput");
const emailInput = document.getElementById("emailInput");

  const steps = Array.from(document.querySelectorAll(".step"));
const btnVoltarEtapa = document.getElementById("btnVoltarEtapa");
const btnProximoEtapa = document.getElementById("btnProximoEtapa");

  const stepNav = document.querySelector(".step-nav");
const buyerSection = document.getElementById("buyerSection");

function atualizarVisibilidadeStepNav() {
  if (!stepNav || !buyerSection) return;

  const topoBuyer = buyerSection.getBoundingClientRect().top;
  const alturaTela = window.innerHeight;

  // se a área de compra entrou na tela, esconde
  if (topoBuyer < alturaTela * 0.75) {
    stepNav.style.display = "none";
  } else {
    stepNav.style.display = "flex";
  }
}

let etapaAtual = 0;

function mostrarEtapa(index) {
  steps.forEach((step, i) => {
    step.classList.toggle("active", i === index);
  });

  if (btnVoltarEtapa) {
    btnVoltarEtapa.style.display = index === 0 ? "none" : "inline-block";
  }

  if (btnProximoEtapa) {
    btnProximoEtapa.innerText = index === steps.length - 1 ? "Finalizar" : "Próximo";
  }
}

function validarEtapaAtual() {
  if (etapaAtual === 0 && !nomeInput.value.trim()) {
    erro(nomeInput);
    return false;
  }

  if (etapaAtual === 1 && !msgInput.value.trim()) {
    erro(msgInput);
    return false;
  }

  if (etapaAtual === 2 && !dataInput.value) {
    erro(dataInput);
    return false;
  }

  return true;
}

  if (cpfInput) {
  cpfInput.addEventListener("input", () => {

    // remove tudo que não é número
    let v = cpfInput.value.replace(/\D/g, "").slice(0, 11);

    // formata CPF automaticamente
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");

    cpfInput.value = v;

    // remove erro ao digitar
    limparErro(cpfInput);
  });
}

   const btnComprar = document.getElementById("btnComprar");
  const lerBtn     = document.getElementById("lerBtn");

  function resetarBotaoCompra() {
  if (!btnComprar) return;
  btnComprar.disabled = false;
  btnComprar.innerText = "Gerar QR Code por R$15.80";
}

window.addEventListener("pageshow", () => {
  resetarBotaoCompra();
});

 const buyerHelpBtn = document.getElementById("buyerHelpBtn");

const buyerHelpMessage = 'Informe CPF e email para gerar o pagamento. Esses dados permitem localizar sua compra em caso de suporte ou reembolso.';
 
  const fotoInput = document.getElementById("fotoInput");
  const midias    = document.getElementById("midias");

  const musicBox    = document.getElementById("musicBox");
  const musicaInput = document.getElementById("musicaInput");
  const audio       = document.getElementById("audioPlayer");
  const removeMusic = document.getElementById("removeMusic");
  const musicPlayer = document.getElementById("musicPlayer");
  const playBtn = document.getElementById("playBtn");
  const progress = document.querySelector(".progress");
  const musicTitle = document.querySelector(".music-title");
/* =====================
   DATA
===================== */

const dateBox = document.getElementById("dateBox");

if (dateBox && dataInput) {

 dateBox.addEventListener("click", () => {
  dataInput.focus();
  dataInput.click();

  if (dataInput.showPicker) {
    dataInput.showPicker();
  }
});
dataInput.addEventListener("change", () => {

  limparErro(dataInput);

  const data = dataInput.value;
  if (!data) return;

  // formata data
  const [ano, mes, dia] = data.split("-");
  dateBox.innerHTML = `📆 ${dia}/${mes}/${ano}`;

  salvarEstado();

  // contador
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

 const scrollAtual = preview.scrollTop;
    
    tempo.innerHTML = `
      <span class="titulo">compartilhamos a vida já faz:</span>

      <div class="contador">
        <div class="item">
          <div class="numero">${a}</div>
          <div class="label">${plural(a,"ano","anos")}</div>
        </div>

        <div class="item">
          <div class="numero">${mo}</div>
          <div class="label">${plural(mo,"mês","meses")}</div>
        </div>

        <div class="item">
          <div class="numero">${d}</div>
          <div class="label">${plural(d,"dia","dias")}</div>
        </div>

        <div class="item tempo-hms">
          ${h}h ${m}m ${s}s
        </div>
      </div>
    `;

 preview.scrollTop = scrollAtual;
    
  }, 1000);

  criarCoracoesPreview();

});

}
  /* =====================
     ESTADO
  ===================== */
  let fotos = [null, null, null];
  let musicaUrl = null;
  let contadorInterval = null;
  let sliderInterval = null;
  
let nomeMusicaSelecionada = "Nossa Música";
  /* =====================
     HELPERS
  ===================== */
  function erro(input) {
    input.classList.add("error");
    const txt = input.nextElementSibling;
    if (txt && txt.classList.contains("error-text")) {
      txt.style.display = "block";
    }
   if (window.innerWidth < 768) {
  input.scrollIntoView({ behavior: "smooth", block: "center" });
}
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
  if (!nomeInput || !msgInput || !dataInput || !preview) return;

  const estado = {
    nome: nomeInput.value || "",
    mensagem: msgInput.value || "",
    data: dataInput.value || "",
    musica: audio?.src || null,
    nomeMusica: nomeMusicaSelecionada,
    fundo: preview.classList.contains("azul") ? "azul" :
           preview.classList.contains("roxo") ? "roxo" :
           preview.classList.contains("rosa") ? "rosa" :
           preview.classList.contains("preto") ? "preto" : "azul",
    fotos: [...fotos],
    textoExpandido: textoExpandido,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
}
function carregarEstado() {

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  const estado = JSON.parse(raw);

  /* ===== NOME ===== */

  if (estado.nome) {
    nomeInput.value = estado.nome;
    nome.innerText = estado.nome;

    if (heartPreviewName) {
      heartPreviewName.innerText = estado.nome.split(" ")[0];
    }
  }

  /* ===== MENSAGEM ===== */

  if (estado.mensagem) {
    msgInput.value = estado.mensagem;
    mensagem.innerText = estado.mensagem;
  }

  /* ===== ESTADO LER MAIS ===== */

  if (estado.textoExpandido && lerBtn) {

    textoExpandido = true;
    mensagem.classList.remove("limitada");

    lerBtn.style.display = "block";

    lerBtn.innerHTML = `
      <span class="ler-text">Ler menos</span>
      <span class="ler-icon up">⌃</span>
      <span class="ler-icon up">⌃</span>
    `;
  }

  /* ===== DATA ===== */

  if (estado.data) {
    dataInput.value = estado.data;
    dataInput.dispatchEvent(new Event("change"));
  }

  /* ===== FUNDO ===== */

  if (estado.fundo) {

    preview.classList.remove("azul","roxo","rosa","preto");
    preview.classList.add(estado.fundo);

    document.querySelectorAll(".bg-card").forEach(c => {
      c.classList.toggle("selected", c.dataset.bg === estado.fundo);
    });

  }

  /* ===== CORAÇÃO ===== */

  const heartContainer = document.querySelector(".heart-container");

  if (heartContainer) {
    heartContainer.style.display = estado.nome ? "block" : "none";
  }

  /* ===== FOTOS ===== */

  if (estado.fotos?.length) {

    fotos = estado.fotos;

    restaurarSlotsFotos();
    atualizarMidias();

  }

  /* ===== MÚSICA ===== */

  if (estado.musica) {

    musicaUrl = estado.musica;

    audio.src = musicaUrl;
    audio.load();

    if (estado.nomeMusica) {
  musicTitle.innerText = estado.nomeMusica;
  nomeMusicaSelecionada = estado.nomeMusica;
}

    musicPlayer.style.display = "flex";
    removeMusic.style.display = "block";

    musicBox.innerText = "🎵 Música adicionada";

  }

}
  /* =====================
     TEXTO AO VIVO
  ===================== */
nomeInput.oninput = () => {

  const nomeDigitado = nomeInput.value.trim();
  const primeiroNome = nomeDigitado.split(" ")[0];

  nome.innerText = nomeDigitado;

  if (heartPreviewName) {
    heartPreviewName.innerText = primeiroNome;
  }

  const heartContainer = document.querySelector(".heart-container");

  if (heartContainer) {
    heartContainer.style.display = nomeDigitado ? "block" : "none";
  }

  limparErro(nomeInput);
  salvarEstado();
  criarCoracoesPreview();
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
    criarCoracoesPreview();
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
  try {
    // 🔥 Decodificador moderno (HEIC / HDR / câmera)
    const bitmap = await createImageBitmap(file);

    const MAX = 1400;
    let w = bitmap.width;
    let h = bitmap.height;

    if (w > MAX || h > MAX) {
      const scale = MAX / Math.max(w, h);
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);

    ctx.drawImage(bitmap, 0, 0, w, h);

    return new Promise(resolve => {
      canvas.toBlob(
        blob => resolve(blob),
        "image/jpeg",
        0.88
      );
    });

  } catch (err) {
    console.warn("Falha ao reduzir imagem, enviando original", err);
    return file; // fallback seguro
  }
}
  
 document.querySelectorAll(".photo-slot").forEach(slot => {
  slot.onclick = () => {
    if (slot.classList.contains("filled")) return;

    fotoInput.value = "";              // ✅ ADICIONAR
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
                <img src="${url}" loading="lazy">
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;

    iniciarSlider(document.getElementById("editorSliderTrack"));
  }
function restaurarSlotsFotos() {
  document.querySelectorAll(".photo-slot").forEach((slotEl, index) => {
    const url = fotos[index];

    // limpa slot
    slotEl.classList.remove("filled");
    slotEl.innerHTML = "+";

    if (!url) return;

    slotEl.classList.add("filled");
    slotEl.innerHTML = `
      <img src="${url}">
      <div class="photo-remove">×</div>
    `;

    slotEl.querySelector(".photo-remove").onclick = () => {
      fotos[index] = null;
      slotEl.classList.remove("filled");
      slotEl.innerHTML = "+";
      atualizarMidias();
      salvarEstado();
    };
  });
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
    audio.currentTime = 0;
    
 musicTitle.innerText = "Nossa Música";
  
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
 // 🔹 limpar seleção da biblioteca
  document.querySelectorAll(".select-btn").forEach(b=>{
    b.innerText = "Escolher";
    b.classList.remove("selected-music");
  });
  
  salvarEstado();
});
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


  

function cpfValido(cpf) {
  cpf = cpf.replace(/\D/g, "");

  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++)
    soma += parseInt(cpf.charAt(i)) * (10 - i);

  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(cpf.charAt(9))) return false;

  soma = 0;
  for (let i = 0; i < 10; i++)
    soma += parseInt(cpf.charAt(i)) * (11 - i);

  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;

  return resto === parseInt(cpf.charAt(10));
}

function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
if (buyerHelpBtn) {
  buyerHelpBtn.addEventListener("click", () => {
    mostrarAviso("Informe CPF e Email para gerar o pagamento. Esses dados permitem localizar sua compra em caso de suporte ou reembolso.");
  });
}
  /* =====================
     COMPRA
  ===================== */
btnComprar.onclick = async () => {
  if (!nomeInput.value.trim()) return erro(nomeInput);
  if (!msgInput.value.trim()) return erro(msgInput);
  if (!dataInput.value) return erro(dataInput);
if (!cpfInput.value.trim() || !cpfValido(cpfInput.value)) {
  mostrarAviso("Digite um CPF válido.");
  return erro(cpfInput);
}
 if (!emailInput.value.trim()) {
  mostrarAviso("Preencha o email.");
  return erro(emailInput);
}

if (!emailValido(emailInput.value)) {
  mostrarAviso("Digite um email válido.");
  return erro(emailInput);
}
  btnComprar.disabled = true;
  btnComprar.innerText = "Gerando pagamento...";

  try {
   const cpfLimpo = cpfInput.value.replace(/\D/g, "");

const payload = {
  nome: nomeInput.value,
  mensagem: msgInput.value,
  dataInicio: dataInput.value,
  fotos: fotos.filter(Boolean),
  musica: musicaUrl || null,
  nomeMusica: nomeMusicaSelecionada,
  fundo: document.querySelector(".bg-card.selected")?.dataset.bg || "azul",
  cpf: cpfLimpo,
  email: emailInput.value.trim(),
};

    const res = await fetch("/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!data.payment_id) {
      throw new Error("Erro ao gerar pagamento");
    }

    // ✅ REDIRECIONA PRA TELA DE PAGAMENTO
    window.location.href = `/aguardando.html?payment_id=${data.payment_id}`;

  } catch (err) {
    mostrarAviso("Erro ao gerar pagamento.");
    btnComprar.disabled = false;
    btnComprar.innerText = "Gerar QR Code por R$15.80";
  }
};

  /* =====================
     CORAÇÕES
  ===================== */
function criarCoracoesPreview() {
  document.querySelectorAll(".heart").forEach(h => h.remove());

  for (let i = 0; i < 12; i++) {
    const h = document.createElement("div");
    h.className = "heart";
    h.innerText = "❤️";

    h.style.left = Math.random() * 100 + "%";

    /* nascer no fundo visível da preview, sem aumentar o scroll */
    h.style.top = "auto";
    h.style.bottom = "-20px";

    h.style.fontSize = (16 + Math.random() * 10) + "px";
    h.style.animationDuration = (6 + Math.random() * 6) + "s";
    h.style.animationDelay = (Math.random() * 5) + "s";

    preview.appendChild(h);
  }
}


if (btnVoltarEtapa) {
  btnVoltarEtapa.addEventListener("click", () => {
    if (etapaAtual > 0) {
      etapaAtual--;
      mostrarEtapa(etapaAtual);
    }
  });
}

if (btnProximoEtapa) {
  btnProximoEtapa.addEventListener("click", () => {
    if (!validarEtapaAtual()) return;

    if (etapaAtual < steps.length - 1) {
      etapaAtual++;
      mostrarEtapa(etapaAtual);
      return;
    }

    // última etapa: desce para CPF/email
    document.getElementById("buyerSection")?.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });
}
  
criarCoracoesPreview();
carregarEstado();
mostrarEtapa(etapaAtual);
atualizarVisibilidadeStepNav();

// 👇 COLOQUE AQUI
window.addEventListener("scroll", atualizarVisibilidadeStepNav);
window.addEventListener("resize", atualizarVisibilidadeStepNav);
/* =====================
   BIBLIOTECA DE MÚSICAS
===================== */

const previewAudio = document.getElementById("previewAudio");
const musicLibrary = document.getElementById("musicLibrary");

const openLibrary = document.getElementById("openMusicLibrary");
const closeLibrary = document.getElementById("closeMusicLibrary");

if(openLibrary){
openLibrary.onclick = ()=>{
musicLibrary.style.display = "block";
};
}

if(closeLibrary){
closeLibrary.onclick = ()=>{
musicLibrary.style.display = "none";
previewAudio.pause();
};
}

/* PREVIEW PLAY */

document.querySelectorAll(".preview-btn").forEach(btn=>{

btn.onclick = (e)=>{

const item = e.target.closest(".music-item");
const url = item.dataset.src;

if(previewAudio.src.includes(url) && !previewAudio.paused){
previewAudio.pause();
btn.innerText="▶";
return;
}

previewAudio.src = url;
previewAudio.play();
  previewAudio.currentTime = 0;

document.querySelectorAll(".preview-btn").forEach(b=>{
b.innerText="▶";
});

btn.innerHTML="❚❚";

};

});

/* ESCOLHER MUSICA */

document.querySelectorAll(".select-btn").forEach(btn=>{

btn.onclick = (e)=>{

const item = e.target.closest(".music-item");
const url = item.dataset.src;
const nomeMusica = item.querySelector("span").innerText;

/* salvar música */

musicaUrl = url;

/* preparar player */

audio.pause();
audio.src = url;
audio.load();

/* atualizar nome no player */

musicTitle.innerText = nomeMusica;

  nomeMusicaSelecionada = nomeMusica;
salvarEstado();

/* mostrar player */

musicPlayer.style.display = "flex";
removeMusic.style.display = "block";

playBtn.innerHTML = "▶";
progress.style.width = "0%";

musicBox.innerText = "🎵 Música selecionada";

/* resetar botões */

document.querySelectorAll(".select-btn").forEach(b=>{
b.innerText="Escolher";
b.classList.remove("selected-music");
});

/* marcar selecionada */

btn.innerText="✓ escolhida";
btn.classList.add("selected-music");

/* parar preview */

previewAudio.pause();
previewAudio.currentTime = 0;
  
  document.querySelectorAll(".preview-btn").forEach(b=>{
    b.innerText = "▶";
});

/* fechar biblioteca */

musicLibrary.style.display = "none";

/* salvar estado */

salvarEstado();

};

});

});






































































































































