/* ==========================
   ESTADO GLOBAL
========================== */
const state = {
  nome: "",
  mensagem: "",
  carta: "",
  dataInicio: "",
  fotos: [],
  musica: null,
  fundo: "azul"
};

const previewFrame = document.getElementById("previewFrame");

/* ==========================
   ELEMENTOS
========================== */
const nomeInput = document.getElementById("nomeInput");
const msgInput = document.getElementById("msgInput");
const cartaInput = document.getElementById("cartaInput");
const dataInput = document.getElementById("dataInput");
const fotoInput = document.getElementById("fotoInput");
const musicaInput = document.getElementById("musicaInput");
const miniaturas = document.getElementById("miniaturas");
const comprarBtn = document.getElementById("comprarBtn");
const removeMusicBtn = document.getElementById("removeMusic");

/* ==========================
   PREVIEW BASE
========================== */
function renderPreview() {
  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body{
  margin:0;
  font-family:Arial, sans-serif;
  background:${bgColor()};
  color:${state.fundo === "branco" ? "#000" : "#fff"};
  overflow:hidden;
}
.container{
  padding:16px;
}
h1{
  text-align:center;
  margin-bottom:12px;
}
.texto{
  font-size:0.95em;
  line-height:1.4;
}
.ler-mais{
  color:#ffd400;
  text-align:center;
  margin-top:8px;
  cursor:pointer;
}
.polaroid{
  background:#fff;
  color:#000;
  padding:8px;
  border-radius:6px;
}
.slider{
  position:relative;
  overflow:hidden;
  margin:16px 0;
}
.slider-track{
  display:flex;
  transition:transform 0.6s ease;
}
.slide{
  min-width:100%;
  padding:6px;
}
.slide img{
  width:100%;
  height:220px;
  object-fit:cover;
  border-radius:4px;
}
.dots{
  text-align:center;
  margin-top:6px;
}
.dot{
  display:inline-block;
  width:6px;
  height:6px;
  background:#ccc;
  border-radius:50%;
  margin:0 3px;
}
.dot.active{background:#ffd400}
.carta-btn{
  margin:16px auto;
  background:#ffd400;
  color:#000;
  padding:10px;
  border-radius:12px;
  width:100%;
  text-align:center;
}
.carta{
  display:none;
  margin-top:10px;
  font-size:0.9em;
}
.tempo{
  margin-top:14px;
  text-align:center;
  font-size:0.85em;
}
</style>
</head>
<body>
<div class="container">

<h1>${state.nome || "Título do site"}</h1>

<div class="texto">
${textoLimitado(state.mensagem)}
</div>

${sliderHTML()}

<div class="carta-btn" onclick="toggleCarta()">Abrir carta 💌</div>
<div class="carta" id="carta">${state.carta || ""}</div>

<div class="tempo">${tempoJuntos()}</div>

${state.musica ? `<audio src="${state.musica}" autoplay loop></audio>` : ""}

</div>

<script>
let index=0;
const slides=document.querySelectorAll('.slide');
const dots=document.querySelectorAll('.dot');
setInterval(()=>{
  if(slides.length<=1)return;
  index=(index+1)%slides.length;
  document.querySelector('.slider-track').style.transform=
    'translateX(-'+index*100+'%)';
  dots.forEach(d=>d.classList.remove('active'));
  dots[index].classList.add('active');
},4000);

function toggleCarta(){
  const c=document.getElementById('carta');
  c.style.display=c.style.display==='block'?'none':'block';
}
</script>

</body>
</html>
`;
  previewFrame.srcdoc = html;
}

/* ==========================
   FUNÇÕES AUX
========================== */
function bgColor() {
  return {
    rosa: "linear-gradient(#ff8fc7,#ff5fa2)",
    azul: "linear-gradient(#4da6ff,#1c3faa)",
    vermelho: "linear-gradient(#ff6b6b,#b30000)",
    preto: "#000",
    branco: "#fff"
  }[state.fundo];
}

function textoLimitado(txt) {
  if (!txt) return "";
  if (txt.length <= 500) return txt;
  return txt.slice(0, 500) + "...";
}

function sliderHTML() {
  if (!state.fotos.length) return "";
  const slides = state.fotos.map(f => `
    <div class="slide">
      <div class="polaroid"><img src="${f}"></div>
    </div>`).join("");

  const dots = state.fotos.length > 1
    ? `<div class="dots">${state.fotos.map((_,i)=>
        `<span class="dot ${i===0?'active':''}"></span>`).join("")}</div>`
    : "";

  return `
  <div class="slider">
    <div class="slider-track">${slides}</div>
  </div>
  ${dots}
  `;
}

function tempoJuntos() {
  if (!state.dataInicio) return "";
  const ini = new Date(state.dataInicio);
  const diff = Date.now() - ini.getTime();
  const dias = Math.floor(diff / (1000*60*60*24));
  return `⏳ ${dias} dias juntos`;
}

/* ==========================
   EVENTOS
========================== */
[nomeInput, msgInput, cartaInput, dataInput].forEach(el => {
  el.addEventListener("input", () => {
    state[el.id.replace("Input","")] = el.value;
    el.classList.remove("erro");
    renderPreview();
  });
});

/* ==========================
   FUNDO
========================== */
document.querySelectorAll(".cores button").forEach(btn => {
  btn.onclick = () => {
    state.fundo = btn.dataset.cor;
    renderPreview();
  };
});

/* ==========================
   UPLOAD FOTO
========================== */
fotoInput.addEventListener("change", async e => {
  const files = [...e.target.files];
  for (let file of files) {
    if (state.fotos.length >= 10) break;
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/upload-image", { method:"POST", body:fd });
    const json = await res.json();
    state.fotos.push(json.url);
  }
  renderMiniaturas();
  renderPreview();
});

function renderMiniaturas() {
  miniaturas.innerHTML = "";
  state.fotos.forEach((f,i)=>{
    const d=document.createElement("div");
    d.className="thumb";
    d.innerHTML=`<img src="${f}"><button>x</button>`;
    d.querySelector("button").onclick=()=>{
      state.fotos.splice(i,1);
      renderMiniaturas();
      renderPreview();
    };
    miniaturas.appendChild(d);
  });
}

/* ==========================
   MÚSICA
========================== */
musicaInput.addEventListener("change", async e => {
  const fd = new FormData();
  fd.append("file", e.target.files[0]);
  const res = await fetch("/upload-music",{method:"POST",body:fd});
  const json = await res.json();
  state.musica = json.url;
  renderPreview();
});

removeMusicBtn.onclick = () => {
  state.musica = null;
  musicaInput.value = "";
  renderPreview();
};

/* ==========================
   COMPRA
========================== */
comprarBtn.onclick = async () => {
  let erro=false;
  [nomeInput,msgInput,cartaInput,dataInput].forEach(el=>{
    if(!el.value){
      el.classList.add("erro");
      el.scrollIntoView({behavior:"smooth"});
      erro=true;
    }
  });
  if(erro) return;

  const res = await fetch("/create-payment",{
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify(state)
  });
  const json = await res.json();
  if(json.qr_base64){
    sessionStorage.setItem("pix", JSON.stringify(json));
    location.href="/aguardando.html";
  }
};

/* INIT */
renderPreview();
























































