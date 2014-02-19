'use strict';

/**
 * Validate the input invitation data.
 * First, validate locally then delegate to the handler for specific check.
 */
module.exports.validate = function(invitation, done) {
  if (!invitation) {
    return done(new Error('Can not validate null invitation'));
  }

  if (!invitation.type) {
    return done(new Error('Invitation type is mandatory'));
  }

  try {
    var handler = require('./handlers/' + invitation.type);
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
  if (!invitation || !invitation.type) {
    return done(new Error('Can not handle null invitation'));
  }
  try {
    var handler = require('./handlers/' + invitation.type);
    return handler.init(invitation, done);
  } catch (err) {
    return done('Can not find invitation handler for ' + invitation.type);
  }
};

/**
 * Process an invitation. Invitation is already loaded and injected in the request.
 * Using an express middleware allows to chain handlers and to work with request, response and next.
 */
module.exports.process = function(req, res, next) {
  var invitation = req.invitation;
  if (!invitation) {
    return next(new Error('Can not process empty invitation'));
  }
  var handler;
  try {
    handler = require('./handlers/' + invitation.type);
  } catch (err) {
    return next(new Error('Can not find invitation handler for ' + invitation.type));
  }
  return handler.process(req, res, next);
};

/**
 * Finalize the process
 */
module.exports.finalize = function(req, res, next) {
  var invitation = req.invitation;
  if (!invitation) {
    return next(new Error('Can not finalize empty invitation'));
  }
  var handler;
  try {
    handler = require('./handlers/' + invitation.type);
  } catch (err) {
    return next(new Error('Can not find invitation handler for ' + invitation.type));
  }
  return handler.finalize(req, res, next);
};

