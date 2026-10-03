const express = require('express');
const complaintController = require('../controllers/complaintController');

const router = express.Router();

router
  .route('/')
  .post(complaintController.createComplaint)
  .get(complaintController.getComplaints);

router.patch('/:id/status', complaintController.updateComplaintStatus);
router
  .route('/:id')
  .get(complaintController.getComplaintById)
  .put(complaintController.updateComplaint)
  .delete(complaintController.deleteComplaint);

module.exports = router;