import { FirebaseService } from './src/services/firebaseService.js';

async function testCreateVendor() {
  try {
    console.log('Testing vendor creation...');
    const vendorData = {
      name: 'Test Vendor Company',
      role: 'VENDOR',
      lanes: ['DELHI-MUMBAI', 'MUMBAI-PUNE']
    };

    const result = await FirebaseService.createVendor(vendorData);
    console.log('Create vendor result:', result);

    if (result.success) {
      console.log('Vendor created successfully with ID:', result.vendorId);

      // Try to read it back
      const vendors = await FirebaseService.getVendors();
      console.log('Vendors after creation:', vendors);
    }
  } catch (error) {
    console.error('Error in test:', error);
  }
}

testCreateVendor();