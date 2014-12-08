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

LocalTodoProvider.prototype.getTodo = function(id, callback)
{
    this.getTodosFromStorage(function(err, data) {
        for(var i = 0; i < data.length; i++)
        {
            if(data[i].id === id)
            {
                callback(null, data[i]);
                return;
            }
        }
        callback("Id not found", null);
    });
};

LocalTodoProvider.prototype.addTodo = function(newTodo, callback)
{
    var todos = this.getTodosFromStorage(function(err, data) {
        var maxId = 0;

        for(var i = 0; i < data.length; i++)
        {
            if(parseInt(data[i].id) >= maxId)
            {
                maxId = parseInt(data[i].id) + 1;
            }
        }

        newTodo.id = maxId.toString();
        data.push(newTodo);
        localStorage.setItem('todos',JSON.stringify(data));
        callback(null);
    });
};

LocalTodoProvider.prototype.updateTodo = function(id, updatedTodo, callback)
{
    var todos = this.getTodosFromStorage(function(err, data) {
        for(var i = 0; i < data.length; i++)
        {
            if(data[i].id === id)
            {
                data[i] = updatedTodo;
                data[i].id = id;
                localStorage.setItem('todos',JSON.stringify(data));
                callback(null);
                return;
            }
        }
        callback("Id not found", null);
    });
};

LocalTodoProvider.prototype.deleteTodo = function(id, callback)
{
    var todos = this.getTodosFromStorage(function(err, data) {
        for(var i = 0; i < data.length; i++)
        {
            if(data[i].id === id)
            {
                data.splice(i,1);
                localStorage.setItem('todos', JSON.stringify(data));
                callback(null, null);
                return;
            }
        }
        callback("Id not found", null);
    });
};