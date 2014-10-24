'use strict';

var mongoose = require('mongoose');
var uuid = require('node-uuid');
var Schema = mongoose.Schema;

var CommunitySchema = new Schema({
  title: {type: String, required: true, trim: true},
  description: {type: String, trim: true},
  type: {type: String, trim: true, required: true, default: 'open'},
  status: String,
  avatar: String,
  creator: {type: Schema.ObjectId, ref: 'User'},
  domain_ids: [
    {type: Schema.ObjectId, ref: 'Domain'}
  ],
  timestamps: {
    creation: {type: Date, default: Date.now}
  },
  members: [
    {
      user: {type: mongoose.Schema.ObjectId, ref: 'User'},
      status: {type: String},
      timestamps: {
        creation: {type: Date, default: Date.now}
      }
    }
  ],
  activity_stream: {
    uuid: {type: String},
    timestamps: {
      creation: {type: Date, default: Date.now}
    }
  },
  membershipRequests: [
    {
      user: {type: Schema.ObjectId, ref: 'User'},
      workflow: {type: String, required: true},
      timestamp: {
        creation: {type: Date, default: Date.now}
      }
    }
  ],
  injections: [
    {
      key: {type: String, required: true},
      values: [
        {
          directive: {type: String, required: true},
          attributes:
            [{
              name: {type: String, required: true},
              value: {type: String, required: true}
            }]
        }
      ]
    }
  ],
  schemaVersion: {type: Number, default: 1}
});

CommunitySchema.pre('save', function(next) {
  this.activity_stream = this.activity_stream || {};
  if (!this.activity_stream.uuid) {
    this.activity_stream.uuid = uuid.v4();
  }
  next();
});

CommunitySchema.statics = {

  getFromActivityStreamID: function(id, cb) {
    if (!id) {
      return cb(new Error('Activity stream id can not be null'));
    }
    this.findOne({'activity_stream.uuid': id}).exec(cb);
  },

  testTitleDomain: function(title, domains, cb) {
    var query = {title: title, domain_ids: domains};
    this.findOne(query, cb);
  }
};

module.exports = mongoose.model('Community', CommunitySchema);
