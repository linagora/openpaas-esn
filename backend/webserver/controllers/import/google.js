'use strict';
var googleContacts = require('../../../core/contact/google');

function getGoogleOAuthURL(req, res) {
  var oauth2Client = googleContacts.getGoogleOAuthClient(req.protocol + '://' + req.get('host'));
  var url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.google.com/m8/feeds'
  });
  res.json({url: url});
}
module.exports.getGoogleOAuthURL = getGoogleOAuthURL;


function fetchGoogleContacts(req, response) {
  if (!req.user || !req.user.emails || !req.user.emails.length) {
    return response.send(500, 'User not set');
  }

  var code = req.query.code;
  if (!code) {
    return response.redirect('/#/contacts');
  }

  googleContacts.fetchAndSaveGoogleContacts(req.protocol + '://' + req.get('host'), req.user, code, function(err) {
    if (err) {
      return response.json(500, {error: 500, message: 'Could not ' + err.step, details: err});
    }
    response.redirect('/#/contacts');
  });
}
module.exports.fetchGoogleContacts = fetchGoogleContacts;
