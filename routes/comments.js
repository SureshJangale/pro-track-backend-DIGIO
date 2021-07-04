const express = require('express');
const router = express.Router();
const { requireSignin, authMiddleware } = require('../controllers/auth');
const { createComment, getComment, updateComment, getCommentById, deleteComment } = require('../controllers/comments');

router.post('/create-comment', requireSignin, authMiddleware, createComment);
router.get('/comments/:commentId', requireSignin, authMiddleware, getComment);
router.put('/comments/:commentId', requireSignin, authMiddleware, updateComment);
router.delete('/comments/:commentId', requireSignin, authMiddleware, deleteComment);

//any route containing :slug, our app will first execute getCommentById()
router.param("commentId", getCommentById);

module.exports = router;
