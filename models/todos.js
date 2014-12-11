/**
 * Created by Daniel Overton on 08/12/2014.
 */
var mongoose = require('mongoose');
var todoSchema = mongoose.Schema({
    todo: {type: String, required: true},
    completed: {type: Boolean, required: true},
    owninguser: {type: mongoose.Schema.ObjectId, required: true}
});

var Todo = mongoose.model('Todo', todoSchema);
module.exports = Todo;