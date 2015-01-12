'use strict';

var mongoose = require('mongoose');
var baseMessage = require('./base-message');
var extend = require('extend');
var tuple = require('../schemas/tuple');
var Tuple = tuple.Tuple;

var specificSchema = {
    objectType: {type: String, required: true, default: 'organizational'},
    content: {type: String, required: true},
    recipients: {type: [Tuple], validate: [tuple.validateTuple, 'Bad recipient tuple']},
    published: {type: Date, default: Date.now}
};

extend(true, specificSchema, baseMessage);
var OrganizationalMessageSchema = new mongoose.Schema(specificSchema, { collection: 'messages' });

module.exports = mongoose.model('OrganizationalMessage', OrganizationalMessageSchema);


