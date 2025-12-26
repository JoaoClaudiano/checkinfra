import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.map = L.map("map").setView([-3.7319,-38.5267],12);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{ attribution:"© OpenStreetMap"}).addTo(map);

let avaliacoes = [];
let camadaPontos = L.layerGroup().addTo(map);

const cores = { ok:"#4CAF50", alerta:"#FFD700", atenção:"#FF9800", critico:"#F44336" };
const pulsosFreq = { critico:1200, atenção:2400, alerta:2400, ok:4800 };

// Criar pulso suave e desaparecer
function criarPulso(lat, lng, cor, freq){
    const divIcon = L.divIcon({
        className: "pulse-div",
        iconSize: [16,16],
        html: `<div style="width:16px;height:16px;border-radius:50%;background:${cor};opacity:0.4"></div>`
    });
    const marker = L.marker([lat,lng], {icon: divIcon}).addTo(camadaPontos);
    setInterval(() => {
        const el = marker.getElement().firstChild;
        if(!el) return;
        el.style.transition = `opacity ${freq/1000}s ease-out, transform ${freq/1000}s ease-out`;
        el.style.transform = "scale(2)";
        el.style.opacity = "0";
        setTimeout(() => {
            el.style.transform = "scale(1)";
            el.style.opacity = "0.4";
        }, freq);
    }, freq);
    return marker;
}

function carregarAvaliacoes(){
    return getDocs(collection(db,"avaliacoes")).then(snap=>{
        const ultimos = {};
        snap.forEach(doc=>{
            const d = doc.data();
            if(d.lat && d.lng && d.classe) ultimos[d.escola] = d;
        });
        avaliacoes = Object.values(ultimos);
    });
}

function atualizarPontos(){
    camadaPontos.clearLayers();
    avaliacoes.forEach(d=>{
        const s = d.classe;
        if((s==="ok" && !fAdequado.checked) ||
           (s==="alerta" && !fAlerta.checked) ||
           (s==="atenção" && !fAtencao.checked) ||
           (s==="critico" && !fCritico.checked)) return;
        criarPulso(d.lat,d.lng,cores[s], pulsosFreq[s]||2400);
    });
}

document.querySelectorAll("#fAdequado, #fAlerta, #fAtencao, #fCritico, #togglePulso").forEach(el=>{
    el.addEventListener("change", atualizarPontos);
});

// Inicialização
await carregarAvaliacoes();
atualizarPontos();