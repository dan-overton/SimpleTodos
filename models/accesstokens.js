/**
 * Created by Daniel Overton on 15/12/2014.
 */
var mongoose = require('mongoose');
var uuid = require('node-uuid');
var accessTokenSchema = mongoose.Schema({
    token: {type: String},
    client: {type: mongoose.Schema.ObjectId, required: true},
    user: {type: mongoose.Schema.ObjectId, required: true}
});

accessTokenSchema.pre('save', function(next) {
    var tokenToSave = this;

    if(tokenToSave.isNew)
    {
        this.token = uuid.v4();
    }

    next();
});

var AccessToken = mongoose.model('AccessToken', accessTokenSchema);
module.exports = AccessToken;