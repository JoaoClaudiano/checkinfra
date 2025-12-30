// pareto.js
document.querySelectorAll(".accordion-header").forEach(header => {
  header.addEventListener("click", () => {
    const content = header.nextElementSibling;
    const isOpen = header.classList.contains("active");

    // Fecha os outros accordions
    document.querySelectorAll(".accordion-header").forEach(h => {
      h.classList.remove("active");
      h.nextElementSibling.style.maxHeight = null;
    });

    // Abre o atual se não estava aberto
    if (!isOpen) {
      header.classList.add("active");
      content.style.maxHeight = content.scrollHeight + "px";
    }
  });
});