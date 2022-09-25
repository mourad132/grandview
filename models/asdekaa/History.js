const mongoose = require('mongoose');
const Schema = mongoose.Schema({
    products: Array,
    user: String
})

module.exports = mongoose.model('History', Schema)