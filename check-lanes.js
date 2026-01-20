const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get } = require('firebase/database');

const firebaseConfig = {
  apiKey: 'AIzaSyCvzs-HsRtaObQUHD0VCPigEbHj_nZX4g0',
  authDomain: 'dms1-d9c09.firebaseapp.com',
  databaseURL: 'https://dms1-d9c09-default-rtdb.firebaseio.com',
  projectId: 'dms1-d9c09',
  storageBucket: 'dms1-d9c09.firebasestorage.app',
  messagingSenderId: '200431721433',
  appId: '1:200431721433:web:7edafc573157af72e697c8',
  measurementId: 'G-2NRP205RBD'
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

async function checkLanes() {
  try {
    const lanesRef = ref(database, 'lanes');
    const snapshot = await get(lanesRef);
    if (snapshot.exists()) {
      const lanes = Object.values(snapshot.val());
      console.log('Existing lanes:', lanes.length);
      lanes.forEach(lane => console.log('-', lane.name, ':', lane.origin, '->', lane.destination));
    } else {
      console.log('No lanes found in database');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
  process.exit(0);
}

checkLanes();