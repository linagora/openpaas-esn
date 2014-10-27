'use strict';

var pubsub = require('../pubsub').local;

function getHandler(name) {
  name = name.replace(/[^A-Za-z0-9]+/, '');
  return require('./handlers/' + name);
}

/**
 * Validate the input invitation data.
 * Called when we want to deliver the invitation: we loaded it from
 * the datastore, and we want to know if this invitation is still valid.
 * For example, an invitation having an end date can become invalid after
 * a period of time
 */
module.exports.isStillValid = function(invitation, done) {
  if (!invitation) {
    return done(new Error('Can not validate null invitation'));
  }

  try {
    var handler = getHandler(invitation.type);
    return handler.isStillValid(invitation, done);
  } catch (err) {
    return done(new Error('Can not find invitation handler for ' + invitation.type));
  }
};


/**
 * Validate the input invitation data.
 * First, validate locally then delegate to the handler for specific check.
 */
module.exports.validate = function(invitation, done) {
  if (!invitation) {
    return done(new Error('Can not validate null invitation'));
  }

  try {
    var handler = getHandler(invitation.type);
    return handler.validate(invitation, done);
  } catch (err) {
    return done(new Error('Can not find invitation handler for ' + invitation.type));
  }
};

/**
 * Call the init method once the invitation is created
 *
 */
module.exports.init = function(invitation, done) {
  if (!invitation) {
    return done(new Error('Can not handle null invitation'));
  }
  try {
    var handler = getHandler(invitation.type);
    return handler.init(invitation, function(err, result) {
      if (err) {
        pubsub.topic('invitation:init:failure').publish({invitation: invitation, error: err});
        return done(err, result);
      }
      pubsub.topic('invitation:init:success').publish(invitation);
      return done(err, result);
    });
  } catch (err) {
    return done(new Error('Can not find invitation handler for ' + invitation.type));
  }
};

/**
 * Process an invitation. The process step may have some additional data which is not part of the initial invitation.
 * This additional data is the data parameter.
 */
module.exports.process = function(invitation, data, done) {
  if (!invitation) {
    return done(new Error('Can not process empty invitation'));
  }
  var handler;
  try {
    handler = getHandler(invitation.type);
  } catch (err) {
    return done(new Error('Can not find invitation handler for ' + invitation.type));
  }
  return handler.process(invitation, data, function(err, result) {
    if (err) {
      pubsub.topic('invitation:process:failure').publish({invitation: invitation, error: err});
    } else {
      pubsub.topic('invitation:process:success').publish(invitation);
    }
    return done(err, result);
  });
};

/**
 * Finalize the process. The finalize step may have some additional user data which is not part of the initial invitation.
 * This additional data is the data parameter.
 */
module.exports.finalize = function(invitation, data, done) {
  if (!invitation) {
    return done(new Error('Can not finalize empty invitation'));
  }
  var handler;
  try {
    handler = getHandler(invitation.type);
  } catch (err) {
    return done(new Error('Can not find invitation handler for ' + invitation.type));
  }

  return handler.finalize(invitation, data, function(err, result) {
    if (err) {
      pubsub.topic('invitation:finalize:failure').publish({invitation: invitation, error: err});
    } else {
      pubsub.topic('invitation:finalize:success').publish(invitation);
    }
    return done(err, result);
  });
};

