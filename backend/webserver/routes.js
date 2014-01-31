'use strict';

exports = module.exports = function(application) {

  var views = require('./controllers/views');
  application.get('/views/*', views.views);

  require('./middleware/setup-routes')(application);

  var documentstore = require('./controllers/document-store');
  application.put('/api/document-store/connection', documentstore.store);
  application.get('/api/document-store/connection/:hostname/:port/:dbname', documentstore.test);
};

