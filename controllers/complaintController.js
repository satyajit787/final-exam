const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');

const categories = ['Infrastructure', 'IT', 'Cleanliness', 'Security', 'Other'];
const priorities = ['Low', 'Medium', 'High'];
const statuses = ['Open', 'In Progress', 'Resolved', 'Rejected'];
const editableFields = [
	'studentName',
	'email',
	'title',
	'description',
	'category',
	'priority',
	'location',
];
const createFields = [...editableFields];

function sendError(res, statusCode, message) {
	return res.status(statusCode).json({ success: false, message });
}

function hasValidId(id) {
	return mongoose.Types.ObjectId.isValid(id);
}

function escapeRegex(value) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isObjectBody(body) {
	return body !== null && typeof body === 'object' && !Array.isArray(body);
}

exports.createComplaint = async (req, res) => {
	if (!isObjectBody(req.body)) {
		return sendError(res, 400, 'Request body must be a JSON object');
	}

	const requiredFields = ['studentName', 'email', 'title', 'description', 'category', 'priority'];
	const missingFields = requiredFields.filter(
		(field) => typeof req.body[field] !== 'string' || !req.body[field].trim()
	);

	if (missingFields.length) {
		return sendError(res, 400, `Missing required fields: ${missingFields.join(', ')}`);
	}

	const complaint = await Complaint.create({
		...Object.fromEntries(
			createFields
				.filter((field) => req.body[field] !== undefined)
				.map((field) => [field, req.body[field]])
		),
		status: 'Open',
	});

	return res.status(201).json({
		success: true,
		message: 'Complaint created successfully',
		data: complaint,
	});
};

exports.getComplaints = async (req, res) => {
	const filters = [
		['status', statuses],
		['category', categories],
		['priority', priorities],
	];

	for (const [field, allowedValues] of filters) {
		const value = req.query[field];
		if (value !== undefined && (typeof value !== 'string' || !allowedValues.includes(value))) {
			return sendError(res, 400, `Invalid ${field} filter`);
		}
	}

	const query = {};
	for (const [field] of filters) {
		if (req.query[field] !== undefined) query[field] = req.query[field];
	}

	if (req.query.search !== undefined) {
		if (typeof req.query.search !== 'string') {
			return sendError(res, 400, 'Search must be a single string');
		}
		const search = req.query.search.trim();
		if (search) {
			const pattern = new RegExp(escapeRegex(search), 'i');
			query.$or = [{ title: pattern }, { studentName: pattern }];
		}
	}

	const complaints = await Complaint.find(query).sort({ createdAt: -1 });
	return res.status(200).json({
		success: true,
		message: 'Complaints retrieved successfully',
		data: complaints,
	});
};

exports.getComplaintById = async (req, res) => {
	if (!hasValidId(req.params.id)) return sendError(res, 400, 'Invalid complaint ID');

	const complaint = await Complaint.findById(req.params.id);
	if (!complaint) return sendError(res, 404, 'Complaint not found');

	return res.status(200).json({
		success: true,
		message: 'Complaint retrieved successfully',
		data: complaint,
	});
};

exports.updateComplaint = async (req, res) => {
	if (!hasValidId(req.params.id)) return sendError(res, 400, 'Invalid complaint ID');
	if (!isObjectBody(req.body)) return sendError(res, 400, 'Request body must be a JSON object');

	const unsupportedFields = Object.keys(req.body).filter((field) => !editableFields.includes(field));
	if (unsupportedFields.length) {
		return sendError(res, 400, `Fields cannot be updated here: ${unsupportedFields.join(', ')}`);
	}

	const updates = Object.fromEntries(
		Object.entries(req.body).filter(([field]) => editableFields.includes(field))
	);
	if (!Object.keys(updates).length) return sendError(res, 400, 'No editable fields provided');

	const complaint = await Complaint.findByIdAndUpdate(req.params.id, updates, {
		new: true,
		runValidators: true,
	});
	if (!complaint) return sendError(res, 404, 'Complaint not found');

	return res.status(200).json({
		success: true,
		message: 'Complaint updated successfully',
		data: complaint,
	});
};

exports.updateComplaintStatus = async (req, res) => {
	if (!hasValidId(req.params.id)) return sendError(res, 400, 'Invalid complaint ID');
	if (!isObjectBody(req.body) || !statuses.includes(req.body.status)) {
		return sendError(res, 400, `Status must be one of: ${statuses.join(', ')}`);
	}

	const complaint = await Complaint.findByIdAndUpdate(
		req.params.id,
		{ status: req.body.status },
		{ new: true, runValidators: true }
	);
	if (!complaint) return sendError(res, 404, 'Complaint not found');

	return res.status(200).json({
		success: true,
		message: 'Complaint status updated successfully',
		data: complaint,
	});
};

exports.deleteComplaint = async (req, res) => {
	if (!hasValidId(req.params.id)) return sendError(res, 400, 'Invalid complaint ID');

	const complaint = await Complaint.findByIdAndDelete(req.params.id);
	if (!complaint) return sendError(res, 404, 'Complaint not found');

	return res.status(200).json({
		success: true,
		message: 'Complaint deleted successfully',
		data: complaint,
	});
};
