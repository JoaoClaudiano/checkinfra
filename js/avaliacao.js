// ================= FIREBASE =================
const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
};

const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ================= ID =================
function gerarIdCheckInfra() {
  const d = new Date();
  return `CI-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}-${Math.random().toString(36).substring(2,8).toUpperCase()}`;
}

// ================= OFFLINE =================
const STORAGE_KEY = "checkinfra_pendentes";

function salvarOffline(dados){
  const l = JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");
  l.push(dados);
  localStorage.setItem(STORAGE_KEY,JSON.stringify(l));
}

async function sincronizarOffline(){
  if(!navigator.onLine) return;
  const l = JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");
  if(!l.length) return;

  for(const d of l){
    await db.collection("avaliacoes").doc(d.id).set({
      ...d,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
  localStorage.removeItem(STORAGE_KEY);
}

// ================= PDF =================
async function gerarPDF(d) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  const margin = 15;
  let y = margin;

  // Logo proporcional
  if(d.logo){
    const imgProps = pdf.getImageProperties(d.logo);
    const maxWidth = 40;
    const ratio = imgProps.width / imgProps.height;
    const width = maxWidth;
    const height = width / ratio;
    pdf.addImage(d.logo,"PNG",(210-width)/2,y,width,height);
    y += height + 5;
  }

  // Título central
  pdf.setFont("times","bold");
  pdf.setFontSize(16);
  pdf.text("CheckInfra",105,y,{align:"center"});
  y += 8;

  pdf.setFontSize(12);
  pdf.setFont("times","normal");
  pdf.text(
    "RELATÓRIO DE DIAGNÓSTICO DE INFRAESTRUTURA SANITÁRIA ESCOLAR",
    105,y,{align:"center"}
  );
  y += 12;

  // Data lateral direita em vermelho
  const dataGeracao = new Date().toLocaleString();
  pdf.setFontSize(9);
  pdf.setTextColor(255,0,0);
  pdf.text(`Gerado em: ${dataGeracao}`, 200, margin, {align:"right"});
  pdf.setTextColor(0,0,0);

  // ---------------- CARD 1 — IDENTIFICAÇÃO ----------------
  pdf.setFillColor(220,235,255); // azul clarinho
  pdf.roundedRect(margin,y,180,30,5,5,"F");
  pdf.setFont("times","bold"); pdf.setFontSize(12);
  pdf.text("Identificação", margin+3, y+7);
  pdf.setFont("times","normal"); pdf.setFontSize(10);
  pdf.text(`Escola: ${d.escola}`, margin+3, y+15);
  pdf.text(`Avaliador: ${d.avaliador}`, margin+3, y+22);
  pdf.text(`ID: ${d.id}`, margin+3, y+29);
  y += 35;

  // ---------------- CARD 2 — PROBLEMAS APONTADOS ----------------
  pdf.setFillColor(255,250,200); // amarelo suave
  const alturaProblemas = Math.max(20, d.problemas.length * 7 + 10);
  pdf.roundedRect(margin,y,180,alturaProblemas,5,5,"F");
  pdf.setFont("times","bold"); pdf.setFontSize(12);
  pdf.text("Problemas Apontados", margin+3, y+7);
  pdf.setFont("times","normal"); pdf.setFontSize(10);
  let yP = y+14;
  d.problemas.forEach(p=>{
    pdf.text(`- ${p}`, margin+5, yP);
    yP += 7;
  });
  y += alturaProblemas + 5;

  // ---------------- CARD 3 — RESULTADO ----------------
  let corResultado;
  switch(d.classe){
    case "ok": corResultado = [200,255,200]; break; // verde
    case "alerta": corResultado = [255,245,200]; break; // amarelo
    case "atencao": corResultado = [255,230,180]; break; // laranja
    case "critico": corResultado = [255,200,200]; break; // vermelho
    default: corResultado=[240,240,240];
  }
  pdf.setFillColor(...corResultado);
  pdf.roundedRect(margin,y,180,30,5,5,"F");
  pdf.setFont("times","bold"); pdf.setFontSize(12);
  pdf.text("Resultado", margin+3, y+7);
  pdf.setFont("times","normal"); pdf.setFontSize(10);
  pdf.text(`Status: ${d.status} ${d.corBolinha}`, margin+3, y+15);
  pdf.text(`Pontuação: ${d.pontuacao}`, margin+3, y+22);
  y += 35;

  // ---------------- CARD 4 — REGISTRO FOTOGRÁFICO ----------------
  const alturaFotos = d.fotos.length ? 55*d.fotos.length : 20;
  pdf.setFillColor(230,230,230); // cinza neutro
  pdf.roundedRect(margin,y,180,alturaFotos,5,5,"F");
  pdf.setFont("times","bold"); pdf.setFontSize(12);
  pdf.text("Registro Fotográfico", margin+3, y+7);
  pdf.setFont("times","normal"); pdf.setFontSize(10);
  let yF = y + 14;
  for(let i=0;i<d.fotos.length;i++){
    await new Promise(resolve=>{
      const reader = new Image();
      reader.src = d.fotos[i];
      reader.onload = ()=>{
        pdf.addImage(d.fotos[i],'JPEG',margin+3, yF, 50, 50);
        yF += 55;
        resolve();
      };
    });
  }
  y += alturaFotos + 5;

  // ---------------- CARD 5 — AVISO LEGAL ----------------
  pdf.setFillColor(245,245,245); // cinza claro
  pdf.roundedRect(margin,y,180,15,5,5,"F");
  pdf.setFont("times","bold"); pdf.setFontSize(10);
  pdf.text("Diagnóstico preliminar. Não substitui vistoria técnica presencial ou laudo de engenharia.", margin+3, y+10);

  // Salvar PDF
  pdf.save(`CheckInfra-${d.id}.pdf`);
}

// ================= MAIN =================
document.addEventListener("DOMContentLoaded",()=>{

  sincronizarOffline();

  const fotosInput = document.getElementById("fotos");
  const preview = document.getElementById("preview");
  let fotosBase64 = [];

  fotosInput.addEventListener("change",()=>{
    preview.innerHTML="";
    fotosBase64=[];
    [...fotosInput.files].forEach(file=>{
      const reader = new FileReader();
      reader.onload = e=>{
        fotosBase64.push(e.target.result);
        const img = document.createElement("img");
        img.src = e.target.result;
        preview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });

  const form = document.getElementById("form-avaliacao");
  const resultado = document.getElementById("resultado");

  form.addEventListener("submit", async e=>{
    e.preventDefault();

    let pontuacao = 0;
    let problemas = [];

    document.querySelectorAll(".check-card.selected").forEach(c=>{
      pontuacao += Number(c.dataset.peso);
      problemas.push(c.innerText.trim());
    });

    let status="Condição adequada",classe="ok",corBolinha="🟢";
    if(pontuacao >= 12){ status="Condição crítica"; classe="critico"; corBolinha="🔴"; }
    else if(pontuacao >= 8){ status="Atenção elevada"; classe="atencao"; corBolinha="🟠"; }
    else if(pontuacao >= 4){ status="Situação de alerta"; classe="alerta"; corBolinha="🟡"; }

    const escolaSelecionada = document.getElementById("escola").value;
    const objEscola = window.escolas.find(e=>e.nome===escolaSelecionada) || {};

    const dados = {
      id: gerarIdCheckInfra(),
      escola: escolaSelecionada,
      lat: objEscola.lat || null,
      lng: objEscola.lng || null,
      avaliador: document.getElementById("avaliador").value,

      pontuacao,
      status,
      classe,
      corBolinha,

      rt: 0,
      problemas,
      fotos: fotosBase64,
      logo: "./assets/logo-checkinfra.png"
    };

    // Mostrar card diagnóstico
    resultado.style.display = "block";
    resultado.className = "resultado resultado-" + classe;
    resultado.innerHTML = `
      <div class="selo">${status} ${corBolinha}</div>
      <strong>ID:</strong> ${dados.id}<br>
      <strong>Pontuação:</strong> ${pontuacao}<br>
      <strong>Avaliador:</strong> ${dados.avaliador}<br>
      ${navigator.onLine?"☁️ Enviado ao sistema":"📴 Salvo offline"}
    `;

    try{
      if(navigator.onLine){
        await db.collection("avaliacoes").doc(dados.id).set({
          ...dados,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      } else salvarOffline(dados);
    }catch{
      salvarOffline(dados);
    }

    // Gerar PDF
    await gerarPDF(dados);

    // Reset formulário e preview
    form.reset();
    preview.innerHTML="";

    // Redirecionamento automático após 4 segundos
    setTimeout(() => {
      window.location.href = './index.html';
    }, 4000);

  });
});