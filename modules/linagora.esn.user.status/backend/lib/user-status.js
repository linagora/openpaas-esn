'use strict';

module.exports = function(dependencies) {

  const mongoose = dependencies('db').mongo.mongoose;
  const UserStatus = mongoose.model('UserStatus');

  return {
    getStatus,
    getStatuses,
    updateLastActiveForUser,
    updateLastActiveForUsers
  };

  function getStatus(userId) {
    return UserStatus.findById(userId).exec();
  }

  function getStatuses(userIds) {
    return UserStatus.find({_id: {$in: userIds}}).exec();
  }

  function updateLastActiveForUser(userId, last_active = Date.now()) {
    return UserStatus.findOneAndUpdate({_id: userId}, {$set: {last_active: last_active}}, {upsert: true}).exec();
  }

  function updateLastActiveForUsers(userIds, last_active = Date.now()) {
    return UserStatus.where({ _id: { $in: userIds } })
      .setOptions({ upsert: true })
      .updateMany({ $set: { last_active: last_active } })
      .exec();
  }
};
