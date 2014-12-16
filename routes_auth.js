/**
 * Created by Daniel Overton on 15/12/2014.
 */
var oauth2orize = require('oauth2orize');
var passport = require('passport');
var uuid = require('node-uuid');

var Client = require('./models/clients.js');
var AuthCode = require('./models/authcodes.js');
var Token = require('./models/accesstokens.js');

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
        code: uuid.v4(),
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

            var tokenToIssue = uuid.v4();
            var t = new Token({token: tokenToIssue, client: authcode.client, user: authcode.user});

            t.save(function(err) {
                if(err) {
                    return done(err);
                }

                done(null, tokenToIssue);
            })
        });
    });
}));

//get the user to authorize the request.
//If they are not logged in, get them to do so.
//Then check the client id is valid and pointing to the registered redirectURI
//then presen the user with a dialog asking for their permission.
exports.authorization = [

    function(req, res, next)
    {
        if(!req.isAuthenticated()) {
            req.session.returnTo = req.originalUrl;
            res.redirect('/login');
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
//Then the server processes the decision
exports.decision = [
    function(req, res, next)
    {
        if(!req.isAuthenticated()) {
            req.session.returnTo = req.originalUrl;
            res.redirect('/login');
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