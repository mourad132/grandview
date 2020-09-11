var mongoose = require("mongoose");
const moment = require("moment")

var schema = new mongoose.Schema({
    title: String,
    post: String,
	author: {username: String, image: String, id: String},
	comments: [{username: String, created: String, createdTime: String, body: String, image: String}],
	created: String,
	createdTime: String,
});

module.exports = mongoose.model("Post", schema);
