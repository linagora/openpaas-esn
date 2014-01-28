//
// Settings resource.
//

'use strict';

var path = require('path');

exports = module.exports = function(application) {

  var root = path.resolve(__dirname + '/../../..');
  var config = require('../../core').config('default');
  var settings = root + '/config/default.settings.json';

  if (config.core && config.core.config && config.core.config.jsonstore) {
    settings = path.resolve(root + '/' + config.core.config.jsonstore);
  }
  var store = require('../../core/config/jsonstore')(settings);

  application.get('/api/settings', function(req, res) {
    store.all(function(err, data) {
      if (err) {
        console.log(err);
        return res.json(500, { error: 'Can not get settings configuration'});
      }
      res.json(data);
    });
  });

  application.get('/api/settings/:name', function(req, res) {
    store.get(req.params.name, function(err, data) {
      if (err) {
        console.log(err);
        return res.json(500, { error: 'Can not get settings for ' + req.params.name});
      }
      res.json(data);
    });
  });

  application.post('/api/settings/:name', function(req, res) {
    if (!req.params.name) {
      return res.json(400, {error: 'Bad request, settings key can not be empty'});
    }

    store.push(req.params.name, req.body, function(err, data) {
      if (err) {
        console.log(err);
        return res.json(500, { error: 'Can not get settings for ' + req.params.name});
      }
      res.send(200);
    });
  });
};

