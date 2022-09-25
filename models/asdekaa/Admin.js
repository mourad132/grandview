const mongoose = require('mongoose');
const Schema = mongoose.Schema({
    username: String,
    password: String,
    status: String,
})

module.exports = mongoose.model('Admin', Schema)