//Node Modules
var express = require("express");
const sanitizer  = require('sanitizer');
var mongoose = require("mongoose");
var bodyParser = require("body-parser");
const path = require('path');
const crypto = require('crypto');
const moment = require('moment')
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
var passport = require("passport");
var methodOverride = require("method-override");
const expressLayouts = require('express-ejs-layouts');
const flash = require('connect-flash');
const session = require('express-session');
var passportLocalMongoose = require("passport-local-mongoose");
var localStrategy = require("passport-local").Strategy;
var app = express();

//Local Models
var { ensureAuthenticated } = require("./config/auth.js");
var Post = require("./models/post.js");
var User = require('./models/User.js');
const Service = require("./models/service.js");
const Event = require('./models/event.js');
const Suggestion = require("./models/suggestion.js");
const Complain = require("./models/complain.js")


//Momentjs Config
moment().format();
moment.locale();
const time = moment().startOf('hour').fromNow(); 

//Mongoose Config
mongoose.set('useFindAndModify', false);
mongoose.connect('mongodb+srv://kbibi:Mrgamer1017$@cluster0-pkbkj.mongodb.net/Cluster0?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true})
var conn = mongoose.createConnection('mongodb+srv://kbibi:Mrgamer1017$@cluster0-pkbkj.mongodb.net/Cluster0?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true});

// Passport Config
require('./config/passport')(passport);

//App Config
app.use(bodyParser.urlencoded({ extended: true}))
app.use(bodyParser.json())
app.set("view engine", "ejs");
app.use(methodOverride("_method"))
app.locals.moment = require("moment");
// EJS
app.use(expressLayouts);
app.set('view engine', 'ejs');

// Express body parser
app.use(express.urlencoded({ extended: true }));

// Express session
app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Connect flash
app.use(flash());

// Global variables
app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Routes

// "/users" ROUTES
app.use('/users', require('./routes/users.js'));

//LANDING PAGE @GET
app.get('/', (req, res) => {
	res.render('beta', {page: "Landing", user: req.user})
})

//HOME PAGE @GET
app.get("/home", ensureAuthenticated, (req, res) => {
	Suggestion.find({}, (err, found) => {
		if(err){
			console.log(err)
		} else {
			Post.find({}, (err, posts) => {
				if(err){
					console.log(err)
				} else {
					Complain.find({}, (err, complains) => {
						if(err){
							console.log(err)
						} else {
							Service.find({}, (err, services) => {
								if(err){
									console.log(err)
								} else {
									Event.find({}, (err, events) => {
										if(err){
											console.log(err)
										} else {
											const invsuggestion = found.reverse();
											const invposts = posts.reverse();
											const invcomplain = complains.reverse();
											const invservice = services.reverse();
											const invevents = events.reverse(); 
											res.render("home", {suggestions: invsuggestion, posts: invposts, complains: invcomplain, 												services: invservice, events: invevents, user: req.user, page: "home"})
										}
									})
								}
							})
						}
					})
				}
			})
		}
	})
})

//NEW ROUTE @GET
app.get("/new", ensureAuthenticated, (req, res) => {
	res.render("new")
})

//NEW POST ROUTE @GET
app.get('/new/post', ensureAuthenticated, function(req, res){
    res.render("post", {page: "New Post"})
})

//NEW ROUTE @POST
app.post('/new/post', ensureAuthenticated, function(req, res){
	Post.create({
		title: req.body.title,
		post: req.body.post,
		image: req.body.image,
		author: {image: req.user.photo, username: req.user.username, id: req.user._id},
		created: req.body.created,
		createdTime: req.body.createdTime,
	})
	res.redirect("/home")
})

//NEW SUGGESTION ROUTE @GET
app.get('/new/suggestion', ensureAuthenticated, (req, res) => {
	res.render("suggestion", {page: "New Suggestion"})
})

//SUGGESTION ROUTE @POST
app.post("/new/suggestion", (req, res) => {
		Suggestion.create({
			image: req.body.image,
			agree: 0,
			disagree: 0,
			body: req.body.body,
			title: req.body.title,
			author: {image: req.user.photo, username: req.user.username, id: req.user._id},
			commentsNum: 0,
			created: req.body.created, 
			createdTime: req.body.createdTime,
			vote: true,
			voteBy: req.body.voteBy,
			voters: [],
			comments: [],
		})
	res.redirect('/home')
})

//SUGGESTIONS ROUTE @GET
app.get('/suggestions', (req, res) => {
	Suggestion.find({}, (err, found) => {
		if(err){
			console.log(err)
		} else {
			res.render("suggestions", {suggestions: found, page: "Suggestions"})
		}
	})
})

//COMMENTS ROUTE @POST
app.post('/comment/:type/:id', ensureAuthenticated, (req, res) => {
	let schema;
	if(req.params.type == "Post"){
		schema = Post;
	} else if(req.params.type == "Suggestion"){
		schema = Suggestion;
	} else if(req.params.type == "Event"){
		schema = Event
	} else if(req.params.type == "Complain"){
		schema = Complain 
	} else {
		res.sendStatus(400)
	}
	schema.findById(req.params.id, (err, found) => {
		if(err){
			console.log(err)
		} else {
			found.comments.push({username: req.user.username, image: req.user.photo, body: req.body.comment, created: 					req.body.created, createdTime: req.body.createdTime})
			found.save()
			res.redirect("/home#" + req.params.id)
		}
})
})

app.post('/service/comment/:id', (req, res) => {
	Service.findById(req.params.id, (err, found) => {
			if(err){
				console.log(err)
			} else {
				found.comments.push({username: req.user.username, image: req.user.photo, body: req.body.comment, created:
				req.body.created, createdTime: req.body.createdTime})
				res.redirect("/home")
				found.save()
			}
})
})

//EDIT ROUTE @GET
app.get("/edit/:type/:id", ensureAuthenticated, function(req, res){
	if(req.params.type == "post"){
		Post.findById(req.params.id, function(err, found){
			if(err){
				console.log(err)
			} else {
				res.render('edit', {post: found, page: "Edit Post"})
			}
		})
	} else if(req.params.type == "service"){
		Service.findById(req.params.id, function(err, found){
			if(err){
				console.log(err)
			} else {
				res.render('edit', {post: found, page: "Edit Post"})
			}
		})
	} else if(req.params.type == "suggestion"){
		Suggestion.findById(req.params.id, function(err, found){
			if(err){
				console.log(err)
			} else {
				res.render('edit', {post: found, page: "Edit Post"})
			}
		})
	} else if(req.params.type == "event"){
		Event.findById(req.params.id, function(err, found){
			if(err){
				console.log(err)
			} else {
				res.render('edit', {post: found, page: "Edit Post"})
			}
		})
	} else if(req.params.type == "complain"){
		Complain.findById(req.params.id, function(err, found){
			if(err){
				console.log(err)
			} else {
				res.render('edit', {post: found, page: "Edit Post"})
			}
		})
	}
})

//RESERVE ROUTE @POST
app.post('/reserve/:type/:id', (req, res) => {
	if(req.params.type == 'event'){
		Event.findById(req.params.id, (err, found) => {
			if(found.reserveUser.indexOf(req.user) == -1){
				found.reserveUser.push(req.user);
				found.save()
				res.redirect("/home")
			} else {
				res.sendStatus(400)
			}
		})
	} else if(req.params.type == "service"){
		Service.findById(req.params.id, (err, found) => {
		if(err){
			console.log(err)
		} else {
			if(found.reserveUser.indexOf(req.user) == -1){
				found.reserveUser.push(req.user);
				found.save()
				res.redirect('/home')
			} else {
				res.sendStatus(400)
			}
		}
	})
	} else {
		res.sendStatus(400)
	}
})

//RESERVERS PAGE @GET
app.get("/reservers/:type/:id", (req, res) => {
	if(req.params.type == "service"){
		Service.findById(req.params.id, (err, found) => {
			if(err){
				console.log(err)
			} else {
				res.render("reservers", {profiles: found.reserveUser, page: "Edit Post"})
			}
		})
	} else if(req.params.type == "event"){
		Event.findById(req.params.id, (err, found) => {
			if(err){
				console.log(err)
			} else {
				res.render('reservers', {profiles: found.reserveUser, page: "Reserved Users"})
			}
		})
	}
})

//VOTERS ROUTE @GET
app.get('/voters/:id', (req, res) => {
	let yes = 0;
	let no = 0;
	let undef;
	Suggestion.findById(req.params.id, (err, found) => {
		found.voteArr.forEach(vote => {
			if(vote.vote == "yes"){
				yes = yes + 1
			} else if(vote.vote == "no"){
				no = no + 1
			} else {
				undef = undefined
			}
		})
		res.render("voters", {yes: yes, no: no, page: "Voters"})
	})
})

//VOTE ROUTE @POST
app.post('/vote/:type/:id', (req, res) => {
	Suggestion.findById(req.params.id, (err, found) => {
		if(err){
			console.log(err)
		} else {
			if(found.voteBy == "Person"){
				if(found.voteArr.indexOf(req.user._id) == -1){
					found.voteArr.push(req.user._id)
					found.voteArr.push({user: req.user._id, vote: req.params.type, id: req.user._id})
					found.save()
					res.redirect('/home')
				} else {
					res.sendStatus(400)
				}
			} else if(found.voteBy== "Unit"){
				if(found.voteArr.indexOf(req.user.apartment) == -1){
					found.voteArr.push(req.user.apartment)
					found.voteArr.push({user: req.user.apartment, vote: req.params.type, id: req.user._id})
					found.save()
					res.redirect('/home')
				} else {
					res.sendStatus(400)
				}
			} else {
				res.sendStatus(500)
			}
				
		}
	})
})

//COMPLAIN STATUS ROUTE @GET
app.get("/complain/status/:id", (req, res) => {
	Complain.findById(req.params.id, (err, found) => {
		if(err){
			console.log(err)
		} else {
			res.render("status", {status: found.status})
		}
	})
})

//DELETE ROUTE @DELETE
app.delete("/delete/:type/:id", (req, res) => {
	if(req.params.type == "suggestion"){
		Suggestion.findByIdAndDelete(req.params.id, (err, found) => {
			if(err){
				console.log(err)
			} else {
				res.redirect("/home#" + req.params.type)
			}
		})
	} else if(req.params.type == "complain"){
		Complain.findByIdAndDelete(req.params.id, (err, found) => {
			if(err){
				console.log(err)
			} else {
				res.redirect("/home#" + req.params.type)
			}
		})
	} else if(req.params.type == "service"){
		Service.findByIdAndDelete(req.params.id, (err, found) => {
			if(err){
				console.log(err)
			} else {
				res.redirect("/home#" + req.params.type)
			}
		})
	} else if(req.params.type == "event"){
		Event.findByIdAndDelete(req.params.id, (err, found) => {
			if(err){
				console.log(err)
			} else {
				res.redirect("/home#" + req.params.type)
			}
		})
	} else if(req.params.type == "post"){
		Post.findByIdAndDelete(req.params.id, (err, found) => {
			if(err){
				console.log(err)
			} else {
				res.redirect("/home#" + req.params.type)
			}
		})
	} else {
		res.sendStatus(400)
	}
})

//COMPLAIN FINISHING ROUTE @GET
app.get('/done/:id', (req, res) => {
	Complain.findById(req.params.id, (err, found) => {
		if(err){
			console.log(err)
		} else {
			found.status = 'Done';
			found.save()
		}
	})
})

//NEW COMPLAIN @POST
app.post("/new/complain", (req, res) => {
	Complain.create({
	title: req.body.title,
	body: req.body.body,
	created: req.body.created,
	createdTime: req.body.createdTime,
	author: {image: req.user.photo, username: req.user.username, id: req.user._id},
	type: req.body.type,
	status: 'In Progress',
	// }, (err, complain) => {
	// 	if(err){
	// 		console.log(err)
	// 	} else {
	// 		if(complain.type == "Club House"){
	// 			User.findById("5f5a48aad6156303d43a579b", (err, user) => {
	// 				if(err){
	// 					console.log(err)
	// 				} else {
	// 					user.complainers.push(complain)
		// found.save()
	// 				}
	// 			})
	// 		} else if(complain.type == "Pool"){
	// 			User.findById("5f5a48aad6156303d43a579b", (err, user) => {
	// 				if(err){
	// 					console.log(err)
	// 				} else {
	// 					
	// 					user.complainers.push(complain)
		// found.save()
	// 				}
	// 			})
	// 		} else if(complain.type == "Maintenance"){
	// 			User.findById("5f5a48aad6156303d43a579b", (err, user) => {
	// 				if(err){
	// 					console.log(err)
	// 				} else {
	// 					
	// 					user.complainers.push(complain)
		// found.save()
	// 				}
	// 			})
	// 		}else if(complain.type == "Garden"){
	// 			User.findById("5f5a48aad6156303d43a579b", (err, user) => {
	// 				if(err){
	// 					console.log(err)
	// 				} else {
	// 					
	// 					user.complainers.push(complain)
		// found.save()
	// 				}
	// 			})
	// 		} else if(complain.type == "Security"){
	// 			User.findById("5f5a48aad6156303d43a579b", (err, user) => {
	// 				if(err){
	// 					console.log(err)
	// 				} else {
	// 					
	// 					user.complainers.push(complain)
		// found.save()
	// 				}
	// 			})
	// 		} else {
	// 		res.sendStatus(500)	
	//}
	})
	res.redirect("/home")
})

//COMPLAINERS ROUTE @GET
app.get("/complainers/:id", (req, res) => {
	User.findById(req.params.id, (err, found) => {
		if(err){
			console.log(err)
		} else {
			if(found.complainers){
				res.render("complainers", {complainers: found.complainers})
			} else {
				res.sendStatus(405)
			}
		}
	})
})

//NEW Service @POST
app.post("/new/service", ensureAuthenticated, (req, res) => {
	Service.create({
		title: req.body.title,
		body: req.body.body,
		created: req.body.created,
		createdTime: req.body.createdTime,
		author: {image: req.user.photo, username: req.user.username, id: req.user._id},
		type: req.body.type,
		comments: [],
	})
	res.redirect("/home")
})

//NEW SERVICE @GET
app.get("/new/service", (req, res) => {
	res.render("service", {page: "New Service"})
})

//SERVICE ROUTE @GET
app.get('/service', (req, res) => {
	Service.find({type: "Buisness"}, (err, found) => {
		if(err){
			console.log(err);
		} else {
			res.render('servicePage', {services: found, page: "Service"});
		}
	})
})


//NEW COMPLAIN ROUTE @GET
app.get("/new/complain", (req, res) => {
	res.render("complains", {page: "New Complain"})
})
//DELETE ROUTE @GET
app.get("/delete/:id", ensureAuthenticated,function(req, res){
	Post.findByIdAndDelete(req.params.id, function(err, destroyed){
		if(err){
			console.log(err)
		} else {
			res.redirect("/home")
		}
	})
})

//PROFILE PHOTO

// Init gfs
let gfs;

conn.once('open', () => {
  // Init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');
});

// Create storage engine
const storage = new GridFsStorage({
  url: 'mongodb+srv://kbibi:Mrgamer1017$@cluster0-pkbkj.mongodb.net/Cluster0?retryWrites=true&w=majority',
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });

//MY PROFILE ROUTE @GET
app.get('/profile', ensureAuthenticated, (req, res) => {
	res.render("myProfile.ejs", {user: req.user})
})
	
//EDIT PROFILE ROUTE @put
app.put('/edit/profile', (req, res) => {
	User.findOneAndUpdate({_id: req.user._id}, {
	  name: req.body.name,
	  email: req.user.email,
	  password: req.user.password,
	  bio: req.body.bio, 
	  number: req.body.number,
	  apartment: req.body.apartment,
	  username: req.user.username,
	  date: req.user.date,
	  photo: req.user.photo,
	}, (err, updated) => {
		if(err){
			console.log(err);
		} else {
			res.redirect("/profile/" + req.user._id)
		}
	})
})

//EDIT PROFILE ROUTE @GET
app.get("/edit/profile", ensureAuthenticated, (req, res) => {
	res.render("profileEdit", {profile: req.user, page: "Edit Profile"})
})

//PROFILES ROUTE @GET
app.get('/profiles', ensureAuthenticated, function(req, res){
		if(req.query.name){
		var noMatch = null;
        const regex = new RegExp(escapeRegex(req.query.name), 'gi');
        // Get all profiles from DB
        User.find({name: regex}, function(err, users){
           if(err){
               console.log(err);
           } else {
              if(users.length < 1) {
                  noMatch = "No Profiles match that search, please try again.";
              }
              res.render("profiles", {profiles: users, noMatch: noMatch, user: req.user, page: "Profiles"});
           }
        });
	} else if(req.query.username) {
		var noMatch = null;
        const regex = new RegExp(escapeRegex(req.query.username), 'gi');
        // Get all profiles from DB
        User.find({username: regex}, function(err, users){
           if(err){
               console.log(err);
           } else {
              if(users.length < 1) {
                  noMatch = "No profiles match that query, please try again.";
              }
              res.render("profiles", {profiles: users, noMatch: noMatch, user: req.user, page: "Profiles"});
           }
        });
	} else if(req.query.apartment) {
		var noMatch = null;
        // Get all profiles from DB
        User.find({apartment: "U-606"}, function(err, users){
           if(err){
               console.log(err);
           } else {
              if(users.length < 1) {
                  noMatch = "No profiles match that query, please try again.";
              }
              res.render("profiles", {profiles: users, noMatch: noMatch, user: req.user, page: "Profiles"});
           }
        });
	} else if (req.query.number){
		var noMatch = null;
        // Get all profiles from DB
        User.find({number: req.query.number}, function(err, users){
           if(err){
               console.log(err);
           } else {
              if(users.length < 1) {
                  noMatch = "No profiles match that query, please try again.";
              }
              res.render("profiles", {profiles: users, noMatch: noMatch, user: req.user, page: "Profiles"});
           }
        });
	} else {
		 // Get all profiles from DB
        User.find({}, function(err, profiles){
           if(err){
               console.log(err);
           } else {
              res.render("profiles",{profiles: profiles, noMatch: noMatch, user: req.user, page: "Profiles"});
           }
        });
    }
	})
	
//PROFILE ROUTE @GET
app.get('/profile/:id', (req, res) => {
	User.findById(req.params.id, function(err, found){
		if(err){
			console.log(err)
		} else {
			User.find({apartment: found.apartment}, (err, related) => {
				if(err){
					console.log(err)
				} else {
					const relative  = []
					related.forEach(relate => {
						if(relate._id == found._id){
							relative.push(relate)
							relative.pop()
						} else {
							relative.push(relate)
						}
					})
					res.render("profile" , {profile: found, related: relative, user: req.user, unit: [], page: "Profile"})
				}
			})
		} }) })


app.get("/:type/image/:id", ensureAuthenticated, (req, res) => {
	res.render("image", {type: req.params.type, id: req.params.id})
})
//POST PHOTO'S ROUTE @GET
app.post('/:type/image/:id', ensureAuthenticated, upload.single('file'), (req, res) => {
	if(req.file){
	if(req.params.type == "suggestion"){
	Suggestion.findById(req.params.id, (err, found) => {
		if(err){
			console.log(err)
		} else {
			found.image = req.file.filename;
			found.save()
			res.redirect('/home')
		}
	})
	} else if(req.params.type == "complain"){
	Complain.findById(req.params.id, (err, found) => {
		if(err){
			console.log(err)
		} else {
			found.image = req.file.filename;
			found.save()
			res.redirect('/home')
		}
	})
	} else if(req.params.type == "service"){
	Service.findById(req.params.id, (err, found) => {
		if(err){
			console.log(err)
		} else {
			found.image = req.file.filename;
			found.save()
			res.redirect('/home')
		}
	})
	} else if(req.params.type == "event"){
	Event.findById(req.params.id, (err, found) => {
		if(err){
			console.log(err)
		} else {
			found.image = req.file.filename;
			found.save()
			res.redirect('/home')
		}
	})
	} else if(req.params.type == "post"){
	Post.findById(req.params.id, (err, found) => {
		if(err){
			console.log(err)
		} else {
			found.image = req.file.filename;
			found.save()
			res.redirect('/home')
		}
	})
	} else {
		res.sendStatus(400)
	}
	} else {
		res.send("Please Enter An Image <a href='/home'>Return Back</a>")
	}
});
//SEARCH ROUTE @GET 
app.get("/search", (req, res) => {
	res.render("search", {page: "Search"}) 
})

// @route POST /upload
// @desc  Uploads file to DB
app.post('/upload', ensureAuthenticated, upload.single('file'), (req, res) => {
	if(req.file){
	User.findById(req.user, (err, found) => {
		if(err){
			console.log(err)
		} else {
			found.photo = req.file.filename;
			found.save()
			res.redirect('/profile/' + req.user._id)
		}
	})
	} else {
		res.send("Please Enter An Image <a href='/profile'>Return Back</a>")
	}
});
// FILES ROUTE @GET
// @desc  Display all files in JSON
app.get('/files', (req, res) => {
  gfs.files.find(req.user._id, (err, files) => {
    // Files exist
	console.log(files)
  }
)});

// FILE ROUTE @GET
// @desc  Display single file object
app.get('/files/:filename', (req, res) => {
  gfs.files.findOne({ _id: req.user._id }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }
    // File exists
    return res.json(file);
  });
});

