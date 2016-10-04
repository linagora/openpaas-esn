'use strict';

var resourceLink = require('../../core/resource-link');
var logger = require('../../core/logger');

function create(req, res) {
  var link = req.link;

  resourceLink.create(link).then(function(result) {
    logger.debug('Resource has been linked', link);
    res.status(201).json(result);
  }, function(err) {
    logger.error('Resource has not been linked', link, err);
    res.status(500).json({
      error: 500,
      message: 'Server Error',
      details: err.message
    });
  });
}

function remove(req, res) {
  var link = req.body;

  resourceLink.remove(link).then(
    function(result) {
    logger.debug('Resource has been removed', link);
    res.status(204).json();
  },
   function(err) {
    logger.error('Resource has not been removed', link, err);
    res.status(500).json({
      error: {
        code: 500,
        message: 'Server Error',
        details: err.message
      }
    });
  });
}

exports.create = create;
exports.remove = remove;
