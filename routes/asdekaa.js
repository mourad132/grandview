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

// Routes

app.get('/', (req, res) => {
    res.render('e-landing')
});

app.get('/products', (req, res) => {
    res.render('categories')
});

app.get('/products/:category', (req, res) => {
    Order.create({
        products: [],
        user: 'X-xxx',
        status: 'In Progress'
    }, (err, order) => {
        if(err) throw err;
        res.render('products')
    })
});

app.get('/done', (req, res) => {
    res.render('done')
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
        res.render('checkout', { orders })
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
    res.render('e-login')
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
