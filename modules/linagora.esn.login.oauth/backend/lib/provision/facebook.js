'use strict';

module.exports.profileToUser = function(profile, user) {
  user = user || {};
  user.firstname = profile.name.givenName ? profile.name.givenName : '';
  user.lastname = profile.name.familyName ? profile.name.familyName : '';
  user.description = profile._json.bio ? profile._json.bio : '';

  if (profile._json.location && profile._json.location.name) {
    user.building_location = profile._json.location.name;
  }

  if (profile.photos && profile.photos.length > 0 && profile.photos[0].value) {
    user.avatarURL = profile.photos[0].value;
  }
  return user;
};
