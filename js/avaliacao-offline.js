document.getElementById("form-avaliacao").addEventListener("submit", async (e) => {
  e.preventDefault(); // impede reload

  // coleta dados básicos
  const escola = document.getElementById("escola").value;
  const avaliador = document.getElementById("avaliador").value;

  if (!escola || !avaliador) {
    alert("Preencha todos os campos");
    return;
  }

  // coleta checklist
  let score = 0;
  let problemas = [];

  document.querySelectorAll("input[type=checkbox]").forEach(cb => {
    if (cb.checked) {
      score += Number(cb.dataset.peso);
      problemas.push(cb.parentElement.textContent.trim());
    }
  });

  let status = "Condição adequada";
  if (score >= 9) status = "Condição crítica";
  else if (score >= 4) status = "Situação de alerta";

  const dados = {
    escola,
    avaliador,
    score,
    status,
    problemas,
    timestamp: new Date().toISOString()
  };

  // salva SEMPRE offline
  await salvarAvaliacaoOffline(dados);

  // chama seu diagnóstico visual + PDF
  gerarDiagnostico();

  // só tenta enviar se estiver online
  if (navigator.onLine) {
    console.log("Online: pode sincronizar depois");
    // aqui entraremos com sync real no próximo passo
  } else {
    console.log("Offline: avaliação salva localmente");
  }
});