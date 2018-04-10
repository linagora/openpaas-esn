const composableMiddleware = require('composable-middleware');
const canCreateMiddlewares = {};
const linkUtils = require('../../core/resource-link/utils');
const logger = require('../../core/logger');

module.exports = {
  addCanCreateMiddleware,
  canCreate,
  canDelete,
  isLinkable,
  isResourceLink
};

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

function isResourceLink(req, res, next) {
  var link = req.body;

  if (!linkUtils.isValidLink(link)) {
    return res.status(400).json({error: {code: 400, message: 'Bad request', details: 'Request is not a valid resource-link'}});
  }

  req.link = link;
  next();
}

function canCreate(req, res, next) {
  const middleware = canCreateMiddlewares[req.link.type];

  if (!middleware) {
    return res.status(400).json({error: {code: 400, message: 'Bad request', details: 'Resource Link of type ' + req.link.type + ' can not be processed'}});
  }

  middleware(req, res, next);
}

function isLinkable(req, res, next) {
  if (!req.linkable) {
    return res.status(400).json({error: {code: 400, message: 'Bad request', details: 'Resources are not linkable'}});
  }

  next();
}

function canDelete(req, res, next) {
  if (!linkUtils.isOwnerLink(req.body.source.id, req.user._id)) {
    return res.status(403).json({error: {code: 403, message: 'Forbidden', details: 'Resource Link belongs to a different user'}});
  }

  next();
}
