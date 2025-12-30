const btnSidebar = document.getElementById("btn-sidebar");
const sidebar = document.getElementById("sidebar");
const closeSidebar = document.getElementById("close-sidebar");
const menuItems = document.querySelectorAll("#sidebar-menu li");
const sidebarContent = document.getElementById("sidebar-content");

btnSidebar.onclick = () => sidebar.classList.add("visible");
closeSidebar.onclick = () => sidebar.classList.remove("visible");

menuItems.forEach(item => {
  item.addEventListener("click", () => {
    menuItems.forEach(i => i.classList.remove("ativa"));
    item.classList.add("ativa");

    const indicador = item.getAttribute("data-indicador");
    // Carrega HTML do indicador via iframe
    sidebarContent.innerHTML = `<iframe src="indicadores/${indicador}/index.html"></iframe>`;
  });
});

// Carregar por padrão o primeiro indicador
const ativo = document.querySelector("#sidebar-menu li.ativa");
if (ativo) {
  const indicador = ativo.getAttribute("data-indicador");
  sidebarContent.innerHTML = `<iframe src="indicadores/${indicador}/index.html"></iframe>`;
}