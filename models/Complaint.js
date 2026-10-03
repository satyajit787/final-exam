const mongoose = require('mongoose');

const categories = ['Infrastructure', 'IT', 'Cleanliness', 'Security', 'Other'];
const priorities = ['Low', 'Medium', 'High'];
const statuses = ['Open', 'In Progress', 'Resolved', 'Rejected'];

const complaintSchema = new mongoose.Schema(
	{
		studentName: { type: String, required: true, trim: true },
		email: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
			match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
		},
		title: { type: String, required: true, trim: true },
		description: { type: String, required: true, trim: true },
		category: { type: String, enum: categories, required: true },
		priority: { type: String, enum: priorities, required: true },
		location: { type: String, trim: true, default: '' },
		status: { type: String, enum: statuses, default: 'Open' },
	},
	{ timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
