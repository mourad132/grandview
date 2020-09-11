const mongoose = require("mongoose");
const Schema = mongoose.Schema({
	image: String,
	vote: Boolean,
	agree: 0,
	disagree: 0,
	body: String,
	title: String,
	author: {image: String, username: String, id: String},
	comments: [{username: String, created: String, createdTime: String, body: String, image: String}],
	created: String, 
	yes: 0,
	no: 0,
	createdTime: String,
	voteBy: String,
	voteArr: [],
})

module.exports = mongoose.model("Suggestion", Schema)