'use strict';

//
// Load all the fixtures and inject in storage using ESN Config module
//

var fs = require('fs');
var path = require('path');

var exit = function(status) {
  process.exit(status);
};

require('./config')(function(err) {
  if (err) {
    // aborting, we may not be able to load other fixtures if the database has not been configured
    console.log('[ERROR] Can not load config fixtures, aborting...');
    exit(1);
  } else {
    require('./esn-config')(function(err) {
      if (err) {
        console.log('[ERROR] ', err.message);
      } else {
        exit();
      }
    });
  }
});