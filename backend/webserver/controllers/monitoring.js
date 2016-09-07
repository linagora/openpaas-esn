'use strict';

var core = require('../../core');

function monitoring(req, res) {
  var data = {
    lag: core.monitoring.lag()
  };

  res.status(200).json(data);
}

module.exports = monitoring;
