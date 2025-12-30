// firebase-config.js - VERSÃO COMPAT (CORRIGIDA)

// 🔥 Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBvFUBXJwumctgf2DNH9ajSIk5-uydiZa0",
  authDomain: "checkinfra-adf3c.firebaseapp.com",
  projectId: "checkinfra-adf3c",
  storageBucket: "checkinfra-adf3c.appspot.com",
  messagingSenderId: "206434271838",
  appId: "1:206434271838:web:347d68e6956fe26ee1eacf"
};

// Variáveis globais
let firebaseApp = null;
let firestoreDb = null;
let firebaseManager = null;

try {
  // Verificar se firebase está disponível (versão compat)
  if (typeof firebase !== 'undefined') {
    // Inicializar apenas se não foi inicializado
    if (!firebase.apps.length) {
      firebaseApp = firebase.initializeApp(firebaseConfig);
    } else {
      firebaseApp = firebase.app();
    }
    
    firestoreDb = firebase.firestore();
    
    console.log('✅ Firebase COMPAT inicializado com sucesso!');
    
    // Testar conexão
    firestoreDb.collection('avaliacoes').limit(1).get()
      .then(() => console.log('✅ Conexão com Firestore estabelecida'))
      .catch(err => console.warn('⚠️ Firestore disponível, mas erro na consulta:', err.message));
    
  } else {
    console.warn('⚠️ Firebase não encontrado. Certifique-se de usar:');
    console.warn('   firebase-app-compat.js e firebase-firestore-compat.js');
  }
} catch (error) {
  console.error('❌ Erro ao inicializar Firebase:', error);
}

// Mapeamento de classes para pesos
const PESOS_CLASSE = {
  'adequada': 1,
  'alerta': 2,
  'atenção': 3,
  'crítico': 5,
  'não avaliada': 0.5
};

// Gerenciador simplificado do Firebase
const FirebaseManager = {
  async buscarTodasAvaliacoes() {
    try {
      if (!firestoreDb) {
        console.warn('⚠️ Firestore não disponível. Verifique a conexão.');
        return [];
      }
      
      console.log('📡 Buscando avaliações do Firebase...');
      const snapshot = await firestoreDb.collection('avaliacoes')
        .orderBy('createdAt', 'desc')
        .limit(500) // Limite razoável
        .get();
      
      const avaliacoes = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        
        // Extrair timestamp corretamente
        let createdAt = new Date();
        if (data.createdAt) {
          if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
            createdAt = data.createdAt.toDate();
          } else if (data.createdAt._seconds) {
            createdAt = new Date(data.createdAt._seconds * 1000);
          }
        }
        
        avaliacoes.push({
          id: doc.id,
          nome: data.nome || 'Escola não identificada',
          lat: parseFloat(data.lat) || -3.717,
          lng: parseFloat(data.lng) || -38.543,
          classe: data.classe || 'não avaliada',
          pontuacao: parseInt(data.pontuacao) || 0,
          createdAt: createdAt,
          metadata: data.metadata || {}
        });
      });
      
      console.log(`✅ ${avaliacoes.length} avaliações carregadas do Firebase`);
      return avaliacoes;
    } catch (error) {
      console.error('❌ Erro ao buscar avaliações:', error.message || error);
      return [];
    }
  },
  
  async adicionarAvaliacao(avaliacao) {
    try {
      if (!firestoreDb) {
        console.warn('⚠️ Firestore não disponível. Não foi possível salvar.');
        return null;
      }
      
      const docRef = await firestoreDb.collection('avaliacoes').add({
        ...avaliacao,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      
      console.log('✅ Avaliação salva com ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao salvar avaliação:', error);
      return null;
    }
  },
  
  async testarConexao() {
    try {
      if (!firestoreDb) {
        console.log('⚠️ Firestore não disponível para teste');
        return false;
      }
      
      // Teste simples
      await firestoreDb.collection('avaliacoes').limit(1).get();
      return true;
    } catch (error) {
      console.log('❌ Teste de conexão falhou:', error.message);
      return false;
    }
  },
  
  async buscarAvaliacoesRecentes(limite = 50) {
    try {
      if (!firestoreDb) return [];
      
      const snapshot = await firestoreDb.collection('avaliacoes')
        .orderBy('createdAt', 'desc')
        .limit(limite)
        .get();
      
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Erro ao buscar avaliações recentes:', error);
      return [];
    }
  }
};

// Exportar para uso global
window.firebaseManager = FirebaseManager;
window.firestoreDb = firestoreDb;
window.PESOS_CLASSE = PESOS_CLASSE;
window.firebaseApp = firebaseApp;

console.log('🔥 Firebase configurado (modo compat)');