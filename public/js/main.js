document.addEventListener("DOMContentLoaded", () => {

  const isEditor = !!document.getElementById("editor");

  /* ===============================
     ELEMENTOS
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

  /* ===============================
     TEXTO — EDITOR
  ================================ */
  if (isEditor && nomeInput) {
    nomeInput.oninput = () => nome.innerText = nomeInput.value;
  }

  if (isEditor && msgInput) {
    msgInput.oninput = () => {
      mensagem.innerText = msgInput.value;
      ajustarMensagem();
    };
  }

  if (isEditor && cartaInput) {
    cartaInput.oninput = () => {
      carta.innerText = cartaInput.value;
      btnCarta.style.display =
        cartaInput.value.trim().length ? "block" : "none";
    };
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

  /* ===============================
     CARTA
  ================================ */
  if (btnCarta) {
    btnCarta.onclick = () => {
      carta.style.display =
        carta.style.display === "block" ? "none" : "block";
    };
  }

  /* ===============================
     FOTOS (EDITOR)
  ================================ */
  if (isEditor && fotoInput && midias) {
    document.querySelectorAll(".photo-slot").forEach(slot => {
      slot.onclick = () => {
        if (slot.classList.contains("filled")) return;
        slot.dataset.active = "true";
        fotoInput.click();
      };
    });

    fotoInput.onchange = e => {
      const file = e.target.files[0];
      const slot = document.querySelector(".photo-slot[data-active='true']");
      if (!file || !slot) return;

      const url = URL.createObjectURL(file);

      const div = document.createElement("div");
      div.className = "photo";
      div.innerHTML = `<img src="${url}">`;
      midias.appendChild(div);

      slot.classList.add("filled");
      slot.removeAttribute("data-active");

      criarDots();
      atualizarStack();
    };
  }

  /* ===============================
     CARROSSEL SIMPLES
  ================================ */
  let index = 0;

  function atualizarStack() {
    const fotos = document.querySelectorAll("#midias .photo");

    fotos.forEach((f, i) => {
      f.classList.toggle("active", i === index);
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
    if (fotos.length < 2) return;
    index = (index + 1) % fotos.length;
    atualizarStack();
  }, 3500);

});




























