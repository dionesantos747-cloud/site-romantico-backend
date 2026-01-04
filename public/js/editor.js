/* ==========================
   ESTADO GLOBAL (ALINHADO AO BACKEND)
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

/* ==========================
   ELEMENTOS
========================== */
const previewFrame = document.getElementById("previewFrame");

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
   PREVIEW HTML (MOBILE REAL)
========================== */
function renderPreview() {
  previewFrame.srcdoc = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
body{
  margin:0;
  font-family:Arial,sans-serif;
  background:${bgColor()};
  color:${state.fundo === "branco" ? "#000" : "#fff"};
}
.container{
  padding:16px;
}
h1{
  text-align:center;
  margin-bottom:12px;
}
.texto{
  font-size:.95em;
  line-height:1.45;
}
.slider{
  margin:16px 0;
  overflow:hidden;
}
.slider-track{
  display:flex;
  transition:transform .7s ease;
}
.slide{
  min-width:100%;
  padding:6px;
}
.polaroid{
  background:#fff;
  padding:8px;
  border-radius:6px;
}
.polaroid img{
  width:100%;
  height:220px;
  object-fit:cover;
  border-radius:4px;
}
.dots{text-align:center;margin-top:6px}
.dot{
  width:6px;height:6px;
  background:#ccc;border-radius:50%;
  display:inline-block;margin:0 3px;
}
.dot.active{background:#ffd400}
.btn{
  margin:16px 0;
  background:#ffd400;
  color:#000;
  padding:12px;
  border-radius:14px;
  text-align:center;
}
.carta{display:none;font-size:.9em}
.tempo{text-align:center;font-size:.85em;margin-top:10px}
</style>
</head>
<body>

<div class="container">
  <h1>${state.nome || "Título do site"}</h1>

  <div class="texto">
    ${textoLimitado(state.mensagem)}
  </div>

  ${sliderHTML()}

  <div class="btn" onclick="toggleCarta()">Abrir carta 💌</div>
  <div class="carta" id="carta">${state.carta || ""}</div>

  <div class="tempo">${tempoJuntos()}</div>

  ${state.musica ? `<audio src="${state.musica}" autoplay loop></audio>` : ""}
</div>

<script>
let i=0;
const slides=document.querySelectorAll('.slide');
const dots=document.querySelectorAll('.dot');

setInterval(()=>{
  if(slides.length<=1)return;
  i=(i+1)%slides.length;
  document.querySelector('.slider-track').style.transform=
    'translateX(-'+i*100+'%)';
  dots.forEach(d=>d.classList.remove('active'));
  dots[i].classList.add('active');
},4000);

function toggleCarta(){
  const c=document.getElementById('carta');
  c.style.display=c.style.display==='block'?'none':'block';
}
</script>

</body>
</html>
`;
}

/* ==========================
   AUX
========================== */
function bgColor(){
  return {
    rosa:"linear-gradient(#ff8fc7,#ff5fa2)",
    azul:"linear-gradient(#4da6ff,#1c3faa)",
    vermelho:"linear-gradient(#ff6b6b,#b30000)",
    preto:"#000",
    branco:"#fff"
  }[state.fundo];
}

function textoLimitado(txt){
  if(!txt) return "";
  if(txt.length<=500) return txt;
  return txt.slice(0,500)+"...";
}

function sliderHTML(){
  if(!state.fotos.length) return "";
  return `
  <div class="slider">
    <div class="slider-track">
      ${state.fotos.map(f=>`
        <div class="slide">
          <div class="polaroid">
            <img src="${f}">
          </div>
        </div>`).join("")}
    </div>
  </div>
  ${state.fotos.length>1?
    `<div class="dots">${state.fotos.map((_,i)=>
      `<span class="dot ${i===0?'active':''}"></span>`).join("")}</div>`:""}
  `;
}

function tempoJuntos(){
  if(!state.dataInicio) return "";
  const ini=new Date(state.dataInicio);
  const dias=Math.floor((Date.now()-ini)/(1000*60*60*24));
  return `⏳ ${dias} dias juntos`;
}

/* ==========================
   INPUTS (CORRIGIDOS)
========================== */
nomeInput.oninput = () => {
  state.nome = nomeInput.value;
  nomeInput.classList.remove("erro");
  renderPreview();
};

msgInput.oninput = () => {
  state.mensagem = msgInput.value;
  msgInput.classList.remove("erro");
  renderPreview();
};

cartaInput.oninput = () => {
  state.carta = cartaInput.value;
  cartaInput.classList.remove("erro");
  renderPreview();
};

dataInput.oninput = () => {
  state.dataInicio = dataInput.value;
  dataInput.classList.remove("erro");
  renderPreview();
};

/* ==========================
   CORES FUNDO (INDICADOR)
========================== */
document.querySelectorAll(".cores button").forEach(btn=>{
  btn.onclick=()=>{
    document.querySelectorAll(".cores button")
      .forEach(b=>b.classList.remove("ativo"));
    btn.classList.add("ativo");
    state.fundo=btn.dataset.cor;
    renderPreview();
  };
});

/* ==========================
   FOTOS
========================== */
fotoInput.onchange = async e => {
  const files=[...e.target.files];

  if(files.length+state.fotos.length>10){
    alert("Máximo de 10 fotos 💖");
    fotoInput.value="";
    return;
  }

  for(const file of files){
    const fd=new FormData();
    fd.append("file",file);
    const res=await fetch("/upload-image",{method:"POST",body:fd});
    const json=await res.json();
    state.fotos.push(json.url);
  }

  renderMiniaturas();
  renderPreview();
};

function renderMiniaturas(){
  miniaturas.innerHTML="";
  state.fotos.forEach((f,i)=>{
    const d=document.createElement("div");
    d.className="thumb";
    d.innerHTML=`<img src="${f}"><button>×</button>`;
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
musicaInput.onchange = async e => {
  comprarBtn.innerText="Carregando música...";
  const fd=new FormData();
  fd.append("file",e.target.files[0]);

  const res=await fetch("/upload-music",{method:"POST",body:fd});
  const json=await res.json();

  state.musica=json.url;
  removeMusicBtn.style.display="block";
  comprarBtn.innerText="Gerar QR Code por R$ 9,99";
  renderPreview();
};

removeMusicBtn.onclick=()=>{
  state.musica=null;
  musicaInput.value="";
  removeMusicBtn.style.display="none";
  renderPreview();
};

/* ==========================
   COMPRA (FUNCIONANDO)
========================== */
comprarBtn.onclick = async () => {
  let erro=false;
  [nomeInput,msgInput,cartaInput,dataInput].forEach(el=>{
    if(!el.value){
      el.classList.add("erro");
      el.scrollIntoView({behavior:"smooth",block:"center"});
      erro=true;
    }
  });

  if(!state.fotos.length){
    alert("Adicione pelo menos uma foto 💖");
    erro=true;
  }

  if(erro) return;

  const res=await fetch("/create-payment",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(state)
  });

  const json=await res.json();

  if(!res.ok){
    alert(json.error||"Erro ao gerar pagamento");
    return;
  }

  sessionStorage.setItem("pix",JSON.stringify(json));
  location.href="/aguardando.html";
};

/* INIT */
renderPreview();
removeMusicBtn.style.display="none";
























































