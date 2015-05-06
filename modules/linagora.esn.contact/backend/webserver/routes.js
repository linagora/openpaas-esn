'use strict';


function contactWebserverRoutes(app) {

  function views(req, res) {
    var templateName = req.params[0].replace(/\.html$/, '');
    res.render(templateName);
  }
  app.get('/contacts/views/*', views);

}

module.exports = contactWebserverRoutes;
