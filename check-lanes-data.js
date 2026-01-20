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

async function checkLanes() {
  try {
    console.log('Checking lanes for missing or invalid data...');

    const lanesRef = ref(database, 'lanes');
    const snapshot = await get(lanesRef);

    if (snapshot.exists()) {
      const lanes = snapshot.val();
      let validLanes = 0;
      let invalidLanes = 0;
      let cleanedLanes = 0;

      for (const [laneId, lane] of Object.entries(lanes)) {
        console.log(`\nLane ${laneId}:`, lane);

        // Check if lane has required fields
        const hasOrigin = lane.origin && typeof lane.origin === 'string' && lane.origin.trim() !== '';
        const hasDestination = lane.destination && typeof lane.destination === 'string' && lane.destination.trim() !== '';
        const hasName = lane.name && typeof lane.name === 'string' && lane.name.trim() !== '';

        if (hasOrigin && hasDestination && hasName) {
          validLanes++;
          console.log(`  ✓ Valid lane: ${lane.name} (${lane.origin} -> ${lane.destination})`);
        } else {
          invalidLanes++;
          console.log(`  ✗ Invalid lane - Missing: ${!hasOrigin ? 'origin ' : ''}${!hasDestination ? 'destination ' : ''}${!hasName ? 'name' : ''}`);

          // Remove invalid lanes
          console.log(`  Removing invalid lane ${laneId}`);
          await remove(ref(database, `lanes/${laneId}`));
          cleanedLanes++;
        }
      }

      console.log(`\nSummary:`);
      console.log(`  Valid lanes: ${validLanes}`);
      console.log(`  Invalid lanes removed: ${cleanedLanes}`);
      console.log(`  Total lanes processed: ${Object.keys(lanes).length}`);
    } else {
      console.log('No lanes found in database');
    }
  } catch (error) {
    console.error('Error checking lanes:', error.message);
  }
  process.exit(0);
}

checkLanes();