'use strict';

var mockery = require('mockery');

describe('The WebSockets Event module', function() {

  var io = {
    sockets: {
      on: function() {}
    }
  };

  var initMock = function(callback) {
    return {
      init: function() { if (callback) { callback(); } }
    };
  };

  it('should initialize the activitystreams event', function(done) {
    mockery.registerMock('./notification/activitystreams', initMock(done));
    mockery.registerMock('./notification/conferences', initMock());
    mockery.registerMock('./notification/notifications', initMock());
    mockery.registerMock('./notification/usernotifications', initMock());
    mockery.registerMock('./notification/community', initMock());

    require(this.testEnv.basePath + '/backend/wsserver/events')(io);
  });

  it('should initialize the conferences event', function(done) {
    mockery.registerMock('./notification/activitystreams', initMock());
    mockery.registerMock('./notification/conferences', initMock(done));
    mockery.registerMock('./notification/notifications', initMock());
    mockery.registerMock('./notification/usernotifications', initMock());
    mockery.registerMock('./notification/community', initMock());

    require(this.testEnv.basePath + '/backend/wsserver/events')(io);
  });


  it('should initialize the notifications event', function(done) {
    mockery.registerMock('./notification/activitystreams', initMock());
    mockery.registerMock('./notification/conferences', initMock());
    mockery.registerMock('./notification/notifications', initMock(done));
    mockery.registerMock('./notification/usernotifications', initMock());
    mockery.registerMock('./notification/community', initMock());

    require(this.testEnv.basePath + '/backend/wsserver/events')(io);
  });

  it('should initialize the community event', function(done) {
    mockery.registerMock('./notification/activitystreams', initMock());
    mockery.registerMock('./notification/conferences', initMock());
    mockery.registerMock('./notification/notifications', initMock());
    mockery.registerMock('./notification/usernotifications', initMock(done));
    mockery.registerMock('./notification/community', initMock());

    require(this.testEnv.basePath + '/backend/wsserver/events')(io);
  });

  it('should initialize the usernotifications event', function(done) {
    mockery.registerMock('./notification/activitystreams', initMock());
    mockery.registerMock('./notification/conferences', initMock());
    mockery.registerMock('./notification/notifications', initMock());
    mockery.registerMock('./notification/usernotifications', initMock());
    mockery.registerMock('./notification/community', initMock(done));

    require(this.testEnv.basePath + '/backend/wsserver/events')(io);
  });

});
