/**
 * Created by Daniel Overton on 11/12/2014.
 */
var User = require('./models/users.js');

exports = module.exports = {};

exports.index = function(req, res)
{
    if(req.isAuthenticated()) {
        //render app
        res.sendFile('pages/webapp.html', {root: __dirname});
    }
    else
    {
        //send to login
        res.redirect('/login');
    }
};

exports.showLoginForm = function(req, res)
{
    res.sendFile('pages/login.html', {root: __dirname});
};

exports.showRegForm = function(req, res)
{
    res.sendFile('pages/register.html', {root: __dirname});
};

exports.logout = function(req, res)
{
    req.logout();
    res.redirect('/');
};

exports.createUser = function(req, res)
{
    //TODO: Review escaping input
    var newUser = new User(( {
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    }));

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