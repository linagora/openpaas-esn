'use strict';

var mongoose = require('mongoose');
var JOB_STATES = require('../constants').JOB_STATES;
var Schema = mongoose.Schema;

var states = [];
for (var stateKey in JOB_STATES) {
  if (JOB_STATES.hasOwnProperty(stateKey)) {
    states.push(JOB_STATES[stateKey]);
  }
}

var JobSchema = new Schema({
  jobId: {type: String, required: true},
  state: {type: String, default: JOB_STATES.CREATED, enum: states},
  description: {type: String},
  calls: {type: Number, min: 0, default: 0},
  timestamps: {
    creation: {type: Date, default: Date.now},
    updatedAt: {type: Date}
  },
  context: Schema.Types.Mixed
});

module.exports = mongoose.model('Job', JobSchema);
