/**
 * Created by Daniel Overton on 15/12/2014.
 */
var mongoose = require('mongoose');
var accessTokenSchema = mongoose.Schema({
    client: {type: mongoose.Schema.ObjectId, required: true},
    user: {type: mongoose.Schema.ObjectId, required: true}
});

var AccessToken = mongoose.model('AccessToken', accessTokenSchema);
module.exports = AccessToken;