import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get } from 'firebase/database';

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

async function checkFirebase() {
  try {
    console.log('Checking Firebase connection...');

    // Check root
    const rootRef = ref(database, '/');
    const rootSnapshot = await get(rootRef);
    console.log('Root data exists:', rootSnapshot.exists());
    if (rootSnapshot.exists()) {
      console.log('Root keys:', Object.keys(rootSnapshot.val()));
    }

    // Check bids
    const bidsRef = ref(database, 'bids');
    const bidsSnapshot = await get(bidsRef);
    console.log('Bids exist:', bidsSnapshot.exists());
    if (bidsSnapshot.exists()) {
      console.log('Number of bids:', Object.keys(bidsSnapshot.val()).length);
    }

    // Check users (might contain vendors)
    const usersRef = ref(database, 'users');
    const usersSnapshot = await get(usersRef);
    console.log('Users exist:', usersSnapshot.exists());
    if (usersSnapshot.exists()) {
      const users = usersSnapshot.val();
      console.log('Users found:', Object.keys(users));
      const vendorUsers = Object.values(users).filter((user: any) => user.role === 'VENDOR' || user.role === 'vendor');
      console.log('Vendor users:', vendorUsers.length);
      if (vendorUsers.length > 0) {
        console.log('Vendor user data:', vendorUsers);
      }
    }

  } catch (error) {
    console.error('Error checking Firebase:', error);
  }
}

checkFirebase();