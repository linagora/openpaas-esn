'use strict';

var activitystreams = require('../../core/activitystreams');
var communityMiddleware = require('./community');
var streamsFinder = require('composable-middleware')();
var writableFinder = require('composable-middleware')();

var addStreamResourceFinder = function(finder) {
  if (finder) {
    streamsFinder.use(finder);
  }
};
module.exports.addStreamResourceFinder = addStreamResourceFinder;
addStreamResourceFinder(communityMiddleware.findStreamResource);

module.exports.findStreamResource = streamsFinder;

var addStreamWritableFinder = function(finder) {
  if (finder) {
    writableFinder.use(finder);
  }
};
module.exports.addStreamWritableFinder = addStreamWritableFinder;
addStreamWritableFinder(communityMiddleware.filterWritableTargets);

module.exports.filterWritableTargets = writableFinder;

module.exports.isValidStream = function(req, res, next) {
  var objectType = req.query.objectType ||  req.query.objectType;
  if (!objectType) {
    return res.json(400, { error: { status: 400, message: 'Bad request', details: 'objectType is mandatory'}});
  }

  var id = req.query.id;
  if (!id) {
    return res.json(400, { error: { status: 400, message: 'Bad request', details: 'ID is mandatory'}});
  }

  activitystreams.getUserStreams(req.user, null, function(err, streams) {
    if (err) {
      return res.json(500, { error: { status: 500, message: 'Bad request', details: err.message}});
    }

    if (!streams) {
      return res.json(400, { error: { status: 400, message: 'Bad request', details: 'User does not have any linked activitystream'}});
    }

    var belongs = streams.some(function(stream) {
      return stream.uuid === id;
    });

    if (belongs) {
      return next();
    }
    return res.json(400, { error: { status: 400, message: 'Bad request', details: 'User does not have access to the ativitystream ' + id}});
  });
};
