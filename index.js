/**
 * Created by Daniel Overton on 07/12/2014.
 */
var bodyparser = require('body-parser');
var morgan = require('morgan');
var express = require('express');
var app = express();

app.set('port', process.env.PORT || 3000);

switch(app.get('env')){
    case 'development':
        app.use(morgan('dev'));
        break;
    case 'production':
        app.use(morgan('combined'));
        break;
    default:
        throw new Error('Unknown execution environment: ' + app.get('env'));
}

//Body Parser
app.use(bodyparser.urlencoded({extended: false})); //use normal querystring, not extended version (investigate)
app.use(express.static(__dirname + '/public'));
app.use(function(req,res,next){setTimeout(next,1000)});

var todos = [
    {
        todo: 'REST todo #1',
        completed: false
    },
    {
        todo: 'REST todo #2',
        completed: true
    },
    {
        todo: 'REST todo #3',
        completed: false
    }
];

app.get('/api/todos', function(req, res) {
    res.json(todos);
});

app.get('/api/todos/:index', function(req, res) {

    if(req.params.index < 0)
        res.send(400, 'Index out of bounds')
    else if (req.params.index > todos.length)
        res.send(404);
    else
        res.json(todos[req.params.index]);
});

app.post('/api/todos', function(req, res) {
    var newTodo = JSON.parse(req.body.data);
    todos.push(newTodo);
    res.send(200);
});

app.put('/api/todos/:index', function(req, res) {
    var newTodo = JSON.parse(req.body.data);
    todos[req.params.index] = newTodo;
    res.send(200);
});

app.delete('/api/todos/:index', function(req, res) {
    if(req.params.index < 0)
        res.send(400, 'Index out of bounds')
    else if (req.params.index > todos.length)
        res.send(404);
    else {
        todos.splice(req.params.index, 1);
        res.send(200);
    }
});

// custom 404 page
app.use(function(req, res){
    res.type('text/plain');
    res.status(404);
    res.send('404 - Not Found');
});

// custom 500 page
app.use(function(err, req, res, next){
    console.error(err.stack);
    res.type('text/plain');
    res.status(500);
    res.send('500 - Server Error');
});
app.listen(app.get('port'), function() {
    console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});