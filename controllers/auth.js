const User = require('../models/user');
const shortId = require('shortid');
const jwt = require('jsonwebtoken');
const expressJwt = require('express-jwt');
const { errorHandler } = require('../helpers/dbErrorHandler');
const _ = require('lodash');
//nodemailer
const nodemailer = require('nodemailer');

let transport = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD
    }
});

exports.preSignup = (req, res) => {
    const { name, email, password, username } = req.body;
    User.findOne({ email: email.toLowerCase() }, (err, user) => {
        if (user) {
            return res.status(400).json({
                error: 'User with that Email already exists.'
            });
        }
        else {
            User.findOne({ username: username }, (err, user) => {
                if (user) {
                    return res.status(400).json({
                        error: `User with username "${username}" already exists.`
                    });
                }
            })
        }
        const token = jwt.sign({ name, email, password, username }, process.env.JWT_ACCOUNT_ACTIVATION, { expiresIn: '1d' });

        const emailData = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: `Account activation link`,
            html: `
            <p>Please use the following link to activate your acccount:</p>
            <p>${process.env.CLIENT_URL}/auth/account/activate/${token}</p>
            <hr />
            <p>This email may contain sensetive information</p>
            <p>https://protrack.com</p>`
        };

        transport.sendMail(emailData, function (err, info) {
            if (err) {
                return res.json({
                    error: errorHandler(err)
                });
            } else {
                console.log(info);
                return res.json({
                    message: `Email has been sent to ${email}`
                });
            }
        });
    });
};

exports.signup = (req, res) => {
    const token = req.body.token;
    if (token) {
        jwt.verify(token, process.env.JWT_ACCOUNT_ACTIVATION, function (err, decoded) {
            if (err) {
                return res.status(401).json({
                    error: 'Expired link. Please Contact your Administration'
                });
            }

            const { name, email, password, username } = jwt.decode(token);

            User.findOne({ email: email.toLowerCase() }, (err, user) => {
                if (user) {
                    return res.status(400).json({
                        error: 'Account with that Email already exists.Please SignIn'
                    });
                }
                else {
                    User.findOne({ username: username }, (err, user) => {
                        if (user) {
                            return res.status(400).json({
                                error: `User with username "${username}" already exists. Please contact your administration.`
                            });
                        }
                    })
                }
            })

            let profile = `${process.env.CLIENT_URL}/user/profile/${username}`;
            let avatarUrl = `${process.env.CLIENT_URL}/user/photo/${username}`;

            const user = new User({ name, email, password, profile, avatarUrl, username });
            user.save((err, user) => {
                if (err) {
                    return res.status(401).json({
                        error: errorHandler(err)
                    });
                }
                return res.json({
                    message: 'Singup success! Please signin'
                });
            });
        });
    } else {
        return res.json({
            message: 'Something went wrong. Try again'
        });
    }
};

exports.signin = (req, res) => {
    const { email, password } = req.body;
    // check if user exist
    User.findOne({ email }).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User with that email does not exist. Please Contact your Administration.'
            });
        }
        // authenticate
        if (!user.authenticate(password)) {
            return res.status(400).json({
                error: 'Email and password do not match.'
            });
        }
        // generate a token and send to client
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.cookie('token', token, { expiresIn: '1d' });
        const { _id, username, avatarUrl, name, email, role } = user;
        return res.json({
            token,
            user: { _id, username, avatarUrl, name, email, role }
        });
    });
};

exports.signout = (req, res) => {
    res.clearCookie('token');
    res.json({
        message: 'Signout success'
    });
};

exports.requireSignin = expressJwt({
    secret: process.env.JWT_SECRET // req.user
});

exports.authMiddleware = (req, res, next) => {
    const authUserId = req.user._id;
    User.findById({ _id: authUserId }).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User not found'
            });
        }
        req.profile = user;
        next();
    });
};

exports.adminMiddleware = (req, res, next) => {
    const adminUserId = req.user._id;
    User.findById({ _id: adminUserId }).exec((err, user) => {
        if (err || !user) {
            return res.status(400).json({
                error: 'User not found'
            });
        }

        if (user.role !== 1) {
            return res.status(400).json({
                error: 'Admin resource. Access denied'
            });
        }

        req.profile = user;
        next();
    });
};


exports.forgotPassword = (req, res) => {
    const { email } = req.body;

    User.findOne({ email }, (err, user) => {
        if (err || !user) {
            return res.status(401).json({
                error: 'User with that email does not exist'
            });
        }

        const token = jwt.sign({ _id: user._id }, process.env.JWT_RESET_PASSWORD, { expiresIn: '10m' });

        // email
        const emailData = {
            from: '<noreply@protrack.com>',
            to: email,
            subject: `Password reset link`,
            html: `
            <p>Please use the following link to reset your password:</p>
            <p>${process.env.CLIENT_URL}/auth/password/reset/${token}</p>
            <hr />
            <p>This email may contain sensetive information</p>
            <p>https://protrack.com</p>
        `
        };
        // populating the db > user > resetPasswordLink
        return user.updateOne({ resetPasswordLink: token }, (err, success) => {
            if (err) {
                return res.json({ error: errorHandler(err) });
            } else {
                transport.sendMail(emailData, function (err, info) {
                    if (err) {
                        console.log(err)
                        return res.json({ error: errorHandler(err) });
                    } else {
                        console.log(info);
                        return res.json({
                            message: `Email has been sent to ${email}`
                        });
                    }
                });
            }
        });
    });
};

exports.resetPassword = (req, res) => {
    const { resetPasswordLink, newPassword } = req.body;

    if (resetPasswordLink) {
        jwt.verify(resetPasswordLink, process.env.JWT_RESET_PASSWORD, function (err, decoded) {
            if (err) {
                return res.status(401).json({
                    error: 'Expired link. Try again'
                });
            }
            User.findOne({ resetPasswordLink }, (err, user) => {
                if (err || !user) {
                    return res.status(401).json({
                        error: 'Something went wrong. Try later'
                    });
                }
                const updatedFields = {
                    password: newPassword,
                    resetPasswordLink: ''
                };

                user = _.extend(user, updatedFields);

                user.save((err, result) => {
                    if (err) {
                        return res.status(400).json({
                            error: errorHandler(err)
                        });
                    }
                    res.json({
                        message: `Great! Now you can login with your new password`
                    });
                });
            });
        });
    }
};

