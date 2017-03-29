'use strict';

const path = require('path');

module.exports = {
  FRONTEND_PATH: path.normalize(__dirname + '/../../frontend'),
  CORE_FRONTEND_PATH: path.normalize(path.dirname(require.main.filename) + '/frontend')
};
