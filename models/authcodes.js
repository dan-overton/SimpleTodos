/**
 * Created by Daniel Overton on 15/12/2014.
 */
var mongoose = require('mongoose');
var uuid = require('node-uuid');

var authCodeSchema = mongoose.Schema({
    code: {type: String},
    client: {type: mongoose.Schema.ObjectId, required: false},
    redirectURI: { type: String, required: true, unique: false},
    user: {type: mongoose.Schema.ObjectId, required: false}
});

authCodeSchema.pre('save', function(next) {
    var codeToSave = this;

    if(codeToSave.isNew)
    {
        this.code = uuid.v4();
    }

    next();
});

var AccessToken = mongoose.model('AuthCode', authCodeSchema);
module.exports = AccessToken;