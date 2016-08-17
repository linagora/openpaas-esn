'use strict';

var composableMiddleware = require('composable-middleware');
var canCreateMiddlewares = {};
var linkUtils = require('../../core/resource-link/utils');
var logger = require('../../core/logger');

function wrap(type, middleware) {

  return function wrapper(req, res, next) {
    logger.debug('Wrap middleware');

    if (req.linkable) {
      logger.debug('Link has already been processed');
      return next();
    }

    if (req.link && req.link.type !== type) {
      logger.debug('Link is not a valid type %s, skipping', req.link.type);
      return next();
    }

    middleware(req, res, next);
  };
}

function addCanCreateMiddleware(type, middleware) {
  if (type && middleware) {
    canCreateMiddlewares[type] = canCreateMiddlewares[type] || composableMiddleware();
    canCreateMiddlewares[type].use(wrap(type, middleware));
  }
}
module.exports.addCanCreateMiddleware = addCanCreateMiddleware;

function isResourceLink(req, res, next) {
  var link = req.body;

  if (!linkUtils.isValidLink(link)) {
    return res.json(400, {error: {code: 400, message: 'Bad request', details: 'Request is not a valid resource-link'}});
  }

  req.link = link;
  next();
}
module.exports.isResourceLink = isResourceLink;

function canCreate(req, res, next) {
  var middleware = canCreateMiddlewares[req.link.type];
  if (!middleware) {
    return res.json(400, {error: {code: 400, message: 'Bad request', details: 'Resource Link of type ' + req.link.type + ' can not be processed'}});
  }
  middleware(req, res, next);
}
module.exports.canCreate = canCreate;

function isLinkable(req, res, next) {
  if (!req.linkable) {
    return res.json(400, {error: {code: 400, message: 'Bad request', details: 'Resources are not linkable'}});
  }
  next();
}
module.exports.isLinkable = isLinkable;

function canDelete(req, res, next) {
  if (!linkUtils.isOwnerLink(req.body.source.id, req.user._id)) {
    return res.status(403).json({error: {code: 403, message: 'Forbidden', details: 'Resource Link belongs to a different user'}});
  }

  next();
}

module.exports.canDelete = canDelete;
