/**
 * Created by Daniel Overton on 10/12/2014.
 */
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;

var userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    name: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true}
});

//middleware to intercept the save request and replace the password with a salted hash
//this is done so that even if this table is hacked, it won't allow the attackers to gain
//access to the user's account, or be able to try their password on other websites.

userSchema.pre('save', function(next) {
    var userToSave = this;

    //update where password not changed, no need to hash
    if(!userToSave.isModified('password'))
    {
        return next();
    }

    //generate a salt. This is random data added to the password to ensure hashes can't be guessed
    //by being able to try hashes for common passwords.

    bcrypt.genSalt(SALT_WORK_FACTOR,function(err, salt) {
       if(err) return next(err);

        bcrypt.hash(userToSave.password, salt, function(err, hash) {
            if(err) return next(err);

            userToSave.password = hash;
            next();
        });
    });
});

//utility function to check if password matches
userSchema.methods.comparePassword = function(candidatePw, callback) {
    //doesn't require salt as bcrypt concats it into the hash
    bcrypt.compare(candidatePw, this.password, function(err, isMatch) {
       if(err)
       {
           return callback(err);
       }
       else
       {
           return callback(null, isMatch);
       }
    });
};

//create our model stored in the 'User' table and export it for use by other modules
var User = mongoose.model('User', userSchema);
module.exports = User;