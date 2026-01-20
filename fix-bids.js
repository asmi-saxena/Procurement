import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, update } from 'firebase/database';

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

async function fixBidsOffers() {
  try {
    console.log('Checking and fixing bids offers array...');

    const bidsRef = ref(database, 'bids');
    const snapshot = await get(bidsRef);

    if (snapshot.exists()) {
      const bids = snapshot.val();
      let fixedCount = 0;

      for (const [bidId, bid] of Object.entries(bids)) {
        if (!bid.offers || !Array.isArray(bid.offers)) {
          console.log(`Fixing bid ${bidId}: offers property missing or not an array`);
          await update(ref(database, `bids/${bidId}`), {
            offers: bid.offers || []
          });
          fixedCount++;
        }
      }

      console.log(`Fixed ${fixedCount} bids`);
      console.log('Total bids in database:', Object.keys(bids).length);
    } else {
      console.log('No bids found in database');
    }
  } catch (error) {
    console.error('Error fixing bids:', error.message);
  }
  process.exit(0);
}

fixBidsOffers();