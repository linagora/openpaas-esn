'use strict';

var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

var AttachmentSchema = new mongoose.Schema({
  _id: {type: ObjectId, required: true},
  name: {type: String, required: true},
  contentType: {type: String, required: true},
  length: {type: Number, required: true}
});

var CopyOf = new mongoose.Schema({
  origin: {
    resource: {
      objectType: {type: String, required: true},
      id: {type: mongoose.Schema.Types.Mixed, required: true}
    },
    message: {type: mongoose.Schema.ObjectId, required: true},
    sharer: {type: mongoose.Schema.ObjectId, required: true, ref: 'User'},
    timestamps: {
      creation: {type: Date, default: Date.now}
    }
  },
  target: [{
    objectType: {type: String, required: true},
    id: {type: mongoose.Schema.Types.Mixed, required: true}
  }]
}, {_id: false});

module.exports = {
  timestamps: {
    creation: {type: Date, default: Date.now}
  },
  author: {type: mongoose.Schema.ObjectId, required: true},
  language: {type: String, required: false},
  attachments: {type: [AttachmentSchema], required: false },
  shares: [{
    objectType: {type: String},
    id: {type: String}
  }],
  responses: [mongoose.Schema.Mixed],
  copyOf: {type: CopyOf.tree, required: false},
  parsers: [
    {name: {type: String, required: true}}
  ]
};
