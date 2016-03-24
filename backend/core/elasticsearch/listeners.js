'use strict';

var utils = require('./utils');
var pubsub = require('../pubsub').local;
var logger = require('../logger');

function index(data, options, callback) {
  var indexOptions = {
    denormalize: options.denormalize || function(data) {return data;},
    getId: options.getId,
    index: options.index,
    type: options.type,
    data: data
  };
  utils.indexData(indexOptions, function(err, result) {
    if (err) {
      logger.error('Error while adding data in index', err);
    } else {
      logger.debug('Document indexed');
    }
    if (callback) {
      callback(err, result);
    }
  });
}
module.exports.index = index;

function addListener(options) {

  function indexData(data, callback) {
    return index(data, options, callback);
  }

  function removeFromIndex(data, callback) {
    var indexOptions = {
      data: data,
      getId: options.getId,
      index: options.index,
      type: options.type
    };
    utils.removeFromIndex(indexOptions, callback);
  }

  if (options.events.add) {
    pubsub.topic(options.events.add).subscribe(indexData);
  }

  if (options.events.update) {
    pubsub.topic(options.events.update).subscribe(indexData);
  }

  if (options.events.remove) {
    pubsub.topic(options.events.remove).subscribe(function(data) {
      removeFromIndex(data, function(err) {
        if (err) {
          logger.error('Error while removing data from index', err);
        }
      });
    });
  }

  return {
    indexData: indexData,
    removeFromIndex: removeFromIndex
  };
}
module.exports.addListener = addListener;
