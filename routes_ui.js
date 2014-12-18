/**
 * Created by Daniel Overton on 11/12/2014.
 */
var User = require('./models/users.js');
var request = require('request');
var credentials = require('./credentials');
var passport = require('passport');

exports = module.exports = {};

// Simple route middleware to ensure user is authenticated. Otherwise send to login page.
var ensureAuthenticated = function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login')
};

exports.index = function(req, res)
{
    if(req.isAuthenticated()) {
        //render app
        res.render('webui/webapp', {layout: false, root: __dirname, csrfToken: req.csrfToken()});
    }
    else
    {
        //send to login
        res.redirect('/login');
    }
};

exports.showLoginForm = function(req, res)
{
    res.render('login', {csrfToken: req.csrfToken()});
};

exports.processLogin = function(req, res, next) {
    var redirTo = "/";
    //if they are logging in on the website, this won't be set.
    //if logging in to auth an oauth request, it will be
    //TODO: Create a separate login screen / route for oauth. Really separate this (thought).

    //oauth verify
    if(req.session.ReturnTo) {
        redirTo = req.session.ReturnTo;
        delete req.session.ReturnTo;
        passport.authenticate('local', { successRedirect: redirTo, failureRedirect: '/', failureFlash: false })(req, res, next);
    }
    else
    {
        //webui login
        passport.authenticate('local',function(err, user, info) {
            if (err) { return next(err); }
            if (!user) { return res.redirect('/'); }

            //get a bearer token from our api.
            request.post(credentials.webapp.serverProtocol + credentials.webapp.clientid + ':' + credentials.webapp.clientsecret + '@' + credentials.webapp.server + '/api/oauth/token',
                {form: {grant_type: 'password', username: req.body.username, password: req.body.password}}, function(err, msg, body) {
                    if(err) { return next(err);}

                    if(msg.statusCode!==200)
                    {
                        return next(err);
                    }

                    var returnedJson = JSON.parse(body);

                    req.session.apiToken = returnedJson.access_token;
                    req.logIn(user, function(err) {
                        if(err) { return next(err) }
                        res.redirect('/');
                    });

                });
        })(req,res,next);
    }
};

exports.showRegForm = function(req, res)
{
    res.render('register');
};

exports.logout = function(req, res)
{
    req.logout();
    //logout only removes the user from the session, does not destroy it. We want ours gone.
    req.session.destroy(function(err) {
        res.redirect('/');
    });
};

exports.getAllTodos  = [ensureAuthenticated, function(req, res) {
    request.get(credentials.webapp.serverProtocol + credentials.webapp.server + '/api/todos', {
        'auth': {'bearer': req.session.apiToken}},
        function(err, msg, body) {
            if(err) { return next(err);}

            if(msg.statusCode!==200)
            {
                return next(err);
            }
            var js = JSON.parse(body);
            res.status(200).json(js);
        });
}];

exports.getSingleTodo  = [ensureAuthenticated, function(req, res) {
    request.get(credentials.webapp.serverProtocol + credentials.webapp.server + '/api/todos/' + req.params.id, {
            'auth': {'bearer': req.session.apiToken}},
        function(err, msg, body) {
            if(err) { return next(err);}

            if(msg.statusCode!==200)
            {
                return next(err);
            }
            var js = JSON.parse(body);
            res.status(200).json(js);
        });
}];

exports.createTodo = [ensureAuthenticated, function(req, res) {

    request.post({url: credentials.webapp.serverProtocol + credentials.webapp.server + '/api/todos',
            'auth': {'bearer': req.session.apiToken}, form: req.body}, function(err, msg, body) {
            if(err) { return next(err);}

            if(msg.statusCode!==200)
            {
                return next(err);
            }
            var js = JSON.parse(body);
            res.status(200).json(js);
        });
}];

exports.updateTodo = [ensureAuthenticated, function(req, res) {

    request.put({url: credentials.webapp.serverProtocol + credentials.webapp.server + '/api/todos/' + req.params.id,
        'auth': {'bearer': req.session.apiToken}, form: req.body}, function(err, msg, body) {
        if(err) { return next(err);}

        if(msg.statusCode!==200)
        {
            return next(err);
        }
        res.sendStatus(200);
    });
}];

exports.deleteTodo = [ensureAuthenticated, function(req, res) {

    request.del({url: credentials.webapp.serverProtocol + credentials.webapp.server + '/api/todos/' + req.params.id,
        'auth': {'bearer': req.session.apiToken}, form: req.body}, function(err, msg, body) {
        if(err) { return next(err);}

        if(msg.statusCode!==200)
        {
            return next(err);
        }
        res.sendStatus(200);
    });
}];

exports.createUser = function(req, res)
{
    //TODO: Review escaping input
    var newUser = new User( {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    });

    newUser.save(function(err) {
        if(err)
        {
            res.sendStatus(500);
        }
        else
        {
            res.redirect('/');
        }
    });
};