// IMAGE ROUTE @GET
// @desc Display Image
app.get('/image/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    // Check if file
    if (!file || file.length === 0) {
      return res.status(404).json({
        err: 'No file exists'
      });
    }

    // Check if image
    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      // Read output to browser
      const readstream = gfs.createReadStream(file.filename);
		readstream.pipe(res)
    } else {
      res.status(404).json({
        err: 'Not an image'
      });
    }
  });
});

//STORAGE ROUTE @GET
app.get("/storage", (req, res) => {
	storage.find({}, (err, found) => {
		if(err){
			console.log(err)
		} else {
			res.json(found)
		}
	})
})

//NEW EVENT @GET
app.get('/new/event', ensureAuthenticated, (req, res) => {
	res.render("event", {page: "New Event"})
});

//EVENTS PAGE @GET
app.get('/event', (req, res) => {
	Event.find({type: "Repeated"}, (err, found) => {
		if(err){
			console.log(err)
		} else {
			res.render("eventsPage", {events: found, page: "Events"})
		}
	})
})

//NEW EVENT @POST
app.post('/new/event', (req, res) => {
	Event.create({
		title: req.body.title,
		body: req.body.body,
		created: req.body.created,
		createdTime: req.body.createdTime,
		author: {image: req.user.photo, username: req.user.username, id: req.user._id},
		type: req.body.type,
		comments: [],
		reserve: [],
	})
	res.redirect('/home')
})

