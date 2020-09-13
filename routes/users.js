const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
// Load User model
const User = require('../models/User');
const { forwardAuthenticated } = require('../config/auth');
const { isDev } = require('../config/auth');


// Login Page
router.get('/login', forwardAuthenticated, (req, res) => res.render('login'));

// Register Page
router.get('/register', (req, res) => {
	res.render("register")
})

// Register
router.post('/register', (req, res) => {
	  const { name, email, bio, password, password2, username, apartment, number, pass } = req.body;
  let errors = [];

  if (!name || !username || !apartment || !email || !password || !password2 || !pass) {
    errors.push({ msg: 'Please enter all fields' });
  }	

  if (password != password2) {
    errors.push({ msg: 'Passwords do not match' });
  }

  if(pass != "grandview4532"){
	  errors.push("Registeration Password Is Not Valid, Please Contact The Developer To Get It")
  }
  if (password.length < 6) {
    errors.push({ msg: 'Password must be at least 6 characters' });
  }
  if(bio == undefined){
  	bio = ''
  }
  if (errors.length > 0) {
    res.render('register', {
          errors,
          name,
          email,
          password,
          password2,
	  bio,
	  number,
	  apartment,
	  username,
	  pass,
    });
  } else {
    User.findOne({ email: email }).then(user => {
      if (user) {
        errors.push({ msg: 'Email already exists' });
        res.render('register', {
          errors,
          name,
          email,
          password,
          password2,
	  bio,
	  apartment,
	  username,
	  pass,
	  number,
        });
      } else {
        const newUser = new User({
          name,
          email,
          password,
		  bio,
		  username,
		  apartment,
		  number,
		photo: "7f03fb0337f736dbac24841dcc5257a7.jpg",
        });

        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newUser.password, salt, (err, hash) => {
            if (err) throw err;
            newUser.password = hash;
            newUser
              .save()
              .then(user => {
                req.flash(
                  'success_msg',
                  'You are now registered and can log in'
                );
                res.redirect('/users/login');
              })
              .catch(err => console.log(err));
          });
        });
      }
    });
  }  
  });

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

// Logout
router.get('/logout', (req, res) => {
  			req.logout();
  			res.redirect('/');
});

module.exports = router;
