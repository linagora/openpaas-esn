'use strict';

module.exports.profileToUser = function(profile, user) {
  user = user || {};
  user.firstname = profile.displayName || profile.username;
  user.description = profile._json.description ? profile._json.description : '';
  user.building_location = profile._json.location ? profile._json.location : '';

  if (profile.photos && profile.photos.length > 0 && profile.photos[0].value) {
    user.avatarURL = profile.photos[0].value;
  }

  return user;
};
