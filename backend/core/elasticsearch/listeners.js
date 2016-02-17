'use strict';

var utils = require('./utils');
var pubsub = require('../pubsub').global;
var logger = require('../logger');

module.exports.addListener = function(options) {

  function index(data) {
    var indexOptions = {
      denormalize: options.denormalize || function(data) {return data;},
      index: options.index,
      type: options.type,
      data: data
    };
    utils.indexData(indexOptions, function(err) {
      if (err) {
        return logger.error('Error while adding data in index', err);
      }
      logger.debug('Document indexed');
    });
  }

  if (options.events.add) {
    pubsub.topic(options.events.add).subscribe(index);
  }

  if (options.events.update) {
    pubsub.topic(options.events.update).subscribe(index);
  }

  if (options.events.remove) {
    pubsub.topic(options.events.remove).subscribe(function(data) {
      var indexOptions = {
        data: data,
        index: options.index,
        type: options.type
      };
      utils.removeFromIndex(indexOptions, function(err) {
        if (err) {
          logger.error('Error while removing data from index', err);
        }
      });
    });
  }
};
