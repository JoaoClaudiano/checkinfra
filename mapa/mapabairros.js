import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let camadaBairros = L.layerGroup();

async function carregarBairros(){
  const response = await fetch("bairros.geojson");
  const data = await response.json();
  return data;
}

async function carregarAvaliacoes(){
  const snap = await getDocs(collection(db,"avaliacoes"));
  const ultimos = {};
  snap.forEach(doc=>{
    const d = doc.data();
    if(d.lat && d.lng) ultimos[d.escola] = d;
  });
  return Object.values(ultimos);
}

function corBairro(avaliacoes,bairro){
  let status = "ok";
  avaliacoes.forEach(d=>{
    if(turf.booleanPointInPolygon([d.lng,d.lat], bairro.geometry.coordinates)){
      if(d.classe==="critico") status="critico";
      else if(d.classe==="alerta" && status!=="critico") status="alerta";
      else if(d.classe==="atenção" && status==="ok") status="atenção";
    }
  });
  return { "ok":"#4CAF50", "alerta":"#FFD700", "atenção":"#FF9800", "critico":"#F44336" }[status];
}

document.getElementById("toggleBairros").addEventListener("change", async e=>{
  if(e.target.checked){
    const bairros = await carregarBairros();
    const avaliacoes = await carregarAvaliacoes();

    camadaBairros = L.geoJSON(bairros,{
      style: function(feature){
        return {color: corBairro(avaliacoes,feature), fillOpacity:0.4};
      }
    }).addTo(map);

  } else {
    map.removeLayer(camadaBairros);
  }
});