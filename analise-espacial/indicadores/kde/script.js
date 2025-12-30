console.log("📊 Página de KDE carregada");

// Animação simples para elementos
document.addEventListener('DOMContentLoaded', function() {
const elementos = document.querySelectorAll('.conceito, .aplicacao, .interpretacao, .referencia');

elementos.forEach((el, index) => {
el.style.opacity = '0';
el.style.transform = 'translateY(20px)';

setTimeout(() => {
el.style.transition = 'all 0.6s ease';
el.style.opacity = '1';
el.style.transform = 'translateY(0)';
}, 100 * index);
});

// Efeito de hover nas legendas
document.querySelectorAll('.item-legenda').forEach(item => {
item.addEventListener('mouseenter', function() {
this.style.transform = 'translateX(5px)';
this.style.transition = 'transform 0.3s ease';
});

item.addEventListener('mouseleave', function() {
this.style.transform = 'translateX(0)';
});
});
});
