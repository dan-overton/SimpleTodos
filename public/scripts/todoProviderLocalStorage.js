/**
 * Created by Daniel Overton on 07/12/2014.
 */
var LocalTodoProvider = function()
{
};

LocalTodoProvider.prototype.updateFromStorage = function()
{
    this.cachedTodos  = localStorage.getItem('todos');

    if(this.cachedTodos == null)
    {
        this.cachedTodos = [];
    }
    else
    {
        this.cachedTodos = JSON.parse(this.cachedTodos);
    }
};

LocalTodoProvider.prototype.getAllTodos = function()
{
    this.updateFromStorage();
    return this.cachedTodos;
};

LocalTodoProvider.prototype.getTodo = function(index)
{
    this.updateFromStorage();

    if(index < 0 || index > this.cachedTodos.length)
        throw new Error('Index out of bounds');
    else
        return this.cachedTodos[index];
};

LocalTodoProvider.prototype.addTodo = function(newTodo)
{
    this.cachedTodos.push(newTodo);
    localStorage.setItem('todos',JSON.stringify(this.cachedTodos));
};

LocalTodoProvider.prototype.updateTodo = function(index, updatedTodo)
{
    this.updateFromStorage();
    if(index < 0 || index > this.cachedTodos.length)
        throw new Error('Index out of bounds');
    else {
        this.cachedTodos[index] = updatedTodo;
        localStorage.setItem('todos',JSON.stringify(this.cachedTodos));
    }
};

LocalTodoProvider.prototype.deleteTodo = function(index)
{
    this.updateFromStorage();

    if(index < 0 || index > this.cachedTodos.length)
        throw new Error('Index out of bounds');
    else {
        this.cachedTodos.splice(index, 1);
        localStorage.setItem('todos', JSON.stringify(this.cachedTodos));
    }
};