/**
 * Created by Daniel Overton on 07/12/2014.
 */
var bodyparser = require('body-parser');
var morgan = require('morgan');
var express = require('express');
var mongoose = require('mongoose');

var credentials = require('./credentials.js');  //our gitignored credentials file

var Todo = require('./models/todos.js');

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

//Connect to database
var opts = {
    server: {
        socketOptions: { keepAlive: 1 }
    }
};

mongoose.connect(connectionString, opts);

//Body Parser
app.use(bodyparser.urlencoded({extended: false})); //use normal querystring, not extended version (investigate)
app.use(express.static(__dirname + '/public'));

app.get('/api/todos', function(req, res) {
    Todo.find({}, function(err, todos){

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

app.get('/api/todos/:id', function(req, res)
{
    Todo.findById(req.params.id, function(err, foundTodo){

        if(err)
        {
            res.status(500).json({error: 'Unable to retrieve todos'});
        }
        else if(foundTodo === null)
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

app.post('/api/todos', function(req, res) {
    var newTodo = new Todo(JSON.parse(req.body.data));

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

app.put('/api/todos/:id', function(req, res) {
    var newTodo = JSON.parse(req.body.data);

    Todo.update({_id: req.params.id}, {$set: newTodo}, {}, function(err, numberAffected, raw) {
        if(err)
        {
            res.status(500).json({error: 'Unable to update todo'});
        }
        else if(numberAffected === 0)
        {
            res.status(404).json({error: 'Todo not found'});
        }
        else
        {
            res.sendStatus(200);
        }
    });
});

app.delete('/api/todos/:id', function(req, res) {
    Todo.remove({_id: req.params.id}, function(err) {
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
app.listen(app.get('port'), function() {
    console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});