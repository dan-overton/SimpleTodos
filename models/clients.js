/**
 * Created by Daniel Overton on 15/12/2014.
 */
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;

var clientSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: false },
    email: { type: String, required: true, unique: false },
    redirectURI: { type: String, required: true, unique: true},
    secret: { type: String, required: true}
});

//middleware to intercept the save request and replace the password with a salted hash
//this is done so that even if this table is hacked, it won't allow the attackers to gain
//access to the API using client credentials

clientSchema.pre('save', function(next) {
    var clientToSave = this;

    //update where password not changed, no need to hash
    if(!clientToSave.isModified('secret'))
    {
        return next();
    }

    //generate a salt. This is random data added to the password to ensure hashes can't be guessed
    //by being able to try hashes for common passwords.

    bcrypt.genSalt(SALT_WORK_FACTOR,function(err, salt) {
        if(err) return next(err);

        bcrypt.hash(clientToSave.secret, salt, function(err, hash) {
            if(err) return next(err);

            clientToSave.secret = hash;
            next();
        });
    });
});

//utility function to check if secret matches
clientSchema.methods.compareSecret = function(candidateSecret, callback) {
    //doesn't require salt as bcrypt concats it into the hash
    bcrypt.compare(candidateSecret, this.secret, function(err, isMatch) {
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
var Client = mongoose.model('Client', clientSchema);
module.exports = Client;