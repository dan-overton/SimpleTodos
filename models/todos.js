/**
 * Created by Daniel Overton on 08/12/2014.
 */
var mongoose = require('mongoose');
var todoSchema = mongoose.Schema({
    todo: String,
    completed: Boolean
});
var Todo = mongoose.model('Todo', todoSchema);
module.exports = Todo;