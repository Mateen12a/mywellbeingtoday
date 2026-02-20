import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI = process.env.MONGO_URI || process.env.DATABASE_URL;

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  role: String,
  profile: {
    firstName: String,
    lastName: String,
    displayName: String,
    dateOfBirth: Date,
    phone: String,
    address: {
      street: String,
      city: String,
      postcode: String,
      country: String
    },
    avatarUrl: String,
    bio: String
  },
  settings: {
    notifications: { email: Boolean, push: Boolean, sms: Boolean },
    privacy: { shareDataWithProviders: Boolean, anonymousAnalytics: Boolean },
    preferences: { language: String, timezone: String, theme: String }
  },
  verification: { emailVerified: Boolean },
  consent: { termsAccepted: Boolean, termsAcceptedAt: Date, privacyAccepted: Boolean, privacyAcceptedAt: Date },
  subscription: { plan: String, status: String },
  lastLogin: Date,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}, { collection: 'users' });

const providerSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  professionalInfo: {
    title: String,
    qualifications: [String],
    registrationNumber: String,
    yearsOfExperience: Number,
    specialties: [String],
    bio: String,
    languages: [String]
  },
  practice: {
    name: String,
    address: { street: String, city: String, postcode: String, country: String },
    phone: String,
    email: String,
    website: String,
    location: { type: { type: String }, coordinates: [Number] }
  },
  availability: {
    acceptingNewPatients: Boolean,
    consultationTypes: [String],
    workingHours: [{ day: Number, start: String, end: String, isAvailable: Boolean }],
    appointmentDuration: Number
  },
  verification: { isVerified: Boolean, verifiedAt: Date },
  ratings: { average: Number, count: Number },
  services: [{ name: String, description: String, duration: Number, price: Number }],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}, { collection: 'providers' });

const activityLogSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  date: Date,
  category: String,
  customCategory: String,
  title: String,
  description: String,
  duration: Number,
  intensity: String,
  metrics: mongoose.Schema.Types.Mixed,
  notes: String,
  inputMethod: String,
  tags: [String],
  location: String,
  createdAt: Date,
  updatedAt: Date
}, { collection: 'activitylogs' });

const moodLogSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  date: Date,
  mood: String,
  moodScore: Number,
  energyLevel: Number,
  stressLevel: Number,
  anxietyLevel: Number,
  sleepQuality: Number,
  factors: [String],
  customFactors: [String],
  notes: String,
  triggers: [String],
  copingStrategies: [String],
  inputMethod: String,
  timeOfDay: String,
  createdAt: Date,
  updatedAt: Date
}, { collection: 'moodlogs' });

const wellbeingReportSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  dateRange: { start: Date, end: Date },
  overallScore: Number,
  wellbeingLevel: String,
  analysis: {
    summary: String,
    strengths: [String],
    areasForImprovement: [String],
    patterns: [{
      type: { type: String },
      description: { type: String },
      impact: { type: String }
    }],
    trends: { mood: String, activity: String, sleep: String, stress: String }
  },
  recommendations: [{
    category: { type: String },
    title: { type: String },
    description: { type: String },
    priority: { type: String },
    actionable: { type: Boolean }
  }],
  insights: [{
    title: { type: String },
    content: { type: String },
    type: { type: String }
  }],
  dataPoints: {
    activityLogs: Number,
    moodLogs: Number,
    averageMoodScore: Number,
    averageEnergyLevel: Number,
    averageStressLevel: Number,
    totalActivityMinutes: Number,
    mostCommonMood: String,
    mostCommonActivity: String
  },
  seekHelpRecommended: Boolean,
  generatedBy: String,
  createdAt: Date
}, { collection: 'wellbeingreports' });

const appointmentSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  providerId: mongoose.Schema.Types.ObjectId,
  dateTime: Date,
  endTime: Date,
  duration: Number,
  type: String,
  status: String,
  reason: String,
  notes: { userNotes: String, providerNotes: String },
  createdAt: Date,
  updatedAt: Date
}, { collection: 'appointments' });

