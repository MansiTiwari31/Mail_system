var mongoose = require('mongoose');
	var plm = require('passport-local-mongoose');

	mongoose.connect("mongodb://localhost/emailmansi");

	var userSchema = mongoose.Schema({
	  name: String,
	  username: String,
	  password: String,
    email: String,
	profilePic:{
		type : String,
		default: 'logo.png'
	},
	sentMails : [{
	  type : mongoose.Schema.Types.ObjectId,
	  ref : "mail"
	}],
	receivedMails : [{
	  type : mongoose.Schema.Types.ObjectId,
	  ref : "mail"
	}]
	});

	userSchema.plugin(plm);

	module.exports = mongoose.model("user", userSchema);