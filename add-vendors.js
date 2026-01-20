const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');

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

// Add some test vendors
const testVendors = [
  {
    id: 'v-1',
    name: 'Blue Dart Logistics',
    role: 'VENDOR',
    lanes: ['DELHI-MUMBAI', 'DELHI-JAIPUR']
  },
  {
    id: 'v-2',
    name: 'Gati KWE',
    role: 'VENDOR',
    lanes: ['DELHI-MUMBAI', 'BLR-CHN']
  },
  {
    id: 'v-3',
    name: 'Safexpress',
    role: 'VENDOR',
    lanes: ['MUMBAI-PUNE', 'DELHI-MUMBAI']
  }
];

async function addTestVendors() {
  try {
    for (const vendor of testVendors) {
      const vendorRef = ref(database, `vendors/${vendor.id}`);
      await set(vendorRef, vendor);
      console.log(`Added vendor: ${vendor.name}`);
    }
    console.log('All test vendors added successfully');
  } catch (error) {
    console.error('Error adding vendors:', error);
  }
}

addTestVendors();