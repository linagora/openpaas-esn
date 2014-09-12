'use strict';

var mockery = require('mockery');

describe('The WebSockets Event module', function() {

  it('should initialize the activitystreams event', function(done) {
    var io = {
      sockets: {
        on: function() {}
      }
    };

    var activitystreamsMock = {
      init: function() {
        done();
      }
    };
    mockery.registerMock('./notification/activitystreams', activitystreamsMock);

    var conferencesMock = {
      init: function() {}
    };
    mockery.registerMock('./notification/conferences', conferencesMock);

    var notificationsMock = {
      init: function() {}
    };
    mockery.registerMock('./notification/notifications', notificationsMock);

    var communityMock = {
      init: function() {}
    };
    mockery.registerMock('./notification/community', communityMock);

    require(this.testEnv.basePath + '/backend/wsserver/events')(io);
  });

  it('should initialize the conferences event', function(done) {
    var io = {
      sockets: {
        on: function() {}
      }
    };

    var activitystreamsMock = {
      init: function() {}
    };
    mockery.registerMock('./notification/activitystreams', activitystreamsMock);

    var conferencesMock = {
      init: function() {
        done();
      }
    };
    mockery.registerMock('./notification/conferences', conferencesMock);

    var notificationsMock = {
      init: function() {}
    };
    mockery.registerMock('./notification/notifications', notificationsMock);

    var communityMock = {
      init: function() {}
    };
    mockery.registerMock('./notification/community', communityMock);

    require(this.testEnv.basePath + '/backend/wsserver/events')(io);
  });


  it('should initialize the notifications event', function(done) {
    var io = {
      sockets: {
        on: function() {}
      }
    };

    var activitystreamsMock = {
      init: function() {}
    };
    mockery.registerMock('./notification/activitystreams', activitystreamsMock);

    var conferencesMock = {
      init: function() {}
    };
    mockery.registerMock('./notification/conferences', conferencesMock);

    var notificationsMock = {
      init: function() {
        done();
      }
    };
    mockery.registerMock('./notification/notifications', notificationsMock);

    var communityMock = {
      init: function() {}
    };
    mockery.registerMock('./notification/community', communityMock);

    require(this.testEnv.basePath + '/backend/wsserver/events')(io);
  });

  it('should initialize the community event', function(done) {
    var io = {
      sockets: {
        on: function() {}
      }
    };

    var activitystreamsMock = {
      init: function() {}
    };
    mockery.registerMock('./notification/activitystreams', activitystreamsMock);

    var conferencesMock = {
      init: function() {}
    };
    mockery.registerMock('./notification/conferences', conferencesMock);

    var notificationsMock = {
      init: function() {}
    };
    mockery.registerMock('./notification/notifications', notificationsMock);

    var communityMock = {
      init: function() {
        done();
      }
    };
    mockery.registerMock('./notification/community', communityMock);

    require(this.testEnv.basePath + '/backend/wsserver/events')(io);
  });

});
