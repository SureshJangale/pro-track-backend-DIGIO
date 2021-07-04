const User = require('../models/user');
const _ = require('lodash');
const formidable = require('formidable');
const fs = require('fs');
const { errorHandler } = require('../helpers/dbErrorHandler');


exports.privateProfile = (req, res) => {
  req.profile.hashed_password = undefined;
  return res.json(req.profile);
};

exports.publicProfile = (req, res) => {
  let username = req.params.username;
  User.findOne({ username }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: 'User not found'
      });
    }
    user.hashed_password = undefined;
    user.salt = undefined;
    user.photo = undefined;
    res.json(user)
  });
};

exports.update = (req, res) => {
  let user = req.profile;
  user = _.extend(user, req.body);

  user.save((err, result) => {
    if (err) {
      return res.status(400).json({
        error: errorHandler(err)
      });
    }
    user.hashed_password = undefined;
    user.salt = undefined;
    user.photo = undefined;
    res.json(user);
  });
};

exports.updatePhoto = (req, res) => {
  let form = new formidable.IncomingForm();

  form.keepExtension = true;
  form.parse(req, (err, fields, files) => {
    console.log(err);
    
    if (err) {
      return res.status(400).json({
        error: 'Photo could not be uploaded'
      });
    }
    let user = req.profile;

    if (files.photo) {
      if (files.photo.size > 10000000) {
        return res.status(400).json({
          error: 'Image should be less than 1mb'
        });
      }
      user.photo.data = fs.readFileSync(files.photo.path);
      user.photo.contentType = files.photo.type;
    }

    user.save((err, result) => {
      if (err) {
        return res.status(400).json({
          error: errorHandler(err)
        });
      }
      user.hashed_password = undefined;
      user.salt = undefined;
      user.photo = undefined;
      res.json(user);
    });
  });
};

exports.photo = (req, res) => {
  const username = req.params.username;
  User.findOne({ username }).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: 'User not found'
      });
    }
    if (user.photo.data) {
      res.set('Content-Type', user.photo.contentType);
      return res.send(user.photo.data);
    }
  });
};

exports.userById = (req, res, next, userId) => {
  User.findById(userId)
    .exec((err, user) => {
      if (err || !user) {
        return res.status(400).json({
          error: "User not found"
        })
      }
      req.profile = user //adds profile object in req with user info
      next()
    })
}

exports.allUsers = (req, res) => {
  User.find((err, users) => {
    if (err) {
      return res.status(400).json({
        error: err
      })
    }
    res.json(users);
  }).select("_id name email username profile avatarUrl updated created")
}

exports.getUser = (req, res) => {
  req.profile.hashed_password = undefined
  req.profile.salt = undefined
  req.profile.photo = undefined
  return res.json(req.profile);
}

exports.deleteUser = (req, res, next) => {
  let user = req.profile
  user.remove((err, user) => {
    if (err) {
      return res.status(400).json({
        error: err
      })
    }
    user.hashed_password = undefined;
    user.salt = undefined;
    res.json({ message: "User deleted Successfully" });
  })
}