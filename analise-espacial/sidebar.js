/* =====================
   SIDEBAR – Indicadores
===================== */
const btnSidebar = document.getElementById("btn-sidebar");
const sidebar = document.getElementById("sidebar");
const btnCloseSidebar = document.getElementById("close-sidebar");
const menuItems = document.querySelectorAll("#sidebar-menu li");
const sidebarContent = document.getElementById("sidebar-content");

// Toggle sidebar
btnSidebar.addEventListener("click", () => {
  sidebar.classList.add("visible");
});

btnCloseSidebar.addEventListener("click", () => {
  sidebar.classList.remove("visible");
});

// Função para carregar indicador no iframe
function carregarIndicador(indicador) {
  // Atualiza classe ativa
  menuItems.forEach(li => li.classList.remove("ativa"));
  const item = document.querySelector(`#sidebar-menu li[data-indicador="${indicador}"]`);
  item.classList.add("ativa");

  // Define caminho do HTML do indicador
  const caminho = `indicadores/${indicador}/index.html`;

  // Cria ou atualiza iframe
  sidebarContent.innerHTML = `<iframe src="${caminho}" frameborder="0"></iframe>`;
}

// Inicializa com Pareto
carregarIndicador("pareto");

// Menu click
menuItems.forEach(li => {
  li.addEventListener("click", () => {
    const indicador = li.getAttribute("data-indicador");
    carregarIndicador(indicador);
  });
});

// Fecha sidebar ao clicar fora (opcional)
document.addEventListener("click", (e) => {
  if (!sidebar.contains(e.target) && !btnSidebar.contains(e.target)) {
    sidebar.classList.remove("visible");
  }
});