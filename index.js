/**
 * Created by Daniel Overton on 07/12/2014.
 */
//region Includes
var bodyparser = require('body-parser');
var cookieparser = require('cookie-parser');
var expresssession = require('express-session');
var morgan = require('morgan');
var express = require('express');
var mongoose = require('mongoose');
var mongoosesession = require('mongoose-session');
var http = require('http');
var https = require('https');
var xFrameOptions = require('x-frame-options');
var fs = require('fs');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var BasicStrategy = require('passport-http').BasicStrategy;
var BearerStrategy = require('passport-http-bearer').Strategy;
var csrf = require('csurf');

var credentials = require('./credentials.js');  //our gitignored credentials file

var User = require('./models/users.js');
var Client = require('./models/clients.js');
var AccessToken = require('./models/accesstokens.js');

var uiRoutes = require('./routes_ui.js');
var authRoutes = require('./routes_auth.js');
var apiRoutes = require('./routes_api.js');
//endregion includes

//region Setup
var app = express();
var connectionString = "";

app.set('port', process.env.PORT || 3000);

var handlebars = require('express-handlebars').create({ defaultLayout:'main' });
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

//endregion

//region Middleware

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

passport.use(new BasicStrategy(
    function(clientId, secret, done) {
       Client.findById(clientId, function(err, client) {
           if (err) { return done(err); }
           if (!client) { return done(null, false); }
           client.compareSecret(secret, function(err, isMatch) {
               if (err) { return done(err); }
               if(isMatch === false)
               {
                   return done(null, false);
               }

               return done(null, client);
           });
        });
    }
));

passport.use(new BearerStrategy(
    function(accessToken, done) {
        AccessToken.findOne({token: accessToken}, function(err, token) {
            if (err) { return done(err); }
            if (!token) { return done(null, false); }

            User.findById(token.user.toString(), function(err, user) {
                if (err) { return done(err); }
                if (!user) { return done(null, false); }
                // to keep this example simple, restricted scopes are not implemented,
                // and this is just for illustrative purposes
                var info = { scope: '*' };
                done(null, user, info);
            });
        });
    }
));

//Mongo / Mongoose
var opts = {
    server: {
        socketOptions: { keepAlive: 1 }
    }
};

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

var unlessIn = function(path, middleware) {
    return function(req, res, next) {
        if(path.length <= req.path.length && path === req.path.substr(0,path.length))
        {
            return next();
        } else {
            return middleware(req, res, next);
        }
    };
};

mongoose.connect(connectionString, opts);

var sessionStore = mongoosesession(mongoose);
app.use(xFrameOptions()); //prevent our pages being rendered in an iframe (security)
app.use(bodyparser.urlencoded({extended: false})); //use normal querystring
app.use(cookieparser(credentials.cookieSecret));
//if we ever use a proxy need app.set('trust proxy', 1) for the secure (no non-https) cookie option
app.use(expresssession({ store: sessionStore, resave: false, saveUninitialized: false, secret: credentials.cookieSecret, cookie: { secure: app.get('env') === 'production' } }));
app.use(unlessIn('/api/', csrf()));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(__dirname + '/public'));

app.use(function(req, res, next) {
    res.locals.flash = req.session.flash;
    delete req.session.flash;
    next();
});

//endregion

//region Routes
//WEBAPP UI ROUTES
app.get('/', uiRoutes.index);
app.get('/login', uiRoutes.showLoginForm);
app.post('/login', uiRoutes.processWebUILogin);
app.get('/register',uiRoutes.showRegForm);
app.post('/register', uiRoutes.createUser);
app.get('/logout', uiRoutes.logout);
app.get('/webui/todos', uiRoutes.getAllTodos);
app.get('/webui/todos/:id', uiRoutes.getSingleTodo);
app.post('/webui/todos', uiRoutes.createTodo);
app.put('/webui/todos/:id', uiRoutes.updateTodo);
app.delete('/webui/todos/:id', uiRoutes.deleteTodo);

//OAUTH2 ROUTES
app.get('/api/oauth/dialog/authorize', authRoutes.authorization);
app.post('/api/oauth/dialog/authorize/decision', authRoutes.decision);
app.post('/api/oauth/token', authRoutes.token);
app.get('/api/oauth/login', authRoutes.showOAuthLoginForm);
app.post('/api/oauth/login', authRoutes.processOAuthLogin);

//REST API ROUTES
app.get('/api/', apiRoutes.showLandingPage);
app.get('/api/register', apiRoutes.registerForm);
app.post('/api/register', apiRoutes.registerClient);

app.get('/api/todos', apiRoutes.getAllTodos);
app.get('/api/todos/:id', apiRoutes.getSingleTodo);
app.post('/api/todos', apiRoutes.createTodo);
app.put('/api/todos/:id', apiRoutes.updateTodo);
app.delete('/api/todos/:id', apiRoutes.deleteTodo);
//endregion

//region Error Handlers
//invalid csrf token
app.use(function (err, req, res, next) {
    if (err.code !== 'EBADCSRFTOKEN') return next(err);

    // handle CSRF token errors here
    res.status(403).send('session has expired or form tampered with');
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
//endregion

//region Server
var options = {
    key: fs.readFileSync(__dirname + '/simpletodos.pem'),
    cert: fs.readFileSync(__dirname + '/simpletodos.crt')
};

switch(app.get('env')) {
    case 'development':
        http.createServer(app).listen(app.get('port'), function() {
            console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
        });
        break;
    case 'production':
        https.createServer(options, app).listen(app.get('port'), function() {
            console.log('Express started on https://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
        });
        break;
}

//endregion