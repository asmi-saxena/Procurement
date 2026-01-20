import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, remove } from 'firebase/database';

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

async function checkVendors() {
  try {
    console.log('Checking vendors for missing or invalid data...');

    const vendorsRef = ref(database, 'vendors');
    const snapshot = await get(vendorsRef);

    if (snapshot.exists()) {
      const vendors = snapshot.val();
      let validVendors = 0;
      let invalidVendors = 0;
      let cleanedVendors = 0;

      for (const [vendorId, vendor] of Object.entries(vendors)) {
        console.log(`\nVendor ${vendorId}:`, vendor);

        // Check if vendor has required fields
        const hasName = vendor.name && typeof vendor.name === 'string' && vendor.name.trim() !== '';
        const hasRole = vendor.role && typeof vendor.role === 'string';

        if (hasName && hasRole) {
          validVendors++;
          console.log(`  ✓ Valid vendor: ${vendor.name} (${vendor.role})`);
          console.log(`    Lanes: ${vendor.lanes ? vendor.lanes.length : 0}`);
        } else {
          invalidVendors++;
          console.log(`  ✗ Invalid vendor - Missing: ${!hasName ? 'name ' : ''}${!hasRole ? 'role' : ''}`);

          // Remove invalid vendors
          console.log(`  Removing invalid vendor ${vendorId}`);
          await remove(ref(database, `vendors/${vendorId}`));
          cleanedVendors++;
        }
      }

      console.log(`\nSummary:`);
      console.log(`  Valid vendors: ${validVendors}`);
      console.log(`  Invalid vendors removed: ${cleanedVendors}`);
      console.log(`  Total vendors processed: ${Object.keys(vendors).length}`);
    } else {
      console.log('No vendors found in database');
    }
  } catch (error) {
    console.error('Error checking vendors:', error.message);
  }
  process.exit(0);
}

checkVendors();