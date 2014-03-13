var async = require('async');

function startWebServer(callback) {
  if ( !config.webserver.enabled ) {
    return callback();
  }
  
  var webserver = require('./backend/webserver');
 
  webserver.start(config.webserver.port, config.webserver.virtualhosts, function(err) {
    if ( err ) {
      console.log('webserver failed to start:',err);
      if ( err.syscall === 'listen' && err.code === 'EADDRINUSE' ) {
        console.log('Something is already listening on the webserver port', config.webserver.port);
      }
    }
    callback.apply(this,arguments);
  });
};

function startWsServer(callback) {
  if ( !config.wsserver.enabled ) {
    return callback();
  }
  
  var server = require('./backend/wsserver');
   
  server.start(config.wsserver.port, function(err) {
    if ( err ) {
      console.log('websocket server failed to start:',err);
    }
    callback.apply(this,arguments);
  });
};

var core = require('./backend/core');
core.init();
console.log('core bootstraped, configuration =',process.env.NODE_ENV);    
var config = core.config('default');


async.series([core.templates.inject, startWebServer, startWsServer], function(err) {
  if ( err ) {
    console.log('Fatal error:',err);
    if ( err.stack ) {
      console.log(err.stack);
    }
    process.exit(1);
  }
  console.log('started');
});
