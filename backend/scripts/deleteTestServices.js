const { firebaseHelpers } = require('../config/firebase');

// Services to delete based on the provided list
const servicesToDelete = [
  {
    providerName: 'eventra',
    serviceName: 'Wedding Planning',
    price: 77717,
    category: 'wedding'
  },
  {
    providerName: 'eventra',
    serviceName: 'Corporate Events',
    price: 36659,
    category: 'corporate'
  },
  {
    providerName: 'Jk',
    serviceName: 'Wedding Planning',
    price: 57030,
    category: 'wedding'
  },
  {
    providerName: 'Jk',
    serviceName: 'Corporate Events',
    price: 52299,
    category: 'corporate'
  },
  {
    providerName: 'jkps',
    serviceName: 'Wedding Planning',
    price: 53678,
    category: 'wedding'
  },
  {
    providerName: 'jkps',
    serviceName: 'Corporate Events',
    price: 37922,
    category: 'corporate'
  },
  {
    providerName: 'Jkps',
    serviceName: 'Wedding Planning',
    price: 81551,
    category: 'wedding'
  },
  {
    providerName: 'Jkps',
    serviceName: 'Corporate Events',
    price: 49769,
    category: 'corporate'
  }
];

async function deleteTestServices() {
  try {
    console.log('🔍 Fetching all services from Firebase...');
    
    // Get all services from Firebase
    const allServices = await firebaseHelpers.getCollection('services');
    console.log(`📊 Found ${allServices.length} total services in database`);
    
    // Get all users to match provider names
    const allUsers = await firebaseHelpers.getCollection('users');
    console.log(`👥 Found ${allUsers.length} total users in database`);
    
    let deletedCount = 0;
    let notFoundCount = 0;
    
    console.log('\n🎯 Starting deletion process...\n');
    
    for (const targetService of servicesToDelete) {
      console.log(`🔍 Looking for: ${targetService.providerName} - ${targetService.serviceName} (₹${targetService.price})`);
      
      // Find matching services
      const matchingServices = allServices.filter(service => {
        // Find the provider
        const provider = allUsers.find(user => 
          user.uid === service.providerId || 
          user.id === service.providerId
        );
        
        const providerName = provider?.name || provider?.businessName || '';
        
        // Check if service matches our criteria
        const nameMatch = service.name && (
          service.name.toLowerCase().includes(targetService.serviceName.toLowerCase()) ||
          targetService.serviceName.toLowerCase().includes(service.name.toLowerCase())
        );
        
        const providerMatch = providerName.toLowerCase().includes(targetService.providerName.toLowerCase()) ||
                             targetService.providerName.toLowerCase().includes(providerName.toLowerCase());
        
        const priceMatch = Math.abs(service.price - targetService.price) < 100; // Allow small price differences
        
        const categoryMatch = service.category === targetService.category;
        
        return nameMatch && providerMatch && priceMatch && categoryMatch;
      });
      
      if (matchingServices.length > 0) {
        for (const service of matchingServices) {
          try {
            console.log(`  ✅ Found matching service: ${service.id} - ${service.name} (₹${service.price})`);
            
            // Delete the service
            await firebaseHelpers.deleteDocument('services', service.id);
            console.log(`  🗑️  Deleted service: ${service.id}`);
            deletedCount++;
            
          } catch (deleteError) {
            console.error(`  ❌ Error deleting service ${service.id}:`, deleteError.message);
          }
        }
      } else {
        console.log(`  ⚠️  No matching service found`);
        notFoundCount++;
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log('📊 Deletion Summary:');
    console.log(`✅ Successfully deleted: ${deletedCount} services`);
    console.log(`⚠️  Not found: ${notFoundCount} services`);
    console.log(`🎯 Total processed: ${servicesToDelete.length} target services`);
    
    if (deletedCount > 0) {
      console.log('\n🎉 Services deleted successfully!');
    } else {
      console.log('\n⚠️  No services were deleted. They may have already been removed or the criteria didn\'t match.');
    }
    
  } catch (error) {
    console.error('❌ Error during deletion process:', error);
    throw error;
  }
}

// Alternative function to delete services by exact name and price match
async function deleteServicesByExactMatch() {
  try {
    console.log('🔍 Alternative method: Deleting by exact name and price match...');
    
    const allServices = await firebaseHelpers.getCollection('services');
    const allUsers = await firebaseHelpers.getCollection('users');
    
    let deletedCount = 0;
    
    // Look for services with these exact patterns
    const patterns = [
      { name: /wedding planning/i, price: [77717, 57030, 53678, 81551] },
      { name: /corporate events/i, price: [36659, 52299, 37922, 49769] }
    ];
    
    for (const service of allServices) {
      for (const pattern of patterns) {
        if (pattern.name.test(service.name) && pattern.price.includes(service.price)) {
          try {
            console.log(`🗑️  Deleting: ${service.name} - ₹${service.price} (ID: ${service.id})`);
            await firebaseHelpers.deleteDocument('services', service.id);
            deletedCount++;
          } catch (deleteError) {
            console.error(`❌ Error deleting service ${service.id}:`, deleteError.message);
          }
        }
      }
    }
    
    console.log(`✅ Deleted ${deletedCount} services using exact match method`);
    
  } catch (error) {
    console.error('❌ Error in exact match deletion:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting test services deletion script...\n');
    
    // First try the detailed matching approach
    await deleteTestServices();
    
    console.log('\n' + '='.repeat(50));
    console.log('🔄 Running alternative exact match method as backup...\n');
    
    // Then try the exact match approach as backup
    await deleteServicesByExactMatch();
    
    console.log('\n🎉 Script completed successfully!');
    
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main()
    .then(() => {
      console.log('✨ All done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error:', error);
      process.exit(1);
    });
}

module.exports = {
  deleteTestServices,
  deleteServicesByExactMatch
};