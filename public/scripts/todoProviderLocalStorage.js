/**
 * Created by Daniel Overton on 07/12/2014.
 */
var LocalTodoProvider = function()
{
};

LocalTodoProvider.prototype.getTodosFromStorage = function(callback)
{
    var todos = localStorage.getItem('todos');

    if(todos == null)
    {
        todos = [];
    }
    else
    {
        todos = JSON.parse(todos);
    }

    callback(null, todos);
};

LocalTodoProvider.prototype.getAllTodos = function(callback)
{
    this.getTodosFromStorage(callback);
};

LocalTodoProvider.prototype.getTodo = function(index, callback)
{
    this.getTodosFromStorage(function(err, data) {
        callback(null, data[index]);
    });
};

LocalTodoProvider.prototype.addTodo = function(newTodo, callback)
{
    var todos = this.getTodosFromStorage(function(err, data) {
        data.push(newTodo);
        localStorage.setItem('todos',JSON.stringify(data));
        callback(null);
    });
};

LocalTodoProvider.prototype.updateTodo = function(index, updatedTodo, callback)
{
    var todos = this.getTodosFromStorage(function(err, data) {
        data[index] = updatedTodo;
        localStorage.setItem('todos',JSON.stringify(data));
        callback(null);
    });
};

LocalTodoProvider.prototype.deleteTodo = function(index, callback)
{
    var todos = this.getTodosFromStorage(function(err, data) {
        data.splice(index, 1);
        localStorage.setItem('todos', JSON.stringify(data));
        callback(null);
    });
};