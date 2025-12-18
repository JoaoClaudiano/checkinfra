// ================= FIREBASE =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
    await setDoc(doc(db,"avaliacoes",d.id),{...d,createdAt:serverTimestamp()});
  }
  localStorage.removeItem(STORAGE_KEY);
}

// ================= PDF =================
async function gerarPDF(d) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });

  const margin = 15;
  let y = margin;

  // Logo
  const img = new Image();
  img.src = "./assets/logo-checkinfra.png";
  img.onload = () => {
    const imgProps = pdf.getImageProperties(img);
    const pdfWidth = 50;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(img, 'PNG', (210 - pdfWidth) / 2, y, pdfWidth, pdfHeight);
    y += pdfHeight + 10;

    // CARD: Identificação
    pdf.setFillColor(240, 240, 240);
    pdf.roundedRect(margin, y, 180, 35, 3, 3, 'F');
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Identificação", margin + 2, y + 7);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text(`Escola: ${d.escola}`, margin + 5, y + 15);
    pdf.text(`Avaliador: ${d.avaliador}`, margin + 5, y + 22);
    pdf.text(`Data da Avaliação: ${new Date().toLocaleDateString()}`, margin + 5, y + 29);
    y += 40;

    // CARD: Problemas apontados
    pdf.setFillColor(240, 240, 240);
    pdf.roundedRect(margin, y, 180, Math.max(20, d.problemas.length * 7 + 15), 3, 3, 'F');
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Problemas Apontados", margin + 2, y + 7);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    let py = y + 15;
    d.problemas.forEach(p => {
      pdf.text(`- ${p}`, margin + 5, py);
      py += 7;
    });
    y = py + 5;

    // CARD: Registro Fotográfico
    pdf.setFillColor(240, 240, 240);
    const photoCardHeight = d.fotos.length ? 60 + Math.floor(d.fotos.length / 2) * 70 : 25;
    pdf.roundedRect(margin, y, 180, photoCardHeight, 3, 3, 'F');
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Registro Fotográfico", margin + 2, y + 7);
    y += 15;
    if(d.fotos.length){
      let x = margin + 5;
      let rowHeight = 60;
      d.fotos.forEach((imgSrc, index) => {
        pdf.addImage(imgSrc, "JPEG", x, y, 80, 60);
        x += 90;
        if(x + 80 > 210 - margin) { x = margin + 5; y += rowHeight + 10; }
        if(y + rowHeight > 297 - margin) { pdf.addPage(); y = margin + 15; x = margin + 5; }
      });
      y += rowHeight + 10;
    } else {
      y += 20;
    }

    // CARD: Resultado
    pdf.setFillColor(240, 240, 240);
    pdf.roundedRect(margin, y, 180, 35, 3, 3, 'F');
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.text("Resultado", margin + 2, y + 7);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.text(`Status: ${d.status}`, margin + 5, y + 15);
    pdf.text(`Pontuação: ${d.pontuacao}`, margin + 5, y + 22);
    pdf.text(`ID do Diagnóstico: ${d.id}`, margin + 5, y + 29);
    y += 45;

    // Nota legal
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(10);
    pdf.text("Este relatório é um diagnóstico preliminar e não substitui vistoria técnica presencial ou laudo de engenharia.", margin, y, { maxWidth: 180 });
    y += 10;

    // Rodapé: data da impressão
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(80);
    pdf.text(`Data da impressão: ${new Date().toLocaleDateString()}`, 210 - margin, 287, { align: "right" });

    // Salvar PDF
    pdf.save(`CheckInfra-${d.id}.pdf`);
  };
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
      const reader=new FileReader();
      reader.onload=e=>{
        fotosBase64.push(e.target.result);
        const img=document.createElement("img");
        img.src=e.target.result;
        preview.appendChild(img);
      };
      reader.readAsDataURL(file);
    });
  });

  const form = document.getElementById("form-avaliacao");
  const resultado = document.getElementById("resultado");

  form.addEventListener("submit", async e=>{
    e.preventDefault();

    // Calcula pontuação e problemas
    let pontuacao = 0;
    let problemas = [];
    document.querySelectorAll(".check-card.selected").forEach(c=>{
      pontuacao += Number(c.dataset.peso);
      problemas.push(c.innerText.trim());
    });

    // Determina status
    let status="Adequada",classe="ok";
    if(pontuacao>=8){status="Crítica";classe="critico";}
    else if(pontuacao>=4){status="Alerta";classe="alerta";}

    // Dados avaliação
    const dados = {
      id: gerarIdCheckInfra(),
      escola: document.getElementById("escola").value,
      avaliador: document.getElementById("avaliador").value,
      pontuacao,
      status,
      classe,
      problemas,
      fotos: fotosBase64
    };

    // Define global ID para HTML
    window.idcheckinfra = dados.id;

    // Atualiza card de diagnóstico
    resultado.style.display = "block";
    resultado.className = "resultado resultado-" + classe;
    resultado.innerHTML = `
      <div class="selo">${classe === "ok" ? "Condição adequada" :
        classe === "alerta" ? "Situação de alerta" :
        "Condição crítica"}</div>
      <strong>IDCHECKINFRA:</strong><br>${dados.id}<br>
      <strong>Pontuação:</strong> ${pontuacao}<br>
      <strong>Avaliador:</strong> ${dados.avaliador}<br>
      ${navigator.onLine ? "☁️ Enviado ao sistema" : "📴 Salvo offline — será sincronizado"}
    `;

    try{
      if(navigator.onLine){
        await setDoc(doc(db,"avaliacoes",dados.id),{...dados,createdAt:serverTimestamp()});
      } else salvarOffline(dados);
    }catch{
      salvarOffline(dados);
    }

    // Gera PDF
    gerarPDF(dados);

    // Reset do formulário e preview
    form.reset();
    preview.innerHTML="";
    fotosBase64=[];

    // Redireciona para página inicial após 5 segundos
    setTimeout(()=>{ window.location.href = "./index.html"; },5000);
  });
});