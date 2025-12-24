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
  // Pop-offline removido
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
    console.log("Sincronizado do offline para Firebase:", d.id);
  }
  localStorage.removeItem(STORAGE_KEY);
}

// ================= PDF =================
function gerarPDF(d) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });

  const margin = 20;
  let y = margin;

  // Logo fixa, sem distorção
  if(d.logo){
    pdf.addImage(d.logo,"PNG",80,20,50,30); // 50x30mm fixo
  }

  y += 35;
  pdf.setFontSize(14).setFont("times","bold");
  pdf.text("CheckInfra",105,y,{align:"center"});
  y += 7;

  pdf.setFontSize(12).setFont("times","normal");
  pdf.text(
    "RELATÓRIO DE DIAGNÓSTICO DE INFRAESTRUTURA SANITÁRIA ESCOLAR",
    105,y,{align:"center"}
  );
  y += 12;

  // Card Identificação
  pdf.setFillColor(240,240,240);
  pdf.roundedRect(margin,y,170,35,5,5,"F");
  pdf.setFont("times","bold");
  pdf.text("Identificação",margin+3,y+7);
  pdf.setFont("times","normal");
  pdf.text(`Escola: ${d.escola}`,margin+3,y+15);
  pdf.text(`Avaliador: ${d.avaliador}`,margin+3,y+22);
  pdf.text(`ID: ${d.id}`,margin+3,y+29);
  y += 40;

  // Card Problemas apontados
  pdf.setFillColor(240,240,240);
  pdf.roundedRect(margin,y,170,d.problemas.length*7 + 20,5,5,"F");
  pdf.setFont("times","bold");
  pdf.text("Problemas apontados",margin+3,y+7);
  pdf.setFont("times","normal");
  let yP = y + 14;
  d.problemas.forEach(p=>{
    pdf.text(`- ${p}`,margin+5,yP);
    yP += 7;
  });
  y = yP + 5;

  // Card Resultado
  pdf.setFillColor(255, 255, 255); // fundo branco
  pdf.roundedRect(margin,y,170,30,5,5,"F");
  pdf.setFont("times","bold");
  pdf.text("Resultado",margin+3,y+7);
  pdf.setFont("times","normal");
  pdf.text(`Situação: ${d.status}`,margin+3,y+15);
  pdf.text(`Pontuação: ${d.pontuacao}`,margin+3,y+22);
  y += 35;

  // Card Registro fotográfico
  pdf.setFillColor(240,240,240);
  let fotoCardAltura = d.fotos.length>0 ? d.fotos.length*55 + 20 : 30;
  pdf.roundedRect(margin,y,170,fotoCardAltura,5,5,"F");
  pdf.setFont("times","bold");
  pdf.text("Registro Fotográfico",margin+3,y+7);
  pdf.setFont("times","normal");
  let yF = y + 14;
  d.fotos.forEach(file => {
    pdf.addImage(file,'JPEG',margin+3,yF,50,50);
    yF += 55;
  });
  y += fotoCardAltura + 5;

  // Card Aviso legal
  pdf.setFillColor(255,255,255);
  pdf.roundedRect(margin,y,170,20,5,5,"F");
  pdf.setFont("times","normal");
  pdf.text("Diagnóstico preliminar. Não substitui vistoria técnica presencial ou laudo de engenharia.",105,y+10,{align:"center"});
  y += 25;

  // Data da geração na lateral direita
  pdf.setFont("times","normal").setTextColor(255,0,0);
  pdf.text(`Data: ${new Date().toLocaleString()}`,200,280,{align:"right"});

  // Número da página
  pdf.setTextColor(0,0,0);
  pdf.text(`Página 1`,105,295,{align:"center"});

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

    resultado.style.display = "block";
    resultado.className = "resultado resultado-" + classe;
    resultado.innerHTML = `
      <div class="selo">${status}</div>
      <strong>ID:</strong> ${dados.id}<br>
      <strong>Pontuação:</strong> ${pontuacao}<br>
      <strong>Avaliador:</strong> ${dados.avaliador}<br>
      ${navigator.onLine?"☁️ Enviado ao sistema":"📴 Salvo offline"}
    `;

    try{
      console.log("Tentando salvar no Firebase:", dados.id, navigator.onLine);
      if(navigator.onLine){
        await db.collection("avaliacoes").doc(dados.id).set({
          ...dados,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("Salvo com sucesso no Firebase:", dados.id);
      } else salvarOffline(dados);
    }catch(err){
      console.error("Erro ao salvar no Firebase:", err);
      salvarOffline(dados);
    }

    gerarPDF(dados);

    form.reset();
    preview.innerHTML="";

    // Redirecionamento automático após 4 segundos
    setTimeout(() => {
      window.location.href = './index.html';
    }, 4000);
  });
});