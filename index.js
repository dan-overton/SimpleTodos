/**
 * Created by Daniel Overton on 07/12/2014.
 */
var bodyparser = require('body-parser');
var cookieparser = require('cookie-parser');
var expresssession = require('express-session');
var sessionmongoose = require('session-mongoose');
var connect = require('connect');   //for session-mongoose
var morgan = require('morgan');
var express = require('express');
var mongoose = require('mongoose');
var https = require('https');
var fs = require('fs');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
//TODO: Do I need method override? Used in example.

var credentials = require('./credentials.js');  //our gitignored credentials file
var Todo = require('./models/todos.js');
var User = require('./models/users.js');

var app = express();
var connectionString = "";

app.set('port', process.env.PORT || 3000);

switch(app.get('env')){
    case 'development':
        app.use(morgan('dev'));
        connectionString = credentials.mongo.development.connectionString;
        break;
    case 'production':
        app.use(morgan('combined'));
        connectionString = credentials.mongo.production.connectionString;
        break;
    default:
        throw new Error('Unknown execution environment: ' + app.get('env'));
}

//passport
passport.serializeUser(function(user, done) {
    done(null, user.id);
});
passport.deserializeUser(function(id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});
passport.use(new LocalStrategy(function(username, password, done) {
    User.findOne({ username: username }, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        user.comparePassword(password, function(err, isMatch) {
            if (err) return done(err);
            if(isMatch) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Invalid password' });
            }
        });
    });
}));

// Simple route middleware to ensure user is authenticated. Otherwise send to login page.
ensureAuthenticated = function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login')
};

//Connect to database
var opts = {
    server: {
        socketOptions: { keepAlive: 1 }
    }
};

mongoose.connect(connectionString, opts);

var MongoSessionStore = sessionmongoose(connect);
var sessionStore = new MongoSessionStore({ url: connectionString });

//Body Parser
app.use(bodyparser.urlencoded({extended: false})); //use normal querystring
app.use(cookieparser(credentials.cookieSecret));
app.use(expresssession({ store: sessionStore, resave: false, saveUninitialized: false, secret: credentials.cookieSecret }));

app.use(passport.initialize());
app.use(passport.session());

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    if(req.isAuthenticated()) {
        //render app
        res.sendFile('pages/webapp.html', {root: __dirname});
    }
    else
    {
        //send to login
        res.redirect('/login');
    }
});

app.get('/login', function(req, res) {
    res.sendFile('pages/login.html', {root: __dirname});
});

app.get('/register', function(req, res) {
    res.sendFile('pages/register.html', {root: __dirname});
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/', failureFlash: false }), function(req, res) { res.redirect('/');});

app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

app.post('/register', function(req, res)
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
});

app.get('/api/todos', ensureAuthenticated, function(req, res) {
    Todo.find({owninguser: req.user.id}, function(err, todos){

        if(err)
        {
            res.status(500).json({error: 'Unable to retrieve todos'});
        }
        else
        {
            res.status(200).json(todos.map(function(a) {
                return {
                    id: a._id,
                    todo: a.todo,
                    completed: a.completed
                }}));
        }
    });
});

app.get('/api/todos/:id', ensureAuthenticated,  function(req, res)
{
    Todo.findById(req.params.id, function(err, foundTodo){

        if(err)
        {
            res.status(500).json({error: 'Unable to retrieve todos'});
        }
        else if(foundTodo === null || foundTodo.owninguser.toString() !== req.user.id) //prevent unauthorised access but give no clues.
        {
            res.status(404).json({error: 'Todo not found'});
        }
        else
        {
            res.status(200).json(
            {
                id: foundTodo.id,
                todo: foundTodo.todo,
                completed: foundTodo.completed
            });
        }
    });
});

app.post('/api/todos', ensureAuthenticated,  function(req, res) {
    var newTodo = new Todo(JSON.parse(req.body.data));

    newTodo.owninguser = req.user.id;

    newTodo.save(function(err, data) {
        if(err)
        {
            res.status(500).json({error: 'Unable to create todo'});
        }
        else
        {
            res.status(200).json({ id: data.id });
        }
    });
});

app.put('/api/todos/:id', ensureAuthenticated,  function(req, res) {
    var newTodo = JSON.parse(req.body.data);

    //changed from update() as that will not call any save middleware
    //to be used across site.

    Todo.findById(req.params.id, function(err, foundTodo){
        if(err)
        {
            res.status(500).json({error: 'Unable to update todo'});
        }
        else if(foundTodo === null || foundTodo.owninguser.toString() !== req.user.id) //prevent unauthorised access but give no clues.
        {
            res.status(404).json({error: 'Todo not found'});
        }
        else
        {
            //TODO: find better way than property by property
            foundTodo.todo = newTodo.todo;
            foundTodo.completed = newTodo.completed;
            foundTodo.save(function(err) {
                if(err) {
                    res.status(500).json({error: 'Unable to update todo'});
                }
                else
                {
                    res.sendStatus(200);
                }
            });
        }
    });
});

app.delete('/api/todos/:id', ensureAuthenticated,  function(req, res) {
    Todo.remove({_id: req.params.id, owninguser: req.user.id}, function(err) {
        if(err)
        {
            res.status(500).json({error: 'Unable to delete todo'});
        }
        else
        {
            res.sendStatus(200);
        }
    });
});

// custom 404 page
app.use(function(req, res){
    res.type('text/plain');
    res.sendStatus(404);
});

// custom 500 page
app.use(function(err, req, res, next){
    console.error(err.stack);
    res.type('text/plain');
    res.sendStatus(500);
});

var options = {
    key: fs.readFileSync(__dirname + '/simpletodos.pem'),
    cert: fs.readFileSync(__dirname + '/simpletodos.crt')
};

https.createServer(options, app).listen(app.get('port'), function() {
    console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});
