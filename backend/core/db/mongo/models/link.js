'use strict';

/**
 * Link a user can create with other resources in a generic way.
 *
 * @type {exports}
 */

var mongoose = require('mongoose');

var LinkSchema = new mongoose.Schema({
  // the user who created the interaction
  user: {type: mongoose.Schema.ObjectId, ref: 'User'},
  // the target of the interaction
  target: {
    // the target object id
    resource: {type: mongoose.Schema.ObjectId, required: true},
    // the target resource type (User, Domain, Group, ...)
    type: {type: String, required: true}
  },
  // the type of link between the user and the target: profile view, message, ...
  type: {type: String, required: true},
  status: {type: String, lowercase: true, trim: true},
  date: {type: Date, default: Date.now},
  schemaVersion: {type: Number, default: 1}
});

module.exports = mongoose.model('Link', LinkSchema);
