document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("form-avaliacao");
  const resultado = document.getElementById("resultado");

  if (!form || !resultado) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!navigator.onLine) {
      resultado.className = "resultado alerta";
      resultado.style.display = "block";
      resultado.innerHTML = "📴 Offline: avaliação salva no dispositivo.";
    } else {
      resultado.className = "resultado ok";
      resultado.style.display = "block";
      resultado.innerHTML = "✅ Online: avaliação enviada.";
    }

    // deixa o script principal continuar
    setTimeout(() => {
      gerarDiagnostico();
    }, 300);
  });

});
