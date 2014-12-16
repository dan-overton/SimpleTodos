/**
 * Created by Daniel Overton on 15/12/2014.
 */
var mongoose = require('mongoose');
var authCodeSchema = mongoose.Schema({
    code: {type: String, required: true, unique: true},
    client: {type: mongoose.Schema.ObjectId, required: false},
    redirectURI: { type: String, required: true, unique: false},
    user: {type: mongoose.Schema.ObjectId, required: false}
});

var AccessToken = mongoose.model('AuthCode', authCodeSchema);
module.exports = AccessToken;