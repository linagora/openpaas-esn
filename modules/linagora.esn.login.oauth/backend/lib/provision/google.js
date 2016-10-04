'use strict';

module.exports.profileToUser = function(profile, user) {
  user = user || {};
  user.firstname = profile.name.givenName ? profile.name.givenName : '';
  user.lastname = profile.name.familyName ? profile.name.familyName : '';
  user.job_title = profile._json.occupation ? profile._json.occupation : '';

  if (profile._json.placeslived && profile._json.placeslived.length > 0 && profile._json.placeslived[0].value) {
    user.building_location = profile._json.placeslived[0].value;
  }

  user.description = profile._json.braggingRights ? profile._json.braggingRights : '';

  if (profile._json.image && profile._json.image.url) {
    user.avatarURL = profile._json.image.url;
  }

  return user;
};
