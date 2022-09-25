const mongoose = require('mongoose');
const Schema = mongoose.Schema({
    products: Array,
    user: String,
    status: String
})

module.exports = mongoose.model('Order', Schema)