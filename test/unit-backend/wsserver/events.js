'use strict';

var mockery = require('mockery');

describe('The WebSockets Event module', function() {

  it('should initialize the activitystream event', function(done) {
    var io = {
      sockets: {
        on: function() {}
      }
    };

    var activitystreamMock = {
      init: function() {
        done();
      }
    };
    mockery.registerMock('./notification/activitystreams', activitystreamMock);

    require(this.testEnv.basePath + '/backend/wsserver/events')(io);
  });

});