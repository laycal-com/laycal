const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const uri = 'mongodb+srv://medng1965:y9V7e9l4e2KiEmtJ@cluster0.dmm6ss0.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();
    
    // Check if admin already exists
    const existingAdmin = await db.collection('admins').findOne({ email: 'admin@laycal.com' });
    if (existingAdmin) {
      console.log('Admin account already exists');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash('123456', 12);

    // Create admin
    const admin = {
      email: 'admin@laycal.com',
      passwordHash,
      name: 'Admin User',
      role: 'super_admin',
      permissions: [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('admins').insertOne(admin);
    console.log('✅ Admin account created successfully');
    console.log('Email: admin@laycal.com');
    console.log('Password: 123456');

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await client.close();
  }
}

createAdmin();