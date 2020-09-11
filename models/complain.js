const mongoose = require("mongoose");

const Schema = mongoose.Schema({
	title: String,
	image: String,
	body: String,
	created: String,
	createdTime: String,
	author: {image: String, username: String, id: String},
	type: String,
	comments: [{username: String, created: String, createdTime: String, body: String, image: String}],
})

module.exports = mongoose.model("Complain", Schema)