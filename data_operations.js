/**
 * Created by Daniel Overton on 17/12/2014.
 */
module.exports = exports = {};
var Todo = require('./models/todos.js');

exports.getAllTodos = function(req, res) {
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
};

exports.getSingleTodo = function(req, res) {
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
};

exports.createTodo = function(req, res)
{
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
};

exports.deleteTodo = function(req, res)
{
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
};

exports.updateTodo = function(req, res)
{
    var newTodo = JSON.parse(req.body.data);

    //changed from update() as that will not call any save middleware.
    //To be used across site.

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
};