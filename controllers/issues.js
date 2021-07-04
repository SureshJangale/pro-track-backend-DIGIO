const Issue = require('../models/issue');
const Project = require('../models/project');

const _ = require('lodash');
const { errorHandler } = require('../helpers/dbErrorHandler');


const getIssuesWithProjectAndStatus = (projectId, status) => {
  Issue.find({ projectId: projectId, status: status },
    (err, issues) => {
      if (err) {
        return [];
      };
      return { issues };
    }
  )
  return [];
}

const calculateListPosition = (projectId, status) => {
  const issues = getIssuesWithProjectAndStatus(projectId, status)

  const listPositions = issues.map(({ listPosition }) => listPosition);

  if (listPositions.length > 0) {
    return Math.min(...listPositions) - 1;
  }
  return 1;
};

exports.createIssue = (req, res) => {

  const { projectId, title, type, status, priority, description, assignees, reporterId } = req.body;

  Project.findById(projectId, (err, project) => {
    if (err) {
      return res.status(400).json({
        error: 'We are sorry. Something went wrong.'
      });
    } else {
      const listPosition = calculateListPosition(projectId, status);

      let issue = new Issue();
      issue.projectId = projectId;
      issue.title = title;
      issue.type = type;
      issue.status = status;
      issue.priority = priority;
      issue.description = description;
      issue.reporterId = reporterId;
      issue.assignees = assignees;
      issue.listPosition = listPosition;

      let issueCount = project.issues.length;
      let issueId = `${project.slug}-${issueCount}`;
      issue.id = issueId;

      issue.save((err, result) => {
        if (err) {
          return res.status(400).json({
            error: errorHandler(err)
          });
        }
        else {
          Project.findByIdAndUpdate(projectId,
            { $push: { issues: result._id } }, { new: true }).exec(
              (err, result) => {
                if (err) {
                  return res.status(400).json({
                    error: errorHandler(err)
                  });
                } else {
                  res.json({
                    result,
                    message: `Issue created successfully`
                  })
                }
          });
        }
      });
    }
  })
};


exports.getIssue = (req, res) => {
  return res.json(req.issue);
};

exports.getIssueById = (req, res, next, issueId) => {

  Issue.findById(issueId)
    .populate({
      path: 'comments',
      model: 'Comment',
      select: '_id body createdAt issue',
      populate: {
        path: 'user',
        model: 'User',
        select: '_id name avatarUrl'
      }
    })
    .exec((err, data) => {
      if (err) {
        return res.json({
          error: errorHandler(err)
        });
      }
      req.issue = data //adds issue object in req with issue info
      next()
    });
};

exports.updateIssue = (req, res) => {
  let issue = req.issue;  
  issue = _.extend(issue, req.body) //extend - mutate the source object
  issue.save((err) => {
    if (err) {
      return res.status(400).json({
        error: "Something went wrong"
      })
    }
    res.json({ issue });
  })
};

exports.deleteIssue = (req, res, next) => {
  let issue = req.issue
  Project.findByIdAndUpdate(issue.projectId,
    { $pull: { issues: issue._id } }, { new: true }).exec(
      (err, result) => {
        if (err) {
          return res.status(400).json({
            error: errorHandler(err)
          });
        }
      });

  issue.remove((err, issue) => {
    if (err) {
      return res.status(400).json({
        error: err
      })
    }
    res.json({ message: "Issue deleted Successfully" });
  })
}