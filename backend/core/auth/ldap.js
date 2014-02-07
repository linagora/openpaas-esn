'use strict';

/**
 * Translate a user LDAP response into a user bean
 *
 * @param {passport profile} profile
 */
module.exports.translate = function(profile) {
  var user = {
    provider: 'ldap',
    id: profile.uid,
    displayName: profile.cn || profile.displayName,
    name: {
      familyName: profile.sn,
      givenName: profile.givenName,
      middleName: profile.givenName
    }
  };
  var emails = [];
  if (profile.mail) {
    emails.push({value: profile.mail, type: 'work'});
  }
  if (profile.mailAlias) {
    if (profile.mailAlias instanceof Array) {
      profile.mailAlias.forEach(function(value) {
        emails.push({value: value, type: 'work'});
      });
    } else {
      emails.push({value: profile.mailAlias, type: 'work'});
    }
  }
  user.emails = emails;
  return user;
};
