const { firestore } = require('../config/firebase');

async function addAdminToFirestore() {
  try {
    console.log('🔐 Adding admin user to Firestore...');
    
    const adminData = {
      uid: 'admin-manual-' + Date.now(),
      email: 'admin@gmail.com',
      name: 'System Administrator',
      role: 'admin',
      approved: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Add to Firestore
    await firestore.collection('users').doc(adminData.uid).set(adminData);
    
    console.log('✅ Admin user added to Firestore successfully!');
    console.log('📧 Email: admin@gmail.com');
    console.log('🔑 Password: Admin@123');
    console.log('🆔 UID:', adminData.uid);
    console.log('🎯 Role: admin');
    console.log('');
    console.log('📝 Note: You still need to create the user in Firebase Authentication Console');
    console.log('   Go to: https://console.firebase.google.com/project/eventra-13b4c/authentication/users');
    console.log('   Click "Add user" and use:');
    console.log('   - Email: admin@gmail.com');
    console.log('   - Password: Admin@123');
    
  } catch (error) {
    console.error('❌ Error adding admin to Firestore:', error);
  }
}

// Run the script
addAdminToFirestore()
  .then(() => {
    console.log('🎉 Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
