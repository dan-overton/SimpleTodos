/**
 * Created by Daniel Overton on 11/12/2014.
 */
var User = require('./models/users.js');
var request = require('request');
var credentials = require('./credentials');

exports = module.exports = {};

// Simple route middleware to ensure user is authenticated. Otherwise send to login page.
var ensureAuthenticated = function ensureAuthenticated(req, res, next) {
    if (req.session.apiToken) { return next(); }
    res.redirect('/login')
};

exports.index = function(req, res)
{
    if(req.session.apiToken) {
        //render app
        res.render('webui/webapp', {layout: false, root: __dirname, csrfToken: req.csrfToken()});
    }
    else
    {
        //send to login
        res.render('login', {csrfToken: req.csrfToken()});
    }
};

exports.showLoginForm = function(req, res)
{
    res.render('login', {csrfToken: req.csrfToken()});
};

exports.processWebUILogin = function(req, res, next)
{
    //try to get a bearer token from our api.
    request.post(credentials.webapp.serverProtocol + credentials.webapp.clientid + ':' + credentials.webapp.clientsecret + '@' + credentials.webapp.server + '/api/oauth/token',
        {form: {grant_type: 'password', username: req.body.username, password: req.body.password}}, function(err, msg, body) {
            if(err) { return next(err);}

            switch(msg.statusCode)
            {
                case 200:
                    //we're in.
                    var returnedJson = JSON.parse(body);

                    req.session.apiToken = returnedJson.access_token;
                    res.redirect('/');
                    break;
                case 401:
                    //client credentials failed.
                    res.sendStatus(500);
                    break;
                case 403:
                    //user credentials failed
                    req.session.flash = {
                        type: 'danger', intro: 'Login Error!', message: 'Your username or password were incorrect. Please try again.'
                    };
                    res.redirect('/login');
                    break;
                default:
                    //something else broke.
                    res.sendStatus(500);
            }
        });
};

exports.showRegForm = function(req, res)
{
    res.render('register', {csrfToken: req.csrfToken()});
};

exports.logout = function(req, res)
{
    delete req.session.apiToken;
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
    //TODO: Move this to using the API
    var newUser = new User( {
        username: req.body.username,
        firstname: req.body.firstname,
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
            req.session.flash = {
                type: 'success', intro: 'Account Created!', message: 'Please log in to the site!'
            };
            res.redirect('/');
        }
    });
};