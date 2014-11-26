'use strict';

var Schema = require('mongoose').Schema;

var Tuple = new Schema({
  objectType: {type: String, required: true},
  id: {type: Schema.Types.Mixed, required: true}
}, {_id: false});

module.exports = Tuple;
