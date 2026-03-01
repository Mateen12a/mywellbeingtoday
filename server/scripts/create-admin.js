import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL;

async function createAdmin() {
  if (!MONGO_URI) {
    console.error('No MONGO_URI or DATABASE_URL found in environment');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI, { dbName: 'Wellbeing' });
  console.log('Connected to MongoDB');

  const db = mongoose.connection.db;
  const usersCollection = db.collection('users');

  const email = 'matestjare@gmail.com';
  const existing = await usersCollection.findOne({ email });

  if (existing) {
    if (existing.role === 'admin') {
      console.log(`Admin account already exists for ${email} (role: ${existing.role})`);
    } else {
      await usersCollection.updateOne(
        { email },
        {
          $set: {
            role: 'admin',
            'verification.emailVerified': true,
            isActive: true,
            updatedAt: new Date()
          }
        }
      );
      console.log(`Upgraded existing account ${email} to admin role`);
    }
  } else {
    const hashedPassword = await bcrypt.hash('Welcome123!', 12);

    await usersCollection.insertOne({
      email,
      password: hashedPassword,
      role: 'admin',
      profile: {
        firstName: 'Admin',
        lastName: 'Mateen',
        displayName: 'Admin Mateen'
      },
      verification: {
        emailVerified: true
      },
      consent: {
        termsAccepted: true,
        termsAcceptedAt: new Date(),
        privacyAccepted: true,
        privacyAcceptedAt: new Date()
      },
      isActive: true,
      settings: {
        notifications: { email: true, push: true, sms: false },
        privacy: { shareDataWithProviders: false, anonymousAnalytics: true },
        preferences: { language: 'en', timezone: 'Europe/London', theme: 'system' }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log(`Admin account created successfully for ${email}`);
  }

  await mongoose.connection.close();
  console.log('Done');
}

createAdmin().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
