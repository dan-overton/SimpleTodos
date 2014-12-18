/**
 * Created by Daniel Overton on 15/12/2014.
 */
var oauth2orize = require('oauth2orize');
var passport = require('passport');

var Client = require('./models/clients.js');
var AuthCode = require('./models/authcodes.js');
var Token = require('./models/accesstokens.js');
var User = require('./models/users.js');

exports = module.exports = {};

server = oauth2orize.createServer();

//serialization of client object during session
server.serializeClient(function(client, done) {
    return done(null, client.id);
});

server.deserializeClient(function(id, done) {
    Client.findById(id, function(err, client) {
        if (err) { return done(err); }
        return done(null, client);
    });
});

//set up the server to grant authorization codes (long lasting, secure, refreshable)
server.grant(oauth2orize.grant.code(function(client, redirectURI, user, ares, done) {
    var code = new AuthCode({
        client: client.id,
        redirectURI: redirectURI,
        user: user.id
    });

    code.save(function(err) {
        if(err)
        {
            return done(err);
        }
        else
        {
            return done(null, code.code);
        }
    })
}));

//set up the server to swap an auth code for an access token
server.exchange(oauth2orize.exchange.code(function(client, code, redirectURI, done) {
    AuthCode.findOne({ code: code}, function(err, authcode) {
        if(err)
        {
            return done(err);
        }

        if(authcode === undefined)
        {
            return done(null, false);
        }

        if(client.id !== authcode.client.toString())
        {
            return done(null, false);
        }

        if(redirectURI !== authcode.redirectURI)
        {
            return done(null, false);
        }

        //delete the authcode and issue a token
        AuthCode.remove({id: authcode.id}, function(err) {
            if(err)
            {
               return done(err);
            }

            Token.findOne({client: authcode.client, user: authcode.user}, function(err, existingToken)
            {
                if(err) { return done(err) }

                if(existingToken)
                {
                    //this client already has a valid access token for this user, so return that.
                    done(null, existingToken.token);
                }
                else {
                    var t = new Token({client: authcode.client, user: authcode.user});

                    t.save(function (err) {
                        if (err) {
                            return done(err);
                        }

                        done(null, t.token);
                    });
                }
            });
        });
    });
}));

//set up the server to exchange a user's username and password for an access token.
//This is to be limited to use by 1st party clients only.
server.exchange(oauth2orize.exchange.password(function(client, username, password, scope, done) {
    User.findOne({username: username}, function (err, user) {
        if (err) {
            return done(err);
        }
        if (!user) {
            return done(null, false);
        }
        user.comparePassword(password, function (err, isMatch) {
            if (err) {
                return done(err);
            }
            if (!isMatch) {
                return done(null, false);
            }

            Token.findOne({client: client.id, user: user.id}, function(err, existingToken)
            {
                if(err) { return done(err) }

                if(existingToken)
                {
                    //this client already has a valid access token for this user, so return that.
                    done(null, existingToken.token);
                }
                else {
                    var t = new Token({client: client.id, user: user.id});

                    t.save(function (err) {
                        if (err) {
                            return done(err);
                        }

                        done(null, t.token);
                    });
                }
            });
        });
    });
}));

//get the user to authorize the request.
//If they are not logged in, get them to do so.
//Then check the client id is valid and pointing to the registered redirectURI
//then present the user with a dialog asking for their permission.

exports.authorization = [

    function(req, res, next)
    {
        if(!req.isAuthenticated()) {
            res.redirect('/api/oauth/login');
        }
        else
        {
            next();
        }
    },

    server.authorization(function(clientID, redirectURI, done)
    {
        Client.findById(clientID, function(err, client) {
            if(err)
            {
                return done(err);
            }

            if(client === null)
            {
                return done('Invalid client');
            }

            if(client.redirectURI !== redirectURI)
            {
                return done('Invalid redirect URI');
            }

            return done(null, client, redirectURI);
        });
    }),

    function(req, res)
    {
        res.render('auth_dialog', {transactionID: req.oauth2.transactionID, userName: req.user.name, clientName: req.oauth2.client.name});
    }
];

//The user's allow / deny decision is routed to here.
//If the user is logged in this will then have the server process the decision
//if not it redirects them to the login screen.
exports.decision = [
    function(req, res, next)
    {
        if(!req.isAuthenticated()) {
            res.redirect('/api/oauth/login');
        }
        else
        {
            next();
        }
    },
    server.decision()
];

//authenticate the client, then issue them an access token if they have the appropriate grant.
exports.token = [  passport.authenticate('basic', {session: false}), server.token(), server.errorHandler() ];

exports.processOAuthLogin = function(req, res, next)
{
    passport.authenticate('local', { successRedirect: '/api/oauth/dialog/authorize/decision', failureRedirect: '/api/oauth/login', failureFlash: false })(req, res, next);
};

exports.showOAuthLoginForm = function(req, res, next)
{
    res.render('oauth_login');
};