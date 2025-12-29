(function () {
  emailjs.init("vCgPESmVfPbJdk-U7"); // SUA PUBLIC KEY
})();

function enviarFeedback() {
  const texto = document.getElementById("feedback-textarea")?.value;
  const rating = document.querySelector('input[name="rating"]:checked')?.value || "Não informado";

  if (!texto || !texto.trim()) {
    alert("Por favor, escreva seu feedback antes de enviar.");
    return;
  }

  const params = {
    message: texto,
    rating: rating,
    name: "Usuário anônimo",
  };

  emailjs
    .send(
      "service_a519te7",     // SERVICE ID
      "template_oc2zio4",    // TEMPLATE ID
      params
    )
    .then(
      () => {
        alert("Feedback enviado com sucesso. Obrigado!");
        document.getElementById("feedback-textarea").value = "";
      },
      (error) => {
        console.error("EmailJS error:", error);
        alert("Erro ao enviar feedback. Tente novamente.");
      }
    );
}