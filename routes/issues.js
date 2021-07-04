const express = require('express');
const router = express.Router();
const { requireSignin, authMiddleware } = require('../controllers/auth');
const { createIssue, getIssue, updateIssue, getIssueById, deleteIssue } = require('../controllers/issues');

router.post('/create-issue', requireSignin, authMiddleware, createIssue);
router.get('/issues/:issueId', requireSignin, authMiddleware, getIssue);
router.put('/issues/:issueId', requireSignin, authMiddleware, updateIssue);
router.delete('/issues/:issueId', requireSignin, authMiddleware, deleteIssue);

//any route containing :issueId, our app will first execute getIssueById()
router.param("issueId", getIssueById);

module.exports = router;
