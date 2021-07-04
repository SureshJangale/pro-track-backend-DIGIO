const express = require('express');
const router = express.Router();
const { requireSignin, authMiddleware, adminMiddleware } = require('../controllers/auth');
const {
    update,
    photo,
    allUsers,
    deleteUser,
    privateProfile,
    publicProfile,
    userById,
    updatePhoto
} = require('../controllers/user');

// router.get('/user/my-profile', requireSignin, authMiddleware, privateProfile)
router.get('/user/:username', requireSignin, authMiddleware, publicProfile)

router.put('/user/update', requireSignin, authMiddleware, update);
router.delete('/user/:userId', requireSignin, adminMiddleware, deleteUser) //only admin can delete the user

router.get('/users', requireSignin, authMiddleware, allUsers)

router.get('/user/photo/:username', photo);
router.put('/user/photo/:username', requireSignin, authMiddleware, updatePhoto);


//any route containing :userId, our app will first execute userById()
router.param("userId", userById)

module.exports = router;
