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

// --------------
// *** Routes ***
// --------------


// Users Routes
app.use('/users', require('./routes/users.js'));

// Landing Page
app.get('/', (req, res) => {
	//renders the landing page and sends current user along
	res.render('beta', {page: "Landing", user: req.user})
})

//Home Page *
app.get("/home", ensureAuthenticated, (req, res) => {
	// find all Suggestions
	Suggestion.find({}, (err, found) => {
		//if there is an error
		if(err){
			//print it out
			console.log(err)
		} else {
			// find all posts 
			Post.find({}, (err, posts) => {
				//if there is an error
				if(err){
					//print it out
					console.log(err)
				} else {
					// find all complains
					Complain.find({}, (err, complains) => {
						//if there is an error
						if(err){
							// print it out
							console.log(err)
						} else {
							//find all services
							Service.find({}, (err, services) => {
								//if there is an error
								if(err){
									//print it out
									console.log(err)
								} else {
									//find all events 
									Event.find({}, (err, events) => {
										//if there is an error
										if(err){
											//print it out
											console.log(err)
										} else {
											// reverse suggestions to be from newest
											const invsuggestion = found.reverse();
											// reverse posts to be from newest
											const invposts = posts.reverse();
											// reverse complains to be from newest
											const invcomplain = complains.reverse();
											// reverse services to be from newest
											const invservice = services.reverse();
											// reverse events to be from newest
											const invevents = events.reverse(); 
											//renders the home page and sends all posts, suggestions, etc... along
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

//Create New Page *
app.get("/new", ensureAuthenticated, (req, res) => {
	//renders the 'create new' page
	res.render("new")
})

//Create New Route *
app.post('/new/post', ensureAuthenticated, function(req, res){
	//create new post
	Post.create({
		title: req.body.title,
		post: req.body.post,
		image: req.body.image,
		author: {image: req.user.photo, username: req.user.username, id: req.user._id},
		created: req.body.created,
		createdTime: req.body.createdTime,
	}, (err, post) => {
		if(err) throw err
		res.redirect(`/home#${post._id}`)
	})
})

app.get('/new/suggestion', (req, res) => {
	res.render('suggestion')
})

app.get('/new/post', (req, res) => {
	res.render('post')
})
//New Suggestion Route *
app.post("/new/suggestion", (req, res) => {
	//create new suggestion
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
		//redirect to the home page
	res.redirect(`/home#${suggestion._id}`)
})

//Create New Comment Route *
app.post('/comment/:type/:id', ensureAuthenticated, (req, res) => {
	//initiate schema
	let schema;
	//if the post type is 'post'
	if(req.params.type == "Post"){
		schema = Post;
	}
	//if the post type is 'Suggestion'  
	else if(req.params.type == "Suggestion"){
		schema = Suggestion;
	} 
	//if the post type is 'Event'
	else if(req.params.type == "Event"){
		schema = Event
	} 
	//if the post type is 'Complain'
	else if(req.params.type == "Complain"){
		schema = Complain 
	} else {
		//send status of 404 (not found)
		res.sendStatus(404)
	}
	//find the schema initiated above
	schema.findById(req.params.id, (err, found) => {
		//if there is an error
		if(err){
			//print it out
			console.log(err)
		} else {
			//add the new comment to the comments array(list) 
			found.comments.push({username: req.user.username, image: req.user.photo, body: req.body.comment, created: 					req.body.created, createdTime: req.body.createdTime})
			//save it
			found.save()
			//redirect the user to the home page(the targeted post)
			res.redirect("/home#" + req.params.id)
		}
})
})

//post comments to service
app.post('/service/comment/:id', ensureAuthenticated, (req, res) => {
	//find the targeted service
	Service.findById(req.params.id, (err, found) => {
		//if there is an error	
		if(err){
			//print it out
				console.log(err)
			} else {
				//add new comment to the comments list
				found.comments.push({username: req.user.username, image: req.user.photo, body: req.body.comment, created:
				req.body.created, createdTime: req.body.createdTime})
				//redirect the user to the home page(the targeted service)
				res.redirect("/home#" + req.params.id)
				//save it
				found.save()
			}
})
})

//Edit Post Route *
app.get("/edit/:type/:id", ensureAuthenticated, function(req, res){
	//initiate schema
	let schema;
	//check the post type
	// then assign schema to it
	if(req.params.type == "post"){
		schema = Post
	} else if(req.params.type == "service"){
		schema = Service
	} else if(req.params.type == "suggestion"){
		schema = Suggestion
	} else if(req.params.type == "event"){
		schema = Event
	} else if(req.params.type == "complain"){
		schema = Complain
	}
	
})

//Reserve On Event Or Service *
app.post('/reserve/:type/:id', ensureAuthenticated, (req, res) => {
	//check the post type
	//find post by Id
	if(req.params.type == 'event'){
		Event.findById(req.params.id, (err, found) => {
			//check if user is already reserved
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

//Reserve On Event Or Service Page
app.get("/reservers/:type/:id", (req, res) => {
	//check post type
	//find post by id
	//renders reservers page
	if(req.params.type == "service"){
		Service.findById(req.params.id, (err, found) => {
			if(err){
				console.log(err)
			} else {
				res.render("reservers", {profiles: found.reserveUser, page: "Reserved Users"})
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

//Voting Page
app.get('/voters/:id', (req, res) => {
	//initiate yes & no variables
	let yes = 0;
	let no = 0;
	//find suggestion by id
	Suggestion.findById(req.params.id, (err, found) => {
		found.voteArr.forEach(vote => {
			if(vote.vote == "yes"){
				yes = yes + 1
			} else if(vote.vote == "no"){
				no = no + 1
			} else {
				return undefined
			}
		})
		res.render("voters", {yes: yes, no: no, page: "Voters"})
	})
})

//Voting Route
app.post('/vote/:type/:id', (req, res) => {
	//find suggestion using id
	Suggestion.findById(req.params.id, (err, found) => {
		//if there is an error
		if(err){
			//print it out
			console.log(err)
		} else {
			//check voting option by: [person, unit]
			if(found.voteBy == "Person"){
				//if it is by person then..
				//search for the user
				//if he is not in the list then let him vote
				if(found.voteArr.indexOf(req.user._id) == -1){
					found.voteArr.push(req.user._id)
					found.voteArr.push({user: req.user._id, vote: req.params.type, id: req.user._id})
					found.save()
					res.redirect('/home')
				} else {
					//if he already voted
					//tgen do nothing
					res.sendStatus(400)
				}
			} else if(found.voteBy== "Unit"){
				//if it is by unit then...
				//search for the user apartment
				if(found.voteArr.indexOf(req.user.apartment) == -1){
					//if no one voted from the unit then...
					//let this user vote
					found.voteArr.push(req.user.apartment)
					found.voteArr.push({user: req.user.apartment, vote: req.params.type, id: req.user._id})
					found.save()
					res.redirect('/home')
				} else {
					//if someone voted already
					//do nothing
					res.sendStatus(400)
				}
			} else {
				res.sendStatus(500)
			}
				
		}
	})
})

//Complain Status Page
app.get("/complain/status/:id", (req, res) => {
	Complain.findById(req.params.id, (err, found) => {
		if(err){
			console.log(err)
		} else {
			res.render("status", {status: found.status})
		}
	})
})

//Delete Route
app.delete("/delete/:type/:id", (req, res) => {
	//check the post type
	if(req.params.type == "suggestion"){
		//find the post and delete it
		Suggestion.findByIdAndDelete(req.params.id, (err, found) => {
			if(err){
				console.log(err)
			} else {
				//then redirect to the home page again
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

//Complain Finishing Route
app.get('/done/:id', (req, res) => {
	//find Complain Using id
	Complain.findById(req.params.id, (err, found) => {
		if(err){
			console.log(err)
		} else {
			//then assign it to done
			found.status = 'Done';
			//save it
			found.save()
		}
	})
})

//Add new complain route
app.post("/new/complain", (req, res) => {
	//create new complain
	Complain.create({
	title: req.body.title,
	body: req.body.body,
	created: req.body.created,
	createdTime: req.body.createdTime,
	author: {image: req.user.photo, username: req.user.username, id: req.user._id},
	type: req.body.type,
	status: 'In Progress',
}, (err, complain) => {
	if(err) throw err
	//redirect to the home page
	res.redirect(`/home#${complain._id}`)
	})
})

//Complainer Route
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

//New Service Route
app.post("/new/service", ensureAuthenticated, (req, res) => {
	//create new service
	Service.create({
		title: req.body.title,
		body: req.body.body,
		created: req.body.created,
		createdTime: req.body.createdTime,
		author: {image: req.user.photo, username: req.user.username, id: req.user._id},
		type: req.body.type,
		comments: [],
	}, (err, service) => {
		if(err) throw err
		//redirect to the home page
		res.redirect(`/home#${service._id}`)
	})
})

//New Service Page
app.get("/new/service", (req, res) => {
	//renders new service page
	res.render("service", {page: "New Service"})
})

//Services Page
app.get('/service', (req, res) => {
	//find services using type of business
	Service.find({type: "Buisness"}, (err, found) => {
		if(err){
			console.log(err);
		} else {
			//renders the service page
			res.render('servicePage', {services: found, page: "Service"});
		}
	})
})


//Add New Complain Page
app.get("/new/complain", (req, res) => {
	res.render("complains", {page: "New Complain"})
})
//Delete Post Route
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

//My Profile Page
app.get('/profile', ensureAuthenticated, (req, res) => {
	res.render("myProfile.ejs", {user: req.user})
})
	
//Edit Profile Route
app.put('/edit/profile', (req, res) => {
	//find user and update it
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
			//redirect to the current user profile
			res.redirect("/profile/" + req.user._id)
		}
	})
})

//Edit Profile Page
app.get("/edit/profile", ensureAuthenticated, (req, res) => {
	res.render("profileEdit", {profile: req.user, page: "Edit Profile"})
})

//PROFILES ROUTE @GET
app.get('/profiles', ensureAuthenticated, function(req, res){
	//Regex Search
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
	
//Profile Route
app.get('/profile/:id', (req, res) => {
	//find user using id
	User.findById(req.params.id, function(err, found){
		if(err){
			console.log(err)
		} else {
			//find another users in the user unit
			User.find({apartment: found.apartment}, (err, related) => {
				if(err){
					console.log(err)
				} else {
					//init relatives
					const relative  = [];
					//loop through relatives
					related.forEach(relate => {
						if(relate._id == found._id){
							relative.push(relate)
							relative.pop()
						} else {
							relative.push(relate)
						}
					})
					//render profile
					res.render("profile" , {profile: found, related: relative, user: req.user, unit: [], page: "Profile"})
				}
			})
		} }) })


app.get("/:type/image/:id", ensureAuthenticated, (req, res) => {
	res.render("image", {type: req.params.type, id: req.params.id})
})

//Photo Uploading Route
app.post('/:type/image/:id', ensureAuthenticated, upload.single('file'), (req, res) => {
	//check if there is a file
	if(req.file){
	//check the post type from parameters
	if(req.params.type == "suggestion"){
		//find this post
	Suggestion.findById(req.params.id, (err, found) => {
		if(err){
			console.log(err)
		} else {
			//update the new file
			found.image = req.file.filename;
			//save it
			found.save()
			//redirect to the user profile
			res.redirect(`/home#${found._id}`)
		}
	})
	} else if(req.params.type == "complain"){
	Complain.findById(req.params.id, (err, found) => {
		if(err){
			console.log(err)
		} else {
			found.image = req.file.filename;
			found.save()
			//redirect to the user profile
			res.redirect(`/home#${found._id}`)
		}
	})
	} else if(req.params.type == "service"){
	Service.findById(req.params.id, (err, found) => {
		if(err){
			console.log(err)
		} else {
			found.image = req.file.filename;
			found.save()
			//redirect to the user profile
			res.redirect(`/home/${found._id}`)
		}
	})
	} else if(req.params.type == "event"){
	Event.findById(req.params.id, (err, found) => {
		if(err){
			console.log(err)
		} else {
			found.image = req.file.filename;
			found.save()
			//redirect to the user profile
			res.redirect(`/home#${found._id}`)
		}
	})
	} else if(req.params.type == "post"){
	Post.findById(req.params.id, (err, found) => {
		if(err){
			console.log(err)
		} else {
			found.image = req.file.filename;
			found.save()
			//redirect to the user profile
			res.redirect(`/home#${found._id}`)
		}
	})
	} else {
		res.sendStatus(400)
	}
	} else {
		//send a return back link
		res.send("Please Enter An Image <a href='/photo'>Return Back</a>")
	}
});

//Search Route
app.get("/search", (req, res) => {
	res.render("search", {page: "Search"}) 
})

// User Uploading Route
app.post('/upload', ensureAuthenticated, upload.single('file'), (req, res) => {
	//check if there is a file
	if(req.file){
	//find current user by id
	User.findById(req.user, (err, found) => {
		if(err){
			console.log(err)
		} else {
			//update the current photo
			found.photo = req.file.filename;
			//save it
			found.save()
			//redirect the user to his/her profile
			res.redirect('/profile/' + req.user._id)
		}
	})
	} else {
		//send a return back link
		res.send("Please Enter An Image <a href='/profile'>Return Back</a>")
	}
});

// files route
app.get('/files', (req, res) => {
  gfs.files.find(req.user._id, (err, files) => {
    // Files exist
	console.log(files)
  }
)});

// Display Single File Route
app.get('/files/:filename', (req, res) => {
	//search for file
  gfs.files.findOne({ _id: req.user._id }, (err, file) => {
    // Check if it is a file
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

//Storage Route
app.get("/storage", (req, res) => {
	storage.find({}, (err, found) => {
		if(err){
			console.log(err)
		} else {
			//send found data
			res.json(found)
		}
	})
})

//New Event Page
app.get('/new/event', ensureAuthenticated, (req, res) => {
	//renders new event page
	res.render("event", {page: "New Event"})
});

//Events page
app.get('/event', (req, res) => {
	Event.find({type: "Repeated"}, (err, found) => {
		if(err){
			console.log(err)
		} else {
			//renders events Page
			res.render("eventsPage", {events: found, page: "Events"})
		}
	})
})

//New Event Route
app.post('/new/event', (req, res) => {
	//create new event
	Event.create({
		title: req.body.title,
		body: req.body.body,
		created: req.body.created,
		createdTime: req.body.createdTime,
		author: {image: req.user.photo, username: req.user.username, id: req.user._id},
		type: req.body.type,
		comments: [],
		reserve: [],
	}, (err, event) => {
		if(err) throw err
		//redirect to the home page
		res.redirect('/home')
	})
})

//Delete Files Route
app.delete('/files/:id', (req, res) => {
  gfs.remove({ _id: req.params.id, root: 'uploads' }, (err, gridStore) => {
    if (err) {
      return res.status(404).json({ err: err });
    }
	//redirects to the upload photo profile
    res.redirect('/photo');
  });
});

//Photo Route
app.get("/photo", ensureAuthenticated, function(req, res){
	res.render("photo")
})

//Fault Requests Handler
app.get("*", (req, res) => {
	res.send('<h1>404 Not Found</h1><a href="/home">Go Back</a>')
})

//Escape Regex Function
function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

//SERVER LISTENER
app.listen(process.env.PORT || 80, function(){
    console.log('server started')
})
