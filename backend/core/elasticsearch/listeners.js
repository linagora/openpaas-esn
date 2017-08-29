'use strict';

const utils = require('./utils');
const pubsub = require('../pubsub').local;
const logger = require('../logger');
const Q = require('q');

module.exports = {
  addListener,
  index,
  remove
};

function index(data, options, callback) {

  function _index() {
    const indexOptions = {
      denormalize: options.denormalize || function(data) {return data;},
      getId: options.getId,
      index: options.index,
      type: options.type,
      data: data
    };

    utils.indexData(indexOptions, (err, result) => {
      if (err) {
        logger.error('Error while adding data in index', err);
      } else {
        result && result.created ? logger.debug('Document indexed') : logger.debug('Document is not indexed');
      }

      callback && callback(err, result);
    });
  }

  (options.skip && options.skip.index || function() { return Q(false); })(data).then(skip => {
    if (skip) {
      return callback && callback();
    }

    _index();
  }, err => {
    logger.error('Error while checking index skip', err);
    callback(err);
  });
}

function remove(data, options, callback) {
  const indexOptions = {
    data: data,
    getId: options.getId,
    index: options.index,
    type: options.type
  };

  (options.skip && options.skip.remove || function() { return Q(false); })(data).then(skip => {
    if (skip) {
      return callback && callback();
    }

    utils.removeFromIndex(indexOptions, callback);
  }, err => {
    logger.error('Error while checking remove index skip', err);
    callback(err);
  });
}

function addListener(options) {

  function indexData(data, callback) {
    return index(data, options, callback);
  }

  function removeFromIndex(data, callback) {
    return remove(data, options, callback);
  }

  if (options.events.add) {
    pubsub.topic(options.events.add).subscribe(indexData);
  }

  if (options.events.update) {
    pubsub.topic(options.events.update).subscribe(indexData);
  }

  if (options.events.remove) {
    pubsub.topic(options.events.remove).subscribe(data => {
      removeFromIndex(data, err => {
        if (err) {
          logger.error('Error while removing data from index', err);
        }
      });
    });
  }

  return {
    indexData,
    removeFromIndex
  };
}
