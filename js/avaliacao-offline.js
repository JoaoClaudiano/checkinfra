document.addEventListener("DOMContentLoaded", () => {

  alert("OFFLINE JS CARREGADO");

  const form = document.getElementById("form-avaliacao");
  if (!form) {
    alert("FORM NÃO ENCONTRADO");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const r = document.getElementById("resultado");

    if (!navigator.onLine) {
      r.className = "resultado alerta";
      r.style.display = "block";
      r.innerHTML = "📴 Offline: avaliação salva no dispositivo.";
    } else {
      r.className = "resultado ok";
      r.style.display = "block";
      r.innerHTML = "✅ Avaliação online.";
    }

    // chama o fluxo normal
    gerarDiagnostico();
  });

});
