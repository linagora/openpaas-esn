const esnConfig = require('../../core/esn-config');
'use strict';

function getServices(req, res) {
  //jmap, imap, smtp, caldav (un endpoint par calendrier),
  const config = new esnConfig.EsnConfig();

  config.getMultiple(['mail', 'davserver', 'jmap']).then(result => res.status(200).json(result));
}

module.exports = {
  getServices
};
