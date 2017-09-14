'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var uuidV1 = require('uuid/v1');

var options = {
  strict: false
};

var InvitationSchema = new Schema({
  timestamps: {
    created: {type: Date, default: Date.now},
    finalized: {type: Date}
  },
  type: {type: String, required: true},
  uuid: {type: String, unique: true},
  data: {},
  schemaVersion: {type: Number, default: 1}
}, options);

InvitationSchema.pre('save', function(next) {
  this.uuid = uuidV1();
  next();
});

InvitationSchema.methods = {
  finalize: function(cb) {
    this.timestamps.finalized = new Date();
    this.save(cb);
  }
};

InvitationSchema.statics = {

  /**
   * Load an invitation from its UUID
   *
   * @param {String} uuid
   * @param {Function} cb - as fn(err, invitation) where invitation is not null if found
   */
  loadFromUUID: function(uuid, cb) {
    this.findOne({uuid: uuid}, cb);
  },

  /**
   * Test if the invitation is finalized
   *
   * @param {String} uuid - invitation uuid
   * @param {fn}  cb : cb as fn(err, finalized)
   */
  isFinalized: function(uuid, cb) {
    this.findOne({uuid: uuid}).where('timestamps.finalized').exists(true).exec(function(err, data) {
      if (err) {
        return cb(err);
      }
      if (data) {
        return cb(null, true);
      }
      return cb(null, false);
    });
  }
};

module.exports = mongoose.model('Invitation', InvitationSchema);
