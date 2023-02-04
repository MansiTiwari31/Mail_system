var express = require('express');
var multer = require('multer');
var router = express.Router();
const userModel = require("./users");
const mailModel = require('./mail');
const passport = require('passport');
const localStrategy = require("passport-local")

passport.use(new localStrategy(userModel.authenticate()));

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + Math.floor(Math.random()*10000000000) + file.originalname
    cb(null, uniqueSuffix)
  }
})
const maxSize = 1 * 1024 * 1024; // for 1MB
const upload = multer({ storage: storage, storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == "image/png" ||
      file.mimetype == "image/jpg" ||
      file.mimetype == "image/jpeg"
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only .png, .jpg and .jpeg format allowed!"));
    }
  },
  limits: { fileSize: maxSize },
}).single('file');

router.get('/imageupload', function(req, res, next){
  res.render('profile');
});
router.post('/imageupload', upload,async function (req, res, next) {
  let loggedInUser =  await userModel.findOne({username : req.session.passport.user})
  loggedInUser.profilePic = req.file.filename ;
  await loggedInUser.save();
  res.redirect(req.headers.referer);
 })
//paste code for registering user

router.post("/register", function (req, res) {
  const userData = new userModel({
    name: req.body.name,
    username: req.body.username,
    email : req.body.email
  })
  userModel.register(userData, req.body.password)
    .then(function (registeredUser) {
      passport.authenticate('local')(req, res, function () {
        res.redirect("/profile");
      })
    })
    .catch(function (err) {
      console.log(err);
      res.redirect("/login");
    })
});

//paste code for login

router.post("/login", passport.authenticate('local', {
  successRedirect: "/profile",
  failureRedirect: "/login"
}), function (req, res) { })

//paste code for logout

router.get("/logout", function (req, res) {
  req.logOut(function(err){
    if(err) throw err;
    res.redirect("/")
  });
});

//code for /profile route

router.get("/profile", isLoggedIn, function (req, res ) {
  userModel.findOne( {username :req.session.passport.user })
  .populate({
    path : 'receivedMails',
    populate : {
      path : 'userid'
    }
  })
  .then(function (foundUser)
  {

    res.render("profile" , {foundUser})
  })
})

//function to check if the user is logedin

   

//make route for login page

router.get("/", function (req, res) {
  res.render("login");
})

//make a /register route

router.get("/register", function (req, res) {
  res.render("register");
})

router.post('/compose',isLoggedIn, async function(req, res){
  var loggedInUser= await userModel.findOne({username: req.session.passport.user})

  var createMail= await mailModel.create({
    userid: loggedInUser._id,
    receiver : req.body.receivemail,
    mailtext: req.body.mailtext
  });
  loggedInUser.sentMails.push(createMail._id);
  const loggedInUserUpdate = await loggedInUser.save();

  const receiverUser = await userModel.findOne({email : req.body.receivemail});
 receiverUser.receivedMails.push(createMail._id);

  await receiverUser.save();
 res.redirect(req.headers.referer);

});

router.get("/sent", isLoggedIn, function (req, res ) {
  userModel.findOne( {username :req.session.passport.user })
  .populate({
    path : 'sentMails',
    populate : {
      path : 'userid'
    }
  })
  .then(function (foundUser)
  {
  
    res.render("sent" , {foundUser})
  })
})

router.get("/readmore/:id", isLoggedIn, async function (req, res ) {
  let maildetails = await  mailModel.findOne( {_id :req.params.id })
   let foundUser = await userModel.findOne( {username :req.session.passport.user })
   .populate({
     path : 'sentMails',
     populate : {
       path : 'userid'
     }
   })
     console.log(foundUser)
     res.render("readmore" , {foundUser , maildetails})
 
 });

 router.get("/readmoreb/:id", isLoggedIn, function (req, res ) {
  let details=userModel.findOne( {username :req.session.passport.user })
  .populate({
    path : 'receivedMails',
    populate : {
      path : 'userid'
    }
  })
  .then(function (foundUser)
  {

    res.render("readmoreb" , {foundUser, details})
  })
})
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login")
}
 

module.exports = router;
