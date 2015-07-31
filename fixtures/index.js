'use strict';

//
// Load all the fixtures and inject in all configuration resources.
// 1. Push the ../config files (local configuration, may be used in next steps)
// 2. Store the ESN configuration files into mongo
//
// Each configuration feature live in its module. On each module, index.js will be called and
// it is up to the index to copy/store/inject configuration at the rigth place.
//

var copyFileConfig = require('./config');
var setEsnConfig = require('./esn-config');
var populateDb = require('./populate');

module.exports = function(done) {
  copyFileConfig()
    .then(setEsnConfig)
    .then(populateDb)
    .then(function() {
      console.log('Created 1 domain, 1 community, 20 users and 1 admin.');
      console.log('Success ! You have a working ESN !');
      done(true);
    })
    .catch (function(err) {
      console.log('[ERROR] Cannot inject fixtures, aborting...');
      console.log('[ERROR] ', err.message);
      done(false);
    });
};
