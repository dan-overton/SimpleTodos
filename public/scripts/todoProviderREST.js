/**
 * Created by Daniel Overton on 07/12/2014.
 */
var RestTodoProvider = function()
{
};

RestTodoProvider.prototype.getTodosFromStorage = function(callback)
{
    var provider = this;
    var ajaxRequest = $.ajax({
        url: 'api/todos/',
        type: "GET",
        dataType: 'json',
        async: true
    });

    ajaxRequest.done(function(data) {
       callback(null, data);
    });

    ajaxRequest.fail(function(req, msg) {
        callback(msg, null);
    });
};

RestTodoProvider.prototype.getAllTodos = function(callback)
{
    this.getTodosFromStorage(callback);
};

RestTodoProvider.prototype.getTodo = function(index, callback)
{
    this.getTodosFromStorage(function(err, data) {
        if(err)
        {
            callback(err, null);
        }
        else
        {
            callback(null, data[index]);
        }
    });
};

RestTodoProvider.prototype.addTodo = function(newTodo, callback) {
    var ajaxRequest = $.ajax({
        url: 'api/todos/',
        type: "POST",
        data: {data: JSON.stringify(newTodo)},
        async: true
    });

    ajaxRequest.done(function(data) {
        callback(null, data);
    });

    ajaxRequest.fail(function(req, msg) {
        callback(msg, null);
    });
};

RestTodoProvider.prototype.updateTodo = function(index, updatedTodo, callback)
{
    var ajaxRequest = $.ajax({
        url: 'api/todos/' + index,
        type: "PUT",
        data: {data: JSON.stringify(updatedTodo)},
        async: true
    });

    ajaxRequest.done(function(data) {
        callback(null, data);
    });

    ajaxRequest.fail(function(req, msg) {
        callback(msg, null);
    });
};

RestTodoProvider.prototype.deleteTodo = function(index, callback)
{
    var ajaxRequest = $.ajax({
        url: 'api/todos/' + index,
        type: "DELETE",
        async: true
    });

    ajaxRequest.done(function(data) {
        callback(null, data);
    });

    ajaxRequest.fail(function(req, msg) {
        callback(msg, null);
    });
};