'use strict';

var logger = require('../../../logger');
var elasticSearch = require('../../../elasticsearch/listeners');

module.exports = function(indexerOptions) {
  return function elasticSearchPlugin(schema) {
    schema.post('save', function() {
      logger.debug('About to index document', this);

      elasticSearch.index(this, indexerOptions, function(err, result) {
        if (err) {
          logger.error('Error while indexing', err);
        }
        logger.debug('Index result', result);
      });
    });
  };
};
