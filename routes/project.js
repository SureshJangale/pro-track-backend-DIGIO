const express = require('express');
const router = express.Router();
const { requireSignin, authMiddleware, adminMiddleware } = require('../controllers/auth');
const {
    createProject,
    getProject,
    updateProject,
    getProjectBySlug,
    deleteProject,
    getIssuesSearch,
    getAllProjects,
    getProjectsByUserId
} = require('../controllers/project');

router.post('/create-project', requireSignin, adminMiddleware, createProject);
router.get('/project/:slug', requireSignin, authMiddleware, getProject);
router.put('/project/:slug', requireSignin, adminMiddleware, updateProject);
router.delete('/project/:slug', requireSignin, adminMiddleware, deleteProject);

router.get('/project/:slug/issues', requireSignin, authMiddleware, getIssuesSearch);
router.get('/projects', requireSignin, authMiddleware, getAllProjects);
router.get('/projects/:userId', requireSignin, authMiddleware, getProjectsByUserId);


//any route containing :slug, our app will first execute getProjectBySlug()
router.param("slug", getProjectBySlug);

module.exports = router;
