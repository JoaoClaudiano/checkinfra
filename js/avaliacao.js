// ===================== FIREBASE =====================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔥 CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===================== OFFLINE =====================
const STORAGE_KEY = "checkinfra_avaliacoes_pendentes";

function salvarOffline(dados) {
  const lista = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  lista.push(dados);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

async function sincronizarOffline() {
  if (!navigator.onLine) return;

  const pendentes = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  if (pendentes.length === 0) return;

  for (const d of pendentes) {
    await addDoc(collection(db, "avaliacoes"), {
      ...d,
      createdAt: serverTimestamp()
    });
  }

  localStorage.removeItem(STORAGE_KEY);
}

function atualizarAvisoOffline() {
  const card = document.getElementById("offlineCard");
  if (!card) return;
  card.style.display = navigator.onLine ? "none" : "block";
}

window.addEventListener("online", () => {
  atualizarAvisoOffline();
  sincronizarOffline();
});
window.addEventListener("offline", atualizarAvisoOffline);

// ===================== FORM =====================
document.addEventListener("DOMContentLoaded", () => {
  atualizarAvisoOffline();
  sincronizarOffline();

  const form = document.getElementById("form-avaliacao");
  const resultado = document.getElementById("resultado");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const escola = document.getElementById("escola").value;
    const avaliador = document.getElementById("avaliador").value;

    if (!escola || !avaliador) {
      alert("Preencha escola e avaliador");
      return;
    }

    // 👉 FUNÇÃO DO CORE
    const id = gerarIdCheckInfra();

    let pontuacao = 0;
    let problemas = [];

    document.querySelectorAll(".check-card input:checked").forEach(c => {
      pontuacao += Number(c.dataset.peso || 0);
      problemas.push(c.parentElement.innerText.trim());
    });

    let status = "Condição adequada";
    let classe = "ok";

    if (pontuacao >= 8) {
      status = "Condição crítica";
      classe = "critico";
    } else if (pontuacao >= 4) {
      status = "Situação de alerta";
      classe = "alerta";
    }

    const dados = {
      id,
      escola,
      avaliador,
      pontuacao,
      status,
      problemas
    };

    // ===== SALVAR =====
    if (navigator.onLine) {
      try {
        await addDoc(collection(db, "avaliacoes"), {
          ...dados,
          createdAt: serverTimestamp()
        });
      } catch {
        salvarOffline(dados);
      }
    } else {
      salvarOffline(dados);
    }

    // 👉 FUNÇÃO DO CORE
    gerarPDF(dados);

    resultado.className = "resultado " + classe;
    resultado.style.display = "block";
    resultado.innerHTML = `
      <strong>Código:</strong> ${id}<br>
      <strong>Status:</strong> ${status}<br>
      <strong>Pontuação:</strong> ${pontuacao}<br>
      ${navigator.onLine ? "☁️ Enviado" : "📴 Salvo offline"}
    `;

    form.reset();
  });
});
