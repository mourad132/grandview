const mongoose = require("mongoose");
const Schema = mongoose.Schema({
	image: String,
	username: String,
	date: {type: Date, defualt: Date.now},
	comment: String,
});

module.exports = mongoose.model("Comment", Schema);