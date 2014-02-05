'use strict';

var core = require('../../core');

function monitoring(req, res) {
  var data = {
    lag: core.monitoring.lag()
  };

  res.json(200, data);
}

module.exports = monitoring;