const conversationSchema = new mongoose.Schema({
  participants: [mongoose.Schema.Types.ObjectId],
  lastMessage: { content: String, senderId: mongoose.Schema.Types.ObjectId, createdAt: Date },
  unreadCount: mongoose.Schema.Types.Mixed,
  createdAt: Date,
  updatedAt: Date
}, { collection: 'conversations' });

const messageSchema = new mongoose.Schema({
  conversationId: mongoose.Schema.Types.ObjectId,
  senderId: mongoose.Schema.Types.ObjectId,
  recipientId: mongoose.Schema.Types.ObjectId,
  content: String,
  type: String,
  read: Boolean,
  readAt: Date,
  createdAt: Date
}, { collection: 'messages' });

const certificateSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  providerId: mongoose.Schema.Types.ObjectId,
  type: String,
  title: String,
  description: String,
  issueDate: Date,
  expiryDate: Date,
  validFrom: Date,
  validUntil: Date,
  status: String,
  issuedBy: { name: String, title: String, organization: String, registrationNumber: String },
  notes: String,
  verificationCode: String,
  createdAt: Date,
  updatedAt: Date
}, { collection: 'certificates' });

const User = mongoose.model('User', userSchema);
const Provider = mongoose.model('Provider', providerSchema);
const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
const MoodLog = mongoose.model('MoodLog', moodLogSchema);
const WellbeingReport = mongoose.model('WellbeingReport', wellbeingReportSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);
const Conversation = mongoose.model('Conversation', conversationSchema);
const Message = mongoose.model('Message', messageSchema);
const Certificate = mongoose.model('Certificate', certificateSchema);

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI, { dbName: 'Wellbeing' });
  console.log('Connected successfully!');

  console.log('Clearing existing test data...');
  try {
    await mongoose.connection.collection('users').dropIndex('username_1');
    console.log('Dropped username index');
  } catch (e) {
    console.log('Username index does not exist or already dropped');
  }
  await User.deleteMany({ email: { $in: ['admin@mywellbeingtoday.com', 'superadmin@mywellbeingtoday.com', 'provider@mywellbeingtoday.com', 'user@mywellbeingtoday.com'] }});
  
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash('Welcome123!', salt);
  const now = new Date();

  console.log('Creating test users...');
  
  const adminUser = await User.create({
    email: 'admin@mywellbeingtoday.com',
    password: hashedPassword,
    role: 'admin',
    profile: {
      firstName: 'Sarah',
      lastName: 'Mitchell',
      displayName: 'Sarah Mitchell',
      dateOfBirth: new Date('1985-03-15'),
      phone: '+44 7700 900001',
      address: { street: '123 Admin Street', city: 'London', postcode: 'EC1A 1BB', country: 'UK' },
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
      bio: 'Platform administrator ensuring the best experience for all users.'
    },
    settings: {
      notifications: { email: true, push: true, sms: true },
      privacy: { shareDataWithProviders: false, anonymousAnalytics: true },
      preferences: { language: 'en', timezone: 'Europe/London', theme: 'light' }
    },
    verification: { emailVerified: true },
    consent: { termsAccepted: true, termsAcceptedAt: now, privacyAccepted: true, privacyAcceptedAt: now },
    subscription: { plan: 'enterprise', status: 'active' },
    lastLogin: now,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: now
  });

  // Admin account - Dr. Kuje Amos
  // Email: superadmin@mywellbeingtoday.com
  // Password: Welcome123!
  // Role: admin
  const superadminUser = await User.create({
    email: 'superadmin@mywellbeingtoday.com',
    password: hashedPassword,
    role: 'admin',
    profile: {
      firstName: 'Kuje',
      lastName: 'Amos',
      displayName: 'Dr. Kuje Amos',
      dateOfBirth: new Date('1980-05-10'),
      phone: '+44 7700 900000',
      address: { street: '1 Executive Plaza', city: 'London', postcode: 'EC1A 1AA', country: 'UK' },
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      bio: 'Chief platform administrator and system supervisor for mywellbeingtoday.'
    },
    settings: {
      notifications: { email: true, push: true, sms: true },
      privacy: { shareDataWithProviders: false, anonymousAnalytics: true },
      preferences: { language: 'en', timezone: 'Europe/London', theme: 'light' }
    },
    verification: { emailVerified: true },
    consent: { termsAccepted: true, termsAcceptedAt: now, privacyAccepted: true, privacyAcceptedAt: now },
    subscription: { plan: 'enterprise', status: 'active' },
    lastLogin: now,
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: now
  });

  const providerUser = await User.create({
    email: 'provider@mywellbeingtoday.com',
    password: hashedPassword,
    role: 'provider',
    profile: {
      firstName: 'Dr. James',
      lastName: 'Thompson',
      displayName: 'Dr. James Thompson',
      dateOfBirth: new Date('1978-07-22'),
      phone: '+44 7700 900002',
      address: { street: '45 Harley Street', city: 'London', postcode: 'W1G 8QR', country: 'UK' },
      avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop&crop=face',
      bio: 'Licensed mental health counselor with 15+ years of experience helping individuals achieve emotional wellness.'
    },
    settings: {
      notifications: { email: true, push: true, sms: true },
      privacy: { shareDataWithProviders: true, anonymousAnalytics: true },
      preferences: { language: 'en', timezone: 'Europe/London', theme: 'light' }
    },
    verification: { emailVerified: true },
    consent: { termsAccepted: true, termsAcceptedAt: now, privacyAccepted: true, privacyAcceptedAt: now },
    subscription: { plan: 'professional', status: 'active' },
    lastLogin: now,
    isActive: true,
    createdAt: new Date('2024-02-15'),
    updatedAt: now
  });

  const regularUser = await User.create({
    email: 'user@mywellbeingtoday.com',
    password: hashedPassword,
    role: 'user',
    profile: {
      firstName: 'Emily',
      lastName: 'Johnson',
      displayName: 'Emily Johnson',
      dateOfBirth: new Date('1992-11-08'),
      phone: '+44 7700 900003',
      address: { street: '78 Oak Avenue', city: 'Manchester', postcode: 'M1 4FE', country: 'UK' },
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      bio: 'Taking charge of my mental and physical wellbeing one day at a time.'
    },
    settings: {
      notifications: { email: true, push: true, sms: false },
      privacy: { shareDataWithProviders: true, anonymousAnalytics: true },
      preferences: { language: 'en', timezone: 'Europe/London', theme: 'light' }
    },
    verification: { emailVerified: true },
    consent: { termsAccepted: true, termsAcceptedAt: now, privacyAccepted: true, privacyAcceptedAt: now },
    subscription: { plan: 'premium', status: 'active' },
    lastLogin: now,
    isActive: true,
    createdAt: new Date('2024-06-01'),
    updatedAt: now
  });

  console.log('Creating provider profile...');
  const provider = await Provider.create({
    userId: providerUser._id,
    professionalInfo: {
      title: 'Dr.',
      qualifications: ['PhD Clinical Psychology', 'MSc Counseling Psychology', 'BACP Registered'],
      registrationNumber: 'BACP-78945',
      yearsOfExperience: 15,
      specialties: ['mental_health', 'counseling', 'psychiatry'],
      bio: 'I specialize in cognitive behavioral therapy and mindfulness-based approaches. My practice focuses on helping clients navigate anxiety, depression, work stress, and life transitions with evidence-based techniques.',
      languages: ['English', 'French']
    },
    practice: {
      name: 'Thompson Wellness Center',
      address: { street: '45 Harley Street', city: 'London', postcode: 'W1G 8QR', country: 'UK' },
      phone: '+44 20 7946 0958',
      email: 'provider@mywellbeingtoday.com',
      website: 'https://thompsonwellness.com',
      location: { type: 'Point', coordinates: [-0.1478, 51.5194] }
    },
    availability: {
      acceptingNewPatients: true,
      consultationTypes: ['in_person', 'video', 'phone'],
      workingHours: [
        { day: 1, start: '09:00', end: '17:00', isAvailable: true },
        { day: 2, start: '09:00', end: '17:00', isAvailable: true },
        { day: 3, start: '09:00', end: '17:00', isAvailable: true },
        { day: 4, start: '09:00', end: '17:00', isAvailable: true },
        { day: 5, start: '09:00', end: '14:00', isAvailable: true }
      ],
      appointmentDuration: 50
    },
    verification: { isVerified: true, verifiedAt: new Date('2024-02-20') },
    ratings: { average: 4.8, count: 127 },
    services: [
      { name: 'Initial Consultation', description: 'Comprehensive assessment and treatment planning', duration: 60, price: 150 },
      { name: 'Follow-up Session', description: 'Regular therapy session', duration: 50, price: 120 },
      { name: 'Couples Counseling', description: 'Relationship therapy for couples', duration: 75, price: 180 },
      { name: 'Crisis Support', description: 'Emergency support session', duration: 30, price: 80 }
    ],
    isActive: true,
    createdAt: new Date('2024-02-15'),
    updatedAt: now
  });

  console.log('Creating activity logs...');
  const activities = [];
  const categories = ['exercise', 'work', 'sleep', 'social', 'relaxation', 'nutrition', 'meditation', 'hobby'];
  const activityTitles = {
    exercise: ['Morning Run', 'Gym Workout', 'Yoga Session', 'Evening Walk', 'Swimming'],
    work: ['Project Meeting', 'Deep Work Session', 'Team Collaboration', 'Client Call'],
    sleep: ['Night Sleep', 'Power Nap', 'Rest Period'],
    social: ['Dinner with Friends', 'Family Visit', 'Video Call with Parents', 'Coffee with Colleague'],
    relaxation: ['Reading', 'Watching TV', 'Listening to Music', 'Hot Bath'],
    nutrition: ['Healthy Breakfast', 'Meal Prep', 'Vegetarian Dinner', 'Smoothie'],
    meditation: ['Morning Meditation', 'Breathing Exercises', 'Mindfulness Practice'],
    hobby: ['Painting', 'Photography', 'Gardening', 'Playing Guitar']
  };

  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const numActivities = Math.floor(Math.random() * 3) + 2;
    
    for (let j = 0; j < numActivities; j++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const titles = activityTitles[category];
      const title = titles[Math.floor(Math.random() * titles.length)];
      
      activities.push({
        userId: regularUser._id,
        date: date,
        category: category,
        title: title,
        description: `${title} activity logged for wellbeing tracking`,
        duration: Math.floor(Math.random() * 90) + 15,
        intensity: ['low', 'moderate', 'high'][Math.floor(Math.random() * 3)],
        metrics: category === 'exercise' ? { 
          steps: Math.floor(Math.random() * 8000) + 2000,
          calories: Math.floor(Math.random() * 400) + 100
        } : category === 'sleep' ? {
          sleepHours: Math.floor(Math.random() * 3) + 6,
          sleepQuality: ['fair', 'good', 'excellent'][Math.floor(Math.random() * 3)]
        } : {},
        notes: '',
        inputMethod: 'manual',
        tags: [category],
        location: 'Home',
        createdAt: date,
        updatedAt: date
      });
    }
  }
  await ActivityLog.insertMany(activities);

  console.log('Creating mood logs...');
  const moods = [];
  const moodTypes = ['happy', 'calm', 'focused', 'anxious', 'stressed', 'sad', 'tired', 'energetic', 'hopeful'];
  const factors = ['work', 'relationships', 'health', 'finances', 'sleep', 'exercise', 'weather', 'social', 'family'];
  const timesOfDay = ['morning', 'afternoon', 'evening'];

  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    for (const timeOfDay of timesOfDay) {
      const moodScore = Math.floor(Math.random() * 4) + 5;
      const selectedFactors = factors.slice(0, Math.floor(Math.random() * 3) + 1);
      
      moods.push({
        userId: regularUser._id,
        date: date,
        mood: moodTypes[Math.floor(Math.random() * moodTypes.length)],
        moodScore: moodScore,
        energyLevel: Math.floor(Math.random() * 4) + 5,
        stressLevel: Math.floor(Math.random() * 5) + 3,
        anxietyLevel: Math.floor(Math.random() * 4) + 2,
        sleepQuality: Math.floor(Math.random() * 3) + 6,
        factors: selectedFactors,
        notes: '',
        triggers: [],
        copingStrategies: ['breathing exercises', 'walking', 'talking to someone'].slice(0, Math.floor(Math.random() * 2) + 1),
        inputMethod: 'manual',
        timeOfDay: timeOfDay,
        createdAt: date,
        updatedAt: date
      });
    }
  }
  await MoodLog.insertMany(moods);

  console.log('Creating wellbeing report...');
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  await WellbeingReport.create({
    userId: regularUser._id,
    dateRange: { start: weekAgo, end: now },
    overallScore: 72,
    wellbeingLevel: 'good',
    analysis: {
      summary: 'Your overall wellbeing has been positive this week. You have maintained consistent activity levels and your mood has been generally stable with some minor fluctuations.',
      strengths: [
        'Consistent exercise routine with 5 workout sessions',
        'Good sleep quality averaging 7.2 hours per night',
        'Strong social connections with regular interactions',
        'Effective use of meditation for stress management'
      ],
      areasForImprovement: [
        'Consider reducing screen time in the evening',
        'Try to maintain more consistent meal times',
        'Work-related stress shows room for improvement'
      ],
      patterns: [
        { type: 'mood', description: 'Your mood tends to be higher on days when you exercise', impact: 'positive' },
        { type: 'sleep', description: 'Sleep quality decreases when evening screen time exceeds 2 hours', impact: 'negative' },
        { type: 'energy', description: 'Morning meditation correlates with higher energy levels throughout the day', impact: 'positive' }
      ],
      trends: { mood: 'improving', activity: 'stable', sleep: 'stable', stress: 'decreasing' }
    },
    recommendations: [
      { category: 'exercise', title: 'Continue Your Routine', description: 'Your current exercise schedule is working well. Consider adding one more short walk.', priority: 'low', actionable: true },
      { category: 'sleep', title: 'Digital Sunset', description: 'Try putting away screens 1 hour before bed to improve sleep quality.', priority: 'medium', actionable: true },
      { category: 'stress', title: 'Work Boundaries', description: 'Consider setting clearer boundaries between work and personal time.', priority: 'high', actionable: true },
      { category: 'nutrition', title: 'Consistent Meals', description: 'Having meals at regular times can help stabilize energy and mood.', priority: 'medium', actionable: true }
    ],
    insights: [
      { title: 'Exercise Impact', content: 'Your mood scores are 23% higher on days when you exercise compared to rest days.', type: 'observation' },
      { title: 'Social Connection', content: 'Time spent with friends and family shows strong positive correlation with your wellbeing.', type: 'observation' },
      { title: 'Stress Alert', content: 'Work-related stress has increased this week. Consider using the stress management tools.', type: 'alert' }
    ],
    dataPoints: {
      activityLogs: activities.length,
      moodLogs: moods.length,
      averageMoodScore: 7.2,
      averageEnergyLevel: 6.8,
      averageStressLevel: 4.5,
      totalActivityMinutes: 840,
      mostCommonMood: 'calm',
      mostCommonActivity: 'exercise'
    },
    seekHelpRecommended: false,
    generatedBy: 'ai',
    createdAt: now
  });

  console.log('Creating appointment...');
  const appointmentDate = new Date();
  appointmentDate.setDate(appointmentDate.getDate() + 3);
  appointmentDate.setHours(10, 0, 0, 0);
  const appointmentEnd = new Date(appointmentDate);
  appointmentEnd.setMinutes(appointmentEnd.getMinutes() + 50);

  await Appointment.create({
    userId: regularUser._id,
    providerId: provider._id,
    dateTime: appointmentDate,
    endTime: appointmentEnd,
    duration: 50,
    type: 'video',
    status: 'confirmed',
    reason: 'Follow-up session to discuss progress with stress management techniques',
    notes: {
      userNotes: 'Want to discuss work-life balance strategies',
      providerNotes: ''
    },
    createdAt: now,
    updatedAt: now
  });

  console.log('Creating conversation and messages...');
  const conversation = await Conversation.create({
    participants: [regularUser._id, providerUser._id],
    lastMessage: {
      content: 'Looking forward to our session on Thursday!',
      senderId: regularUser._id,
      createdAt: now
    },
    unreadCount: { [providerUser._id.toString()]: 1 },
    createdAt: new Date(now.getTime() - 86400000 * 5),
    updatedAt: now
  });

  const messageData = [
    { sender: providerUser._id, recipient: regularUser._id, content: 'Hello Emily! Thank you for booking your first appointment. I look forward to meeting you.', daysAgo: 5 },
    { sender: regularUser._id, recipient: providerUser._id, content: 'Thank you Dr. Thompson! I have been struggling with work stress lately and thought it was time to seek help.', daysAgo: 5 },
    { sender: providerUser._id, recipient: regularUser._id, content: 'That is a very positive step. Before our session, could you tell me a bit more about what specific situations at work trigger the most stress?', daysAgo: 4 },
    { sender: regularUser._id, recipient: providerUser._id, content: 'Sure! Mainly tight deadlines and back-to-back meetings. I often feel overwhelmed and unable to focus.', daysAgo: 4 },
    { sender: providerUser._id, recipient: regularUser._id, content: 'I understand. We will definitely work on some practical strategies for that. See you Thursday at 10am!', daysAgo: 3 },
    { sender: regularUser._id, recipient: providerUser._id, content: 'Looking forward to our session on Thursday!', daysAgo: 0 }
  ];

  for (const msg of messageData) {
    const msgDate = new Date();
    msgDate.setDate(msgDate.getDate() - msg.daysAgo);
    await Message.create({
      conversationId: conversation._id,
      senderId: msg.sender,
      recipientId: msg.recipient,
      content: msg.content,
      type: 'text',
      read: msg.daysAgo > 0,
      readAt: msg.daysAgo > 0 ? msgDate : null,
      createdAt: msgDate
    });
  }

  console.log('Creating certificates...');
  const certDate = new Date();
  certDate.setDate(certDate.getDate() - 30);
  const certExpiry = new Date();
  certExpiry.setMonth(certExpiry.getMonth() + 6);

  await Certificate.create({
    userId: regularUser._id,
    providerId: provider._id,
    type: 'fitness_certificate',
    title: 'Fitness to Work Certificate',
    description: 'Certificate confirming fitness to return to work following assessment',
    issueDate: certDate,
    expiryDate: certExpiry,
    validFrom: certDate,
    validUntil: certExpiry,
    status: 'active',
    issuedBy: {
      name: 'Dr. James Thompson',
      title: 'Clinical Psychologist',
      organization: 'Thompson Wellness Center',
      registrationNumber: 'BACP-78945'
    },
    notes: 'Patient has completed initial assessment and is cleared for regular work activities.',
    verificationCode: 'CERT-2024-78945-FTW',
    createdAt: certDate,
    updatedAt: certDate
  });

  console.log('\n========================================');
  console.log('DATABASE SEEDED SUCCESSFULLY!');
  console.log('========================================\n');
  console.log('TEST USER CREDENTIALS:');
  console.log('----------------------------------------');
  console.log('ADMIN (Dr. Kuje Amos):');
  console.log('  Email: superadmin@mywellbeingtoday.com');
  console.log('  Password: Welcome123!');
  console.log('  Role: admin');
  console.log('');
  console.log('ADMIN 2:');
  console.log('  Email: admin@mywellbeingtoday.com');
  console.log('  Password: Welcome123!');
  console.log('  Role: admin');
  console.log('');
  console.log('PROVIDER:');
  console.log('  Email: provider@mywellbeingtoday.com');
  console.log('  Password: Welcome123!');
  console.log('  Role: provider');
  console.log('');
  console.log('USER:');
  console.log('  Email: user@mywellbeingtoday.com');
  console.log('  Password: Welcome123!');
  console.log('  Role: user');
  console.log('----------------------------------------\n');

  await mongoose.connection.close();
  console.log('Database connection closed.');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
