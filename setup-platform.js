#!/usr/bin/env node

/**
 * Eventrra Platform Setup Script
 * Comprehensive setup for the full-stack event management marketplace
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎉 Welcome to Eventrra Platform Setup!');
console.log('=====================================\n');

// Check if we're in the right directory
if (!fs.existsSync('backend') || !fs.existsSync('frontend')) {
  console.error('❌ Please run this script from the Eventrra root directory');
  process.exit(1);
}

async function setupPlatform() {
  try {
    console.log('📋 Platform Setup Checklist:');
    console.log('============================\n');

    // 1. Backend Setup
    console.log('🔧 Setting up Backend...');
    console.log('------------------------');
    
    // Install backend dependencies
    console.log('📦 Installing backend dependencies...');
    execSync('cd backend && npm install', { stdio: 'inherit' });
    
    // Create environment file if it doesn't exist
    if (!fs.existsSync('backend/.env')) {
      console.log('📝 Creating backend environment file...');
      fs.copyFileSync('backend/env.example', 'backend/.env');
      console.log('⚠️  Please update backend/.env with your database credentials');
    }

    // 2. Frontend Setup
    console.log('\n🎨 Setting up Frontend...');
    console.log('-------------------------');
    
    // Install frontend dependencies
    console.log('📦 Installing frontend dependencies...');
    execSync('cd frontend && npm install', { stdio: 'inherit' });
    
    // Create environment file if it doesn't exist
    if (!fs.existsSync('frontend/.env.local')) {
      console.log('📝 Creating frontend environment file...');
      if (fs.existsSync('frontend/env.local')) {
        fs.copyFileSync('frontend/env.local', 'frontend/.env.local');
      } else {
        fs.writeFileSync('frontend/.env.local', 'NEXT_PUBLIC_API_URL=http://localhost:5000/api\n');
      }
    }

    // 3. Database Setup Instructions
    console.log('\n🗄️ Database Setup Required:');
    console.log('============================');
    console.log('1. Install MySQL on your system');
    console.log('2. Create a database named "eventrra"');
    console.log('3. Update backend/.env with your MySQL credentials:');
    console.log('   DB_HOST=localhost');
    console.log('   DB_USER=your_username');
    console.log('   DB_PASSWORD=your_password');
    console.log('   DB_NAME=eventrra');
    console.log('   DB_PORT=3306');
    console.log('4. Run the database schema:');
    console.log('   mysql -u your_username -p eventrra < backend/database/schema.sql');

    // 4. Firebase Setup Instructions
    console.log('\n🔥 Firebase Setup Required:');
    console.log('===========================');
    console.log('1. Update backend/.env with your Firebase credentials');
    console.log('2. Add Firebase service account key file');
    console.log('3. Update frontend/.env.local with Firebase config');

    // 5. Next Steps
    console.log('\n🚀 Next Steps:');
    console.log('==============');
    console.log('1. Complete database and Firebase setup');
    console.log('2. Start the backend server:');
    console.log('   cd backend && npm run dev');
    console.log('3. Start the frontend server:');
    console.log('   cd frontend && npm run dev');
    console.log('4. Create admin user:');
    console.log('   node backend/scripts/createAdmin.js');
    console.log('5. Seed sample data:');
    console.log('   node backend/scripts/seedData.js');

    console.log('\n✅ Setup completed!');
    console.log('🎯 Your Eventrra platform is ready for configuration!');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run setup
setupPlatform();