//FOLLOW ROUTE @POST
app.post("/follow/:id", (req, res) => {
			User.findById(req.params.id, (err, follow) => {
				if(err){
					console.log(err)
				} else {
					console.log(new Set(req.user.following).length)
					console.log(req.user.following.length)
					if(new Set(req.user.following).length == req.user.following.length){
						follow.followers.push(req.user._id);
						follow.save()
						req.user.following.push(follow._id)
						req.user.save()
						res.redirect('/feed');
					} else {
						if(new Set(req.user.following).length == undefined && req.user.following.length == 0){
							follow.followers.push(req.user._id);
							follow.save()
							req.user.following.push(follow._id)
							req.user.save()
							res.redirect('/feed');
						}
						else if(new Set(req.user.following).length == undefined && req.user.following.length > 0){
							res.redirect('/profile/' + follow._id)
						}
						
					}
				}
			})
})

//DELETE FILES ROUTE @DELETE
// @desc  Delete file
app.delete('/files/:id', (req, res) => {
  gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
    if (err) {
      return res.status(404).json({ err: err });
    }

    res.redirect('/photo');
  });
});

//PHOTO ROUTE @GET
app.get("/photo", ensureAuthenticated, function(req, res){
	res.render("photo")
})

//404 HANDLER ROUTE @GET
app.get("*", (req, res) => {
	res.sendStatus(404)
})

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//SERVER LISTENER
app.listen(process.env.PORT || 80, function(){
    console.log('server started')
})
