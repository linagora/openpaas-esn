'use strict';

var mongoose = require('mongoose');
var tuple = require('../schemas/tuple');
var Tuple = tuple.Tuple;

var ActorSchema = new mongoose.Schema({
  objectType: {type: String, required: true},
  image: {type: String},
  displayName: {type: String}
});

var ObjectSchema = new mongoose.Schema({
  objectType: {type: String}
});

var TimelineEntrySchema = new mongoose.Schema({
  verb: {type: String},
  language: {type: String},
  published: {type: Date, default: Date.now},
  actor: ActorSchema,
  object: ObjectSchema,
  target: [{
    objectType: {type: String},
    _id: {type: String, required: true}
  }],
  inReplyTo: [ObjectSchema],
  status: {type: String, required: false},
  to: {type: [Tuple], validate: [tuple.validateTuples, 'Bad to tuple']},
  bto: {type: [Tuple], validate: [tuple.validateTuples, 'Bad to tuple']},
  changeset: mongoose.Schema.Types.Mixed
}, {collection: 'timelineentries'});

module.exports = mongoose.model('TimelineEntry', TimelineEntrySchema);
