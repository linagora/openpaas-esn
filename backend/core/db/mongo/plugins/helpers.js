const mongoose = require('mongoose');
const User = mongoose.model('User');
const esPlugin = require('./elasticsearch');
const userListener = require('../../../user/listener');
const elasticSearch = require('../../../elasticsearch/listeners');
const logger = require('../../../logger');

module.exports = {
  applyPlugins,
  applyUserPlugins,
  patchFindOneAndUpdate
};

function applyUserPlugins() {
  User.schema.plugin(esPlugin(userListener.getOptions()));
}

function applyPlugins() {
  applyUserPlugins();
}

function patchFindOneAndUpdate() {
  const find = User.findOneAndUpdate;

  User.findOneAndUpdate = function() {
    const callback = arguments[arguments.length - 1];
    const cb = function(err, result) {
      if (err) {
        return callback(err);
      }

      elasticSearch.index(result, userListener.getOptions(), function(indexErr, indexResult) {
        if (indexErr) {
          logger.error('Error while indexing data', indexErr);
        }

        if (indexResult) {
          logger.debug('Data indexed', indexResult);
        }

        callback(err, result);
      });
    };

    arguments[arguments.length - 1] = cb;
    find.apply(this, arguments);
  };
}
