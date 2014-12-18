/**
 * Created by Daniel Overton on 11/12/2014.
 */
var Client = require('./models/clients.js');
var uuid = require('node-uuid');
var passport = require('passport');
var ops = require('./data_operations.js');

module.exports = exports = {};

exports.registerForm = function(req, res)
{
    res.render('register_client');
};

exports.registerClient = function(req, res)
{
    var clientSecret = uuid.v4();

    var newClient = new Client(( {
        name: req.body.clientName,
        email: req.body.email,
        redirectURI: req.body.redirectURI,
        secret: clientSecret
    }));

    newClient.save(function(err) {
        if(err)
        {
            res.sendStatus(500);
        }
        else
        {
            res.render('client_confirm', {clientId: newClient.id, clientSecret: clientSecret});
        }
    });
};

exports.getAllTodos = [passport.authenticate('bearer', { session: false }), ops.getAllTodos];
exports.getSingleTodo = [passport.authenticate('bearer', { session: false }), ops.getSingleTodo];
exports.createTodo = [passport.authenticate('bearer', { session: false }), ops.createTodo];
exports.updateTodo = [passport.authenticate('bearer', { session: false }), ops.updateTodo];
exports.deleteTodo = [passport.authenticate('bearer', { session: false }), ops.deleteTodo];