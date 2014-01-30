'use strict';

exports = module.exports = function(application) {

  require('./controllers/views')(application);
  require('./middleware/setup-routes')(application);

  var documentstore = require('./controllers/document-store');
  application.put('/api/document-store/connection', documentstore.store);
  application.get('/api/document-store/connection/:hostname/:port/:dbname', documentstore.test);

  application.get('/', function(req, res) {
    res.render('index');
  });
};

