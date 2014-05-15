'use strict';

module.exports.isStillValid = function(invitation, done) {
  console.log('isStillValid on data ', invitation);
  return done(null, true);
};

module.exports.validate = function(invitation, done) {
  console.log('Validating data ', invitation);
  return done(null, true);
};

module.exports.init = function(invitation, done) {
  console.log('Handling invitation ', invitation);
  var result = {
    status: 'delivered'
  };
  return done(null, result);
};

module.exports.process = function(invitation, data, done) {
  if (invitation) {
    console.log('Process the invitation ', invitation);
    done(null, {redirect: '/'});
  } else {
    console.log('No invitation found');
    done(new Error('Null invitation'));
  }
};

module.exports.finalize = function(invitation, data, done) {
  console.log('Finalized');
  done();
};
