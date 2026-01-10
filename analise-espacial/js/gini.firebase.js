/* =========================
   GINI — Firebase
========================= */

import { collection, getDocs } from 
"https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { db } from "../firebase.js";

export async function calcularGiniFirebase() {
    const snapshot = await getDocs(collection(db, "avaliacoes"));
    const valores = [];

    snapshot.forEach(doc => {
        const d = doc.data();
        if (typeof d.pontuacao === "number") {
            valores.push(d.pontuacao);
        }
    });

    valores.sort((a, b) => a - b);
    const n = valores.length;
    const soma = valores.reduce((a, b) => a + b, 0);

    if (soma === 0) return 0;

    let acumulado = 0;
    for (let i = 0; i < n; i++) {
        acumulado += (i + 1) * valores[i];
    }

    return (2 * acumulado) / (n * soma) - (n + 1) / n;
}
