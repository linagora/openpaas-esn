'use strict';


function contactWebserverRoutes(app, contactLib, dependencies) {

  function views(req, res) {
    var templateName = req.params[0].replace(/\.html$/, '');
    res.render(templateName);
  }
  app.get('/views/*', views);

}

module.exports = contactWebserverRoutes;
