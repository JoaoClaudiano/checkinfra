const fab = document.getElementById("feedback-fab");
const modal = document.getElementById("feedback-modal");
const closeBtn = document.getElementById("feedback-close");
const form = document.getElementById("feedback-form");
const status = document.getElementById("feedback-status");
const submitBtn = document.getElementById("feedback-submit");

/* abrir / fechar */
fab.onclick = () => modal.classList.remove("hidden");
closeBtn.onclick = () => modal.classList.add("hidden");

/* capturar URL automaticamente */
document.getElementById("page-url").value = window.location.href;

/* capturar rating */
document.querySelectorAll(".rating input").forEach(input => {
  input.addEventListener("change", () => {
    submitBtn.dataset.rating = input.value;
  });
});

/* SUBMIT ASSÍNCRONO - Web3Form */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // limpar status
  status.textContent = "";
  status.className = "";
  submitBtn.classList.add("loading");
  submitBtn.textContent = "Enviando…";
  submitBtn.disabled = true;

  const formData = new FormData(form);
  formData.append("access_key", "dda02135-5247-43ee-b75c-5b259ae11f5b");

  try {
    const response = await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    if (response.ok) {
      status.textContent = "✅ Obrigado! Seu feedback foi enviado! ☁️";
      status.classList.add("success");
      form.reset();

      setTimeout(() => {
        modal.classList.add("hidden");
        status.textContent = "";
        submitBtn.disabled = false;
        submitBtn.textContent = "Enviar feedback";
        submitBtn.classList.remove("loading");
      }, 1800);

    } else {
      status.textContent = "⚠️ Erro: " + (data.message || "Tente novamente.");
      status.classList.add("error");
    }

  } catch (error) {
    status.textContent = "⚠️ Falha de conexão. Tente novamente.";
    status.classList.add("error");
  }

  submitBtn.disabled = false;
  submitBtn.textContent = "Enviar feedback";
  submitBtn.classList.remove("loading");
});