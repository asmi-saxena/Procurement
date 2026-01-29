// setupAdmin.ts
// Auto-setup admin credentials for development

export const setupAdminCredentials = () => {
  const credentials = {
    email: 'admin1@gmail.com',
    password: '12345678'
  };
  
  localStorage.setItem('admin_credentials', JSON.stringify(credentials));
  
  console.log('✅ Admin credentials initialized!');
  console.log('📧 Email:', credentials.email);
  console.log('🔑 Password:', credentials.password);
  console.log('');
  console.log('You can now login with these credentials.');
};

// Auto-run in development mode if credentials don't exist
if (import.meta.env.DEV) {
  const existing = localStorage.getItem('admin_credentials');
  
  if (!existing) {
    console.log('🔧 Setting up admin credentials for first time...');
    setupAdminCredentials();
  } else {
    console.log('✅ Admin credentials already exist');
    const creds = JSON.parse(existing);
    console.log('📧 Email:', creds.email);
  }
}