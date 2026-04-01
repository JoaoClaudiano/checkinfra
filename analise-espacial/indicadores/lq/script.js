console.log("📈 Página do Location Quotient carregada");

document.addEventListener('DOMContentLoaded', function() {
// Animação da fórmula
const formulaEquacao = document.querySelector('.formula-equacao');

setTimeout(() => {
formulaEquacao.style.transition = 'all 1s ease';
formulaEquacao.style.transform = 'scale(1.05)';
formulaEquacao.style.color = '#bbdefb';

setTimeout(() => {
formulaEquacao.style.transform = 'scale(1)';
formulaEquacao.style.color = 'white';
}, 1000);
}, 800);

// Interatividade na tabela
document.querySelectorAll('.linha').forEach((linha, index) => {
linha.addEventListener('click', function() {
// Resetar todas as linhas
document.querySelectorAll('.linha').forEach(l => {
l.style.boxShadow = 'none';
l.style.borderLeft = 'none';
});

// Destacar linha clicada
this.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
this.style.borderLeft = '6px solid #3f51b5';

// Mostrar exemplo específico
const valor = this.querySelector('.valor-lq').textContent;
const descricao = this.querySelector('.descricao').textContent;

console.log(`LQ selecionado: ${valor} - ${descricao}`);

// Atualizar exemplo prático
atualizarExemplo(valor);
});
});

// Calculadora interativa
function atualizarExemplo(lqRange) {
const exemplo = document.querySelector('.exemplo');

// Criar calculadora interativa
const calculadora = document.createElement('div');
calculadora.className = 'calculadora-interativa';
calculadora.innerHTML = `
<h3>Calcule seu LQ</h3>
<div class="inputs">
<div>
<label>Escolas no local: <input type="number" id="local-total" value="10"></label>
<label>Críticas no local: <input type="number" id="local-criticas" value="5"></label>
</div>
<div>
<label>Escolas na cidade: <input type="number" id="cidade-total" value="100"></label>
<label>Críticas na cidade: <input type="number" id="cidade-criticas" value="20"></label>
</div>
</div>
<button id="calcular-lq">Calcular LQ</button>
<div id="resultado-lq" style="margin-top:15px;"></div>
`;

// Remover calculadora anterior se existir
const calcAnterior = exemplo.querySelector('.calculadora-interativa');
if (calcAnterior) calcAnterior.remove();

exemplo.appendChild(calculadora);

// Adicionar evento ao botão
document.getElementById('calcular-lq').addEventListener('click', calcularLQ);

// Auto-calcular ao mudar inputs
document.querySelectorAll('.inputs input').forEach(input => {
input.addEventListener('input', calcularLQ);
});
}

function calcularLQ() {
const localTotal = parseInt(document.getElementById('local-total').value) || 1;
const localCriticas = parseInt(document.getElementById('local-criticas').value) || 0;
const cidadeTotal = parseInt(document.getElementById('cidade-total').value) || 1;
const cidadeCriticas = parseInt(document.getElementById('cidade-criticas').value) || 0;

const proporcaoLocal = localCriticas / localTotal;
const proporcaoCidade = cidadeCriticas / cidadeTotal;

let lq = 0;
if (proporcaoCidade > 0) {
lq = proporcaoLocal / proporcaoCidade;
}

const resultado = document.getElementById('resultado-lq');
let classificacao = '';
let cor = '';

if (lq >= 2.0) {
classificacao = 'Concentração muito alta';
cor = '#e74c3c';
} else if (lq >= 1.5) {
classificacao = 'Concentração alta';
cor = '#e67e22';
} else if (lq >= 1.0) {
classificacao = 'Próximo da média';
cor = '#f1c40f';
} else if (lq >= 0.5) {
classificacao = 'Abaixo da média';
cor = '#3498db';
} else {
classificacao = 'Muito abaixo da média';
cor = '#2ecc71';
}

resultado.innerHTML = `
<div style="background:${cor}20; padding:15px; border-radius:8px; border-left:4px solid ${cor}">
<strong>LQ Calculado: ${lq.toFixed(2)}</strong><br>
Classificação: ${classificacao}<br>
<small>Proporção local: ${(proporcaoLocal*100).toFixed(1)}% |
Proporção cidade: ${(proporcaoCidade*100).toFixed(1)}%</small>
</div>
`;
}

// Inicializar com exemplo padrão
setTimeout(() => {
atualizarExemplo('1.5 ≤ LQ < 2.0');
}, 1000);
});

