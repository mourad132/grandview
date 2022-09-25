// Node Modules

const express = require('express');
const app = express.Router();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const localStrategy = require('passport-local');
const session = require('express-session');

// Helper

function ensureAdmin(req, res, next){
    if(req.user.status == 'admin'){
        return next()
    }
    res.redirect('/login')
}

// Local Models

const Order = require('../models/asdekaa/Order.js');
const Products = require('../models/asdekaa/Products.js');
const History = require('../models/asdekaa/History.js');
const Admin = require('../models/asdekaa/Admin.js');

// App Configuration

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.set('view engine', 'ejs');

//Passport Configuration

passport.use(new localStrategy(function verify(username, password, done){
    Admin.findOne({ username }, (err, admin) => {
    if(err) throw done(null, false, err);
    if(admin == null) return done(null, false, "Invalid Username Or Password")
    if(admin.password == null) return done(null, false, 'Invalid Username Or Password')
    if(admin.password == password) { 
        return done(null, admin)
    } else {
        return done(null, false, 'Invalid Username Or Password')
    }
})
}));

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    cb(null, { id: user.id, username: user.username, status: user.status });
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});

// Session Configuration
app.use(session({
  secret: 'this is a secret that no one will know',
  resave: false,
  saveUninitialized: false,
}))

//Connect To Database
mongoose.connect('mongodb://localhost:27017/El-Asdekaa');

// Routes

app.get('/', (req, res) => {
    res.render('/asdekaa/landing')
});

app.get('/products', (req, res) => {
    res.render('/asdekaa/categories')
});

app.get('/products/:category', (req, res) => {
    Order.create({
        products: [],
        user: 'X-xxx',
        status: 'In Progress'
    }, (err, order) => {
        if(err) throw err;
        res.render('/asdekaa/products')
    })
});

app.get('/done', (req, res) => {
    res.render('/asdekaa/done')
});

app.post('/cart/:id', (req, res) => {
    Order.findOne({ user: 'X-xxx' }, (err, order) => {
        if(err) throw err;
        order.products.push(...req.body)
    })
    res.redirect('/checkout')
});

app.get('/checkout/:id', (req, res) => {
    Order.findById(req.params.id, (err, orders) => {
        if(err) throw err;
        res.render('/asdekaa/checkout', { orders })
    })
});

app.post('/checkout/:id', (req, res) => {
    Order.findById(req.params.id, (err, order) => {
        if(err) throw err;
        order.status = 'Completed';
        order.save()
        res.redirect('/done')
    });
});

app.get('/view-orders', ensureAdmin, (req, res) => {
    Order.find({ status: 'Completed' }, (err, found) => {
        if(err) throw err;
        res.send(found)
    })
})

app.post('/login', passport.authenticate('local', {
    successRedirect: '/view-orders',
    failureRedirect: '/login'
}));

app.get('/login', (req, res) => {
    res.render('/asdekaa/login')
})

app.get('/checked/:id', ensureAdmin, (req, res) => {
    Order.findOneAndDelete({ _id: req.params.id }, (err, deleted) => {
        if(err) throw err;
        History.create(deleted, (err, history) => {
            if(err) throw err;
            res.redirect('/view-orders')
        })
    })
});

app.get('/history', (req, res) => {
    res.render('history')
})

app.delete('/delete/:id', ensureAdmin, (req, res) => {
    History.findOneAndDelete({ _id: req.params.id }, (err, deleted) => {
        if(err) throw err;
        res.redirect('/history')
    })
});


// Export App

module.exports = app
