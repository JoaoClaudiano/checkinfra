const fab = document.getElementById("feedback-fab");
const modal = document.getElementById("feedback-modal");
const closeBtn = document.getElementById("feedback-close");
const form = document.getElementById("feedback-form");
const status = document.getElementById("feedback-status");

/* ABRIR / FECHAR */
fab.addEventListener("click", () => {
  modal.classList.remove("hidden");
});

closeBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});

/* RATING VISUAL (radio + emoji) */
document.querySelectorAll(".rating label").forEach(label => {
  label.addEventListener("click", () => {
    document
      .querySelectorAll(".rating label")
      .forEach(l => l.classList.remove("active"));

    label.classList.add("active");
  });
});

/* SUBMIT ASSÍNCRONO */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  status.textContent = "Enviando feedback…";

  const data = new FormData(form);

  try {
    const res = await fetch("https://formspree.io/f/xdaobedn", {
      method: "POST",
      body: data,
      headers: {
        "Accept": "application/json"
      }
    });

    if (res.ok) {
      status.textContent = "✅ Obrigado! Seu feedback foi enviado.";
      form.reset();

      document
        .querySelectorAll(".rating label")
        .forEach(l => l.classList.remove("active"));

      setTimeout(() => {
        modal.classList.add("hidden");
        status.textContent = "";
      }, 1500);
    } else {
      status.textContent = "⚠️ Erro ao enviar. Tente novamente.";
    }

  } catch (err) {
    status.textContent = "⚠️ Falha de conexão.";
  }
});