const mongoose = require("mongoose");

const Schema = mongoose.Schema({
	title: String,
	image: String,
	body: String,
	created: String,
	createdTime: String,
	author: {image: String, username: String, id: String},
	type: String,
	comments: [],
	reserveUser: [],
})

module.exports = mongoose.model("Service", Schema)