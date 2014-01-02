var async = require('async');

function startWebServer(callback) {
  var webserver = require('./backend/webserver');
 
  if ( !webserver ) {
    return callback();
  }
  
  webserver.start(function(err) {
    if ( err ) {
      console.log('webserver failed to start:',err);
    }
    callback.apply(this,arguments);
  });
};

function startWsServer(callback) {
  var server = require('./backend/wsserver');
 
  if ( !server ) {
    return callback();
  }
  
  server.start(function(err) {
    if ( err ) {
      console.log('websocket server failed to start:',err);
    }
    callback.apply(this,arguments);
  });
};

function startCore(callback) {
  var error = null;
  try {
    var core = require('./backend/core');
    console.log('core bootstraped, configuration =',process.env.NODE_ENV);    
  } catch (err) {
    error = err;
    console.log('core failed to initialize:',err.stack);
  }
  callback.call(this,error);
};


async.series([startCore, startWebServer, startWsServer], function(err) {
  if ( err ) {
    console.log('Fatal error:',err);
    if ( err.stack ) {
      console.log(err.stack);
    }
    process.exit(1);
  }
  console.log('started');
});
