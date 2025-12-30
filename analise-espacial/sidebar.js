const btnSidebar = document.getElementById("btn-sidebar");
const sidebar = document.getElementById("sidebar");
const closeSidebar = document.getElementById("close-sidebar");
const menuItems = document.querySelectorAll("#sidebar-menu li");
const sidebarContent = document.getElementById("sidebar-content");

// Função para carregar indicador no iframe
function carregarIndicador(indicador) {
  console.log(`Carregando indicador: ${indicador}`);
  
  // Verifica se existe o diretório do indicador
  const iframe = document.createElement('iframe');
  iframe.src = `indicadores/${indicador}/index.html`;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  
  // Limpa o conteúdo anterior e adiciona o iframe
  sidebarContent.innerHTML = '';
  sidebarContent.appendChild(iframe);
  
  // Adiciona tratamento de erro
  iframe.onload = function() {
    console.log(`Indicador ${indicador} carregado com sucesso`);
  };
  
  iframe.onerror = function() {
    sidebarContent.innerHTML = `
      <div style="padding: 20px; color: #666; text-align: center;">
        <h3>Página do indicador não encontrada</h3>
        <p>O arquivo <strong>indicadores/${indicador}/index.html</strong> não existe ainda.</p>
        <p>Por favor, crie a estrutura para este indicador.</p>
      </div>
    `;
  };
}

// Eventos do sidebar
btnSidebar.onclick = () => sidebar.classList.add("visible");
closeSidebar.onclick = () => sidebar.classList.remove("visible");

// Eventos dos itens do menu
menuItems.forEach(item => {
  item.addEventListener("click", () => {
    menuItems.forEach(i => i.classList.remove("ativa"));
    item.classList.add("ativa");

    const indicador = item.getAttribute("data-indicador");
    carregarIndicador(indicador);
  });
});

// Carregar por padrão o primeiro indicador ativo
const ativo = document.querySelector("#sidebar-menu li.ativa");
if (ativo) {
  const indicador = ativo.getAttribute("data-indicador");
  carregarIndicador(indicador);
} else if (menuItems.length > 0) {
  // Se não houver nenhum ativo, ativa o primeiro
  menuItems[0].classList.add("ativa");
  const indicador = menuItems[0].getAttribute("data-indicador");
  carregarIndicador(indicador);
}