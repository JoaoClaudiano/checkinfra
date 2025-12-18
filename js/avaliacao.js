/* ================= ID ================= */
function gerarIdCheckInfra() {
  const d = new Date();
  return `CI-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}-${Math.random().toString(36).substring(2,7).toUpperCase()}`;
}

/* ================= PDF ================= */
function gerarPDF(d) {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  pdf.setFontSize(14);
  pdf.text("CheckInfra – Avaliação Sanitária", 20, 20);

  pdf.setFontSize(11);
  pdf.text(`Código: ${d.id}`, 20, 35);
  pdf.text(`Escola: ${d.escola}`, 20, 45);
  pdf.text(`Avaliador: ${d.avaliador}`, 20, 55);
  pdf.text(`Pontuação: ${d.score}`, 20, 65);
  pdf.text(`Status: ${d.status}`, 20, 75);

  pdf.save(`${d.id}.pdf`);
}

/* ================= OFFLINE UI ================= */
function atualizarOffline() {
  const card = document.getElementById("offlineCard");
  if (!card) return;
  card.style.display = navigator.onLine ? "none" : "block";
}

window.addEventListener("online", atualizarOffline);
window.addEventListener("offline", atualizarOffline);

/* ================= FORM ================= */
document.addEventListener("DOMContentLoaded", () => {
  atualizarOffline();

  /* escolas */
  const select = document.getElementById("escola");
  if (window.escolas) {
    escolas.forEach(e => {
      const o = document.createElement("option");
      o.value = e.nome;
      o.textContent = e.nome;
      select.appendChild(o);
    });
  }

  /* submit */
  document.getElementById("form-avaliacao").addEventListener("submit", e => {
    e.preventDefault();

    const id = gerarIdCheckInfra();
    let score = 0;
    let problemas = [];

    document.querySelectorAll("input[type=checkbox]:checked").forEach(c => {
      score += Number(c.dataset.peso);
      problemas.push(c.parentElement.innerText.trim());
    });

    let status = "Condição adequada";
    let classe = "ok";
    if (score >= 8) { status = "Condição crítica"; classe = "critico"; }
    else if (score >= 4) { status = "Situação de alerta"; classe = "alerta"; }

    gerarPDF({
      id,
      escola: escola.value,
      avaliador: avaliador.value,
      score,
      status,
      problemas
    });

    const r = document.getElementById("resultado");
    r.className = "resultado " + classe;
    r.style.display = "block";
    r.innerHTML = `
      <strong>Código:</strong> ${id}<br>
      <strong>Status:</strong> ${status}<br>
      <strong>Pontuação:</strong> ${score}
    `;
  });
});
