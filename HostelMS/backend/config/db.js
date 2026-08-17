const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    // Drop legacy non-partial rollNumber_1 index if it exists in MongoDB Atlas
    try {
      const studentCollection = mongoose.connection.collection('students');
      const indexes = await studentCollection.indexes();
      const legacyRollIndex = indexes.find(i => i.name === 'rollNumber_1');
      if (legacyRollIndex && !legacyRollIndex.partialFilterExpression) {
        console.log('🔄 Dropping legacy rollNumber_1 unique index...');
        await studentCollection.dropIndex('rollNumber_1');
        console.log('✅ Dropped legacy rollNumber_1 index.');
      }
    } catch (idxErr) {
      console.log('ℹ️ Index check notice:', idxErr.message);
    }
    
    // Sync indexes to ensure partial unique index is active
    const Student = require('../models/Student');
    await Student.syncIndexes().catch(err => console.log('Index sync notice:', err.message));
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
