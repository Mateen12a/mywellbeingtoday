import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL;

async function migrateRoles() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    console.log('\n=== Role Migration: super_admin → admin, admin → manager ===\n');

    const superAdmins = await usersCollection.countDocuments({ role: 'super_admin' });
    const admins = await usersCollection.countDocuments({ role: 'admin' });

    console.log(`Found ${superAdmins} users with role 'super_admin'`);
    console.log(`Found ${admins} users with role 'admin'`);

    if (superAdmins === 0 && admins === 0) {
      console.log('\nNo users to migrate. The migration may have already been applied.');
      await mongoose.disconnect();
      return;
    }

    const updateAdminToManager = await usersCollection.updateMany(
      { role: 'admin' },
      { $set: { role: 'manager' } }
    );
    console.log(`\nUpdated ${updateAdminToManager.modifiedCount} users from 'admin' to 'manager'`);

    const updateSuperAdminToAdmin = await usersCollection.updateMany(
      { role: 'super_admin' },
      { $set: { role: 'admin' } }
    );
    console.log(`Updated ${updateSuperAdminToAdmin.modifiedCount} users from 'super_admin' to 'admin'`);

    const newAdmins = await usersCollection.countDocuments({ role: 'admin' });
    const newManagers = await usersCollection.countDocuments({ role: 'manager' });
    const remainingSuperAdmins = await usersCollection.countDocuments({ role: 'super_admin' });
    const remainingOldAdmins = await usersCollection.countDocuments({ role: 'admin_old' });

    console.log('\n=== Migration Complete ===');
    console.log(`Users with role 'admin': ${newAdmins}`);
    console.log(`Users with role 'manager': ${newManagers}`);
    
    if (remainingSuperAdmins > 0) {
      console.warn(`Warning: ${remainingSuperAdmins} users still have role 'super_admin'`);
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrateRoles();
