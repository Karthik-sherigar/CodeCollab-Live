import mongoose from 'mongoose';

async function test() {
  try {
    await mongoose.connect('mongodb://localhost:27017/collabcode');
    console.log('MongoDB Connected!');
    process.exit(0);
  } catch (e) {
    console.error('MongoDB Error:', e.message, e.code);
    process.exit(1);
  }
}
test();
