const mongoose = require('mongoose');

async function connectDB() {
	const mongoUri =
		process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/campus_complaints';
	await mongoose.connect(mongoUri);
	console.log('MongoDB connected');
}

module.exports = connectDB;
