const btnSidebar = document.getElementById("btn-sidebar");
const sidebar = document.getElementById("sidebar");
const closeSidebar = document.getElementById("close-sidebar");
const menuItems = document.querySelectorAll("#sidebar-menu li");
const sidebarContent = document.getElementById("sidebar-content");

// Ícones SVG para cada indicador
const icones = {
    'pareto': '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
    'densidade-critica': '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    'concentracao-relativa': '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
    'zonas-prioritarias': '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    'kde': '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    'gini': '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/><path d="M5 9c0 3.31 3.13 6 7 6s7-2.69 7-6"/></svg>',
    'lq': '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
    'moran': '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>'
};

// Função para carregar indicador no iframe
function carregarIndicador(indicador) {
    console.log(`Carregando indicador: ${indicador}`);
    
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
                <h3>${icones[indicador] || ''} ${formatarNomeIndicador(indicador)}</h3>
                <p>O arquivo <strong>indicadores/${indicador}/index.html</strong> não foi encontrado.</p>
                <p>Crie o arquivo HTML ou verifique o caminho.</p>
            </div>
        `;
    };
}

// Função para formatar o nome do indicador
function formatarNomeIndicador(indicador) {
    const nomes = {
        'pareto': 'Análise de Pareto',
        'densidade-critica': 'Densidade Crítica',
        'concentracao-relativa': 'Concentração Relativa',
        'zonas-prioritarias': 'Zonas Prioritárias',
        'kde': 'Kernel Density Estimation (KDE)',
        'gini': 'Coeficiente de Gini Espacial',
        'lq': 'Location Quotient (LQ)',
        'moran': 'Índice de Moran'
    };
    return nomes[indicador] || indicador;
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

// Exportar funções se necessário (para uso em outros scripts)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { carregarIndicador, formatarNomeIndicador };
}