/**
 * Created by Daniel Overton on 07/12/2014.
 */
var RestTodoProvider = function(csrfToken)
{
    this.csrfToken = csrfToken;
};

RestTodoProvider.prototype.getTodosFromStorage = function(callback)
{
    var ajaxRequest = $.ajax({
        url: 'webui/todos/',
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
        url: 'webui/todos/' + id,
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
        url: 'webui/todos/',
        type: "POST",
        data: {data: JSON.stringify(newTodo), _csrf: this.csrfToken},
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
        url: 'webui/todos/' + id,
        type: "PUT",
        data: {data: JSON.stringify(updatedTodo), _csrf: this.csrfToken},
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
        url: 'webui/todos/' + id,
        type: "DELETE",
        async: true,
        data: {_csrf: this.csrfToken}
    });

    ajaxRequest.done(function(data) {
        callback(null, data);
    });

    ajaxRequest.fail(function(req, msg) {
        callback(msg, null);
    });
};