/**
 * Created by Daniel Overton on 15/12/2014.
 */
var mongoose = require('mongoose');
var authCodeSchema = mongoose.Schema({
    client: {type: mongoose.Schema.ObjectId, required: true},
    redirectURI: { type: String, required: true, unique: true},
    user: {type: mongoose.Schema.ObjectId, required: true}
});

var AccessToken = mongoose.model('AuthCode', authCodeSchema);
module.exports = AccessToken;