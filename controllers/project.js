const Project = require('../models/project');
const Issue = require('../models/issue');
const User = require('../models/user');

const _ = require('lodash');
const slugify = require('slugify');
const { errorHandler } = require('../helpers/dbErrorHandler');


exports.createProject = (req, res) => {
  const { title, slug, description, category, createdBy, users } = req.body;

  Project.findOne({ title: title }, (err, data) => {
    if (data) {
      return res.status(400).json({
        error: 'Project with that title already exists.'
      });
    } else {
      Project.findOne({ slug: slug }, (err, data) => {
        if (data) {
          return res.status(400).json({
            error: `Project with the key "${slug}" already exists.`
          });
        }
      })
    }

    let project = new Project();
    project.title = title;
    project.description = description;
    project.slug = slugify(slug);
    project.ownerId = null;
    project.createdBy = createdBy;
    project.category = category; //need validation
    project.users = users;

    project.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err)
        });
      }
      else {
        res.json({
          result,
          message: `Project "${title}" with key "${slug}" created successfully.`
        });
      }
    });
  })
};


exports.getProject = (req, res) => {
  return res.json(req.project);
};

exports.getProjectById = ({ projectId }) => {

  Project.findById({ projectId })
    .exec((err, data) => {
      if (err) {
        return res.json({
          error: errorHandler(err)
        });
      }
      res.json(data);
    })
};

exports.getProjectBySlug = (req, res, next, slug) => {

  Project.findOne({ slug })
    .populate('users', '_id name email avatarUrl profile')
    .populate('issues', '_id projectId title description estimate type status priority reporterId listPosition assignees createdAt updatedAt dateDue timespent')
    .select('_id title description slug category ownerId users issues')
    .exec((err, data) => {
      if (err) {
        return res.json({
          error: errorHandler(err)
        });
      }
      req.project = data //adds project object in req with project info
      next()
    })
};


exports.updateProject = (req, res) => {
  let project = req.project

  project = _.extend(project, req.body) //extend - mutate the source object
  project.save((err) => {
    if (err) {
      return res.status(400).json({
        error: "Something went wrong"
      })
    }
    res.json({ project });
  })
};

exports.deleteProject = (req, res, next) => {
  let project = req.project
  project.remove((err, project) => {
    if (err) {
      return res.status(400).json({
        error: err
      })
    }
    res.json({ message: "Project deleted Successfully" });
  })
}

exports.getIssuesSearch = (req, res) => {
  const { searchTerm } = req.query;
  const { _id } = req.project;
  if (searchTerm) {
    Issue.find(
      {
        $and: [{ projectId: _id, $or: [{ title: { $regex: searchTerm, $options: 'i' } }, { description: { $regex: searchTerm, $options: 'i' } }] }]
      },
      (err, issues) => {
        if (err) {
          return res.status(400).json({
            error: errorHandler(err)
          });
        }
        res.json(issues);
      }
    )
  }
};

exports.getAllProjects = (req, res) => {
  Project.find({})
    .populate('users', '_id name email profile')
    .populate('issues', '_id projectId title description estimate type status priority reporterId listPosition assignees createdAt updatedAt dateDue timespent')
    .select('_id title description slug category ownerId users issues updatedAt')
    .exec((err, data) => {
      if (err) {
        return res.json({
          error: errorHandler(err)
        });
      }
      res.json(data);
    })
};

exports.getProjectsByUserId = (req, res) => {
  const userId = req.params.userId;
  Project.find({})
    .select('_id title slug users createdAt')
    .exec((err, projects) => {
      if (err) {
        return res.json({
          error: errorHandler(err)
        });
      }
      else {
        if (projects.length > 0) {
          projects = projects.filter(project => project.users.includes(userId))
          res.json(projects);
        }
        else res.json([]);
      }
    })
}

