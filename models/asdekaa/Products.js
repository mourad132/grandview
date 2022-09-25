const mongoose = require('mongoose');
const Schema = mongoose.Schema({
    name: String,
    price: Number,
});

module.exports = mongoose.model("Products", Schema)