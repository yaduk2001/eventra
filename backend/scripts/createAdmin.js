const { auth, firebaseHelpers } = require('../config/firebase');

async function createAdminUser() {
  try {
    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'Admin@123';
    
    console.log('🔐 Creating admin user...');
    
    // Try to find existing user in Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(adminEmail);
      console.log('ℹ️  Admin user already exists in Firebase Auth:', userRecord.uid);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        // Create user in Firebase Authentication
        userRecord = await auth.createUser({
          email: adminEmail,
          password: adminPassword,
          displayName: 'System Administrator',
          emailVerified: true
        });
        console.log('✅ User created in Firebase Auth:', userRecord.uid);
      } else {
        throw e;
      }
    }

    // Create or update user profile in Realtime Database
    const adminData = {
      uid: userRecord.uid,
      email: adminEmail,
      name: 'System Administrator',
      role: 'admin',
      approved: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await firebaseHelpers.createDocument('users', adminData, userRecord.uid);

    console.log('✅ Admin user created/updated successfully in database!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('🆔 UID:', userRecord.uid);
    console.log('🎯 Role: admin');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    if (error.code === 'auth/email-already-exists') {
      console.log('ℹ️  User already exists in Firebase Auth. Ensuring database document exists...');
      try {
        const existing = await auth.getUserByEmail('admin@gmail.com');
        const data = {
          uid: existing.uid,
          email: 'admin@gmail.com',
          name: 'System Administrator',
          role: 'admin',
          approved: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await firebaseHelpers.createDocument('users', data, existing.uid);
        console.log('✅ Database document created/updated for existing user');
      } catch (dbError) {
        console.error('❌ Error creating database document:', dbError);
      }
    }
  }
}

// Run the script
createAdminUser()
  .then(() => {
    console.log('🎉 Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
