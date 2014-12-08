/**
 * Created by Daniel Overton on 07/12/2014.
 */
var RestTodoProvider = function()
{
};

RestTodoProvider.prototype.getTodosFromStorage = function(callback)
{
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

RestTodoProvider.prototype.getTodo = function(id, callback)
{
    var ajaxRequest = $.ajax({
        url: 'api/todos/' + id,
        type: "GET",
        async: true
    });

    ajaxRequest.done(function(data) {
        callback(null, data);
    });

    ajaxRequest.fail(function(req, msg) {
        callback(msg, null);
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

RestTodoProvider.prototype.updateTodo = function(id, updatedTodo, callback)
{
    var ajaxRequest = $.ajax({
        url: 'api/todos/' + id,
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

RestTodoProvider.prototype.deleteTodo = function(id, callback)
{
    var ajaxRequest = $.ajax({
        url: 'api/todos/' + id,
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