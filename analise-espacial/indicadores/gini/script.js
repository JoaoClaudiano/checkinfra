console.log("⚖️ Página do Índice de Gini carregada");

document.addEventListener('DOMContentLoaded', function() {
// Animação do gráfico
const curvaReal = document.querySelector('.curva-real');
const areaGini = document.querySelector('.area-gini');

setTimeout(() => {
curvaReal.style.transition = 'all 1.5s ease';
curvaReal.style.height = '70%';

setTimeout(() => {
areaGini.style.transition = 'opacity 1s ease';
areaGini.style.opacity = '0.3';
}, 800);
}, 500);

// Efeitos interativos nos níveis
document.querySelectorAll('.nivel').forEach(nivel => {
nivel.addEventListener('click', function() {
document.querySelectorAll('.nivel').forEach(n => {
n.style.boxShadow = 'none';
n.style.transform = 'translateY(0)';
});

this.style.boxShadow = '0 15px 30px rgba(0,0,0,0.25)';
this.style.transform = 'translateY(-8px) scale(1.05)';

// Mostrar detalhes do nível
const valor = this.querySelector('.valor').textContent;
const descricao = this.querySelector('.descricao').textContent;

console.log(`Nível selecionado: ${valor} - ${descricao}`);
});
});

// Mostrar fórmula do Gini quando clicar
const formula = document.querySelector('.formula');
formula.addEventListener('click', function() {
this.innerHTML = 'G = A / (A + B)<br><small>Onde A é a área entre a curva de Lorenz e a linha de igualdade</small>';

setTimeout(() => {
this.innerHTML = 'Gini = Área A / (Área A + B)';
}, 3000);
});
});
