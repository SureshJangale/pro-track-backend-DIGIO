const Comment = require('../models/comment');
const Issue = require('../models/issue');
const _ = require('lodash');

const { errorHandler } = require('../helpers/dbErrorHandler');


exports.createComment = (req, res) => {

  const { body, userId, issueId } = req.body;

  let comment = new Comment();
  comment.body = body;
  comment.user = userId;
  comment.issue = issueId;

  comment.save((err, result) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err)
      });
    }
    Issue.findByIdAndUpdate(issueId,
      { $push: { comments: result._id } }, { new: true }).exec(
        (err, result) => {
          if (err) {
            return res.status(400).json({
              error: errorHandler(err)
            });
          } else {
            res.json({
              result,
              message: `Comment created successfully`
            })
          }
        });
  });
};

exports.getComment = (req, res) => {
  return res.json(req.comment);
};

exports.getCommentById = (req, res, next, commentId) => {

  Comment.findById(commentId)
    .populate('user', '_id avatarUrl name')
    .populate('issue', '_id')
    .select('_id body user issue createdAt updatedAt')
    .exec((err, data) => {
      if (err) {
        return res.json({
          error: errorHandler(err)
        });
      }
      req.comment = data //adds comment object in req with comment info
      next()
    });
};


exports.updateComment = (req, res) => {
  let comment = req.comment;
  
  comment = _.extend(comment, req.body) //extend - mutate the source object
  comment.save((err) => {
    if (err) {
      return res.status(400).json({
        error: "Something went wrong"
      })
    }
    res.json({ comment });
  })
};

exports.deleteComment = (req, res, next) => {
  let comment = req.comment
  comment.remove((err, comment) => {
      if (err) {
          return res.status(400).json({
              error: err
          })
      }
      res.json({ message: "Comment deleted Successfully" });
  })
}