'use strict';

module.exports = function(dependencies) {

  const mongoose = dependencies('db').mongo.mongoose;

  const UserStatusSchema = new mongoose.Schema({
    // _id is the User _id. Fails on mongoose.Model.find if we define it...
    last_active: {type: Date, default: Date.now},
    schemaVersion: {type: Number, default: 1}
  });

  return mongoose.model('UserStatus', UserStatusSchema);
};
