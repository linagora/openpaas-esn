'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var uuid = require('node-uuid');

var options = {
  strict: false
};

var InvitationSchema = new Schema({
  timestamps: {
    created: {type: Date, default: Date.now}
  },
  type: {type: String, required: true},
  uuid: {type: String, unique: true},
  data: {},
  schemaVersion: {type: Number, default: 1}
}, options);

InvitationSchema.pre('save', function(next) {
  this.uuid = uuid.v1();
  next();
});

InvitationSchema.statics = {

  /**
   * Load an invitation from its UUID
   *
   * @param {String} uuid
   * @param {Function} cb - as fn(err, invitation) where invitation is not null if found
   */
  loadFromUUID: function(uuid, cb) {
    this.findOne({uuid: uuid}, cb);
  }

};

module.exports = mongoose.model('Invitation', InvitationSchema);
