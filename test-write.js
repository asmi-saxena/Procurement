import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, push } from 'firebase/database';

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

async function testVendorWrite() {
  try {
    console.log('Testing vendor write to Firebase...');

    // Try to write to vendors path
    const vendorRef = ref(database, 'vendors/test-vendor');
    const testVendor = {
      id: 'test-vendor',
      name: 'Test Vendor',
      role: 'VENDOR',
      lanes: ['DELHI-MUMBAI']
    };

    await set(vendorRef, testVendor);
    console.log('✅ Successfully wrote vendor to Firebase');

    // Try to read it back
    const { get } = await import('firebase/database');
    const snapshot = await get(vendorRef);
    if (snapshot.exists()) {
      console.log('✅ Successfully read vendor back:', snapshot.val());
    } else {
      console.log('❌ Could not read vendor back');
    }

  } catch (error) {
    console.error('❌ Error writing vendor:', error);
    console.error('Error details:', error.message);
  }
}

testVendorWrite();