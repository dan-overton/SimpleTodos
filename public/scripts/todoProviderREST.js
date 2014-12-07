/**
 * Created by Daniel Overton on 07/12/2014.
 */
var RestTodoProvider = function()
{
};

RestTodoProvider.prototype.updateFromStorage = function()
{
    var provider = this;
    var ajaxRequest = $.ajax({
        url: 'api/todos/',
        type: "GET",
        dataType: 'json',
        async: false
    });

    ajaxRequest.done(function(data) {
        provider.cachedTodos = data;
        return true;
    });

    ajaxRequest.fail(function(req, msg) {
        console.log('Request failed ' + msg);
        return false;
    });
};

RestTodoProvider.prototype.getAllTodos = function()
{
    this.updateFromStorage();
    return this.cachedTodos;
};

RestTodoProvider.prototype.getTodo = function(index)
{
    this.updateFromStorage();

    if(index < 0 || index > this.cachedTodos.length)
        throw new Error('Index out of bounds');
    else
        return this.cachedTodos[index];
};

RestTodoProvider.prototype.addTodo = function(newTodo) {
    this.cachedTodos.push(newTodo);
    console.log('Adding todo: ' + newTodo.todo + ' completed: ' + newTodo.completed);

    var ajaxRequest = $.ajax({
        url: 'api/todos/',
        type: "POST",
        data: {data: JSON.stringify(newTodo)},
        async: false
    });

    ajaxRequest.done(function(data) {
        return true;
    });

    ajaxRequest.fail(function(req, msg) {
        console.log('Request failed ' + msg);
        return false;
    });
};

RestTodoProvider.prototype.updateTodo = function(index, updatedTodo)
{
    if(index < 0 || index > this.cachedTodos.length)
        throw new Error('Index out of bounds');
    else
    {
        this.cachedTodos[index] = updatedTodo;

        var ajaxRequest = $.ajax({
            url: 'api/todos/' + index,
            type: "PUT",
            data: {data: JSON.stringify(updatedTodo)},
            async: false
        });

        ajaxRequest.done(function(data) {
            return true;
        });

        ajaxRequest.fail(function(req, msg) {
            console.log('Request failed ' + msg);
            return false;
        });
    }
};

RestTodoProvider.prototype.deleteTodo = function(index)
{
    if(index < 0 || index > this.cachedTodos.length)
        throw new Error('Index out of bounds');
    else {
        this.cachedTodos.splice(index, 1);

        var ajaxRequest = $.ajax({
            url: 'api/todos/' + index,
            type: "DELETE",
            async: false
        });

        ajaxRequest.done(function(data) {
            return true;
        });

        ajaxRequest.fail(function(req, msg) {
            console.log('Request failed ' + msg);
            return false;
        });
    }
};