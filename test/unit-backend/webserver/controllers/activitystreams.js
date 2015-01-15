'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The activitystreams controller module', function() {

  it('get should return HTTP 400 when activity_stream is not set', function(done) {
    this.helpers.mock.models({
      Community: {
        getFromActivityStreamID: function(uuid, cb) {
          return cb(null, {});
        }
      }
    });
    var activitystreams = require(this.testEnv.basePath + '/backend/webserver/controllers/activitystreams');
    var req = {
      params: {}
    };

    var res = {
      json: function(code) {
        expect(code).to.equal(400);
        done();
      }
    };

    activitystreams.get(req, res);
  });

  it('get should return HTTP 500 timeline module returns error', function(done) {
    var domain = {
      _id: '123456789'
    };
    this.helpers.mock.models({
      Community: {
        getFromActivityStreamID: function(uuid, cb) {
          return cb(null, domain);
        }
      }
    });


    var timelineMock = {
      query: function(options, cb) {
        return cb(new Error());
      }
    };
    mockery.registerMock('../../core/activitystreams', timelineMock);

    var activitystreams = require(this.testEnv.basePath + '/backend/webserver/controllers/activitystreams');
    var req = {
      params: {
        uuid: '12345'
      },
      query: {},
      activity_stream: {}
    };

    var res = {
      json: function(code) {
        expect(code).to.equal(500);
        done();
      }
    };
    activitystreams.get(req, res);
  });

  it('get should return timeline as JSON', function(done) {
    var domain = {
      _id: '123456789'
    };

    var timeline = [
      {_id: 1},
      {_id: 2}
    ];

    this.helpers.mock.models({
      Community: {
        getFromActivityStreamID: function(uuid, cb) {
          return cb(null, domain);
        }
      }
    });

    var timelineMock = {
      query: function(options, cb) {
        return cb(null, timeline);
      },
      permission: {
        canRead: function(timelineEntry, tuple, callback) {
          return callback(null, true);
        }
      }
    };
    mockery.registerMock('../../core/activitystreams', timelineMock);

    var activitystreams = require(this.testEnv.basePath + '/backend/webserver/controllers/activitystreams');
    var req = {
      params: {
        uuid: '12345'
      },
      query: {},
      activity_stream: {},
      user: {
        _id: '123'
      }
    };

    var res = {
      json: function(result) {
        expect(result).to.be.an.array;
        expect(result).to.deep.equal(timeline);
        done();
      }
    };
    activitystreams.get(req, res);
  });

  it('get should return HTTP 400 when limit parameter is negative', function(done) {
    this.helpers.mock.models({
      Community: {
        getFromActivityStreamID: function(uuid, cb) {
          return cb(null, {});
        }
      }
    });
    var activitystreams = require(this.testEnv.basePath + '/backend/webserver/controllers/activitystreams');
    var req = {
      params: {
        uuid: '12345'
      },
      query: {limit: -12},
      activity_stream: {}
    };

    var res = {
      json: function(code) {
        expect(code).to.equal(400);
        done();
      }
    };

    activitystreams.get(req, res);
  });

  it('get should return HTTP 400 when before parameter is not an ObjectId as a String', function(done) {
    var mongooseMock = this.helpers.mock.models({
      Community: {
        getFromActivityStreamID: function(uuid, cb) {
          return cb(null, {});
        }
      }
    });

    mongooseMock.__replaceObjectId(function() {
      throw new Error('mock error');
    });

    var activitystreams = require(this.testEnv.basePath + '/backend/webserver/controllers/activitystreams');
    var req = {
      params: {
        uuid: '12345'
      },
      query: {before: 12345},
      activity_stream: {}
    };

    var res = {
      json: function(code) {
        expect(code).to.equal(400);
        done();
      }
    };

    activitystreams.get(req, res);
  });

  it('getMine should return 400 when req.user is undefined', function(done) {
    this.helpers.mock.models({});

    var activitystreams = require(this.testEnv.basePath + '/backend/webserver/controllers/activitystreams');
    var req = {
      params: {
        uuid: '12345'
      }
    };

    var res = {
      json: function(code) {
        expect(code).to.equal(400);
        done();
      }
    };

    activitystreams.getMine(req, res);
  });

  it('getMine should return 500 when activitystreams module sends back error', function(done) {
    this.helpers.mock.models({});

    mockery.registerMock('../../core/activitystreams', {
      getUserStreams: function(user, options, cb) {
        return cb(new Error());
      }
    });

    var activitystreams = require(this.testEnv.basePath + '/backend/webserver/controllers/activitystreams');
    var req = {
      user: {
        _id: '12345'
      }
    };

    var res = {
      json: function(code) {
        expect(code).to.equal(500);
        done();
      }
    };
    activitystreams.getMine(req, res);
  });

  it('getMine should return 200 when activitystreams module sends back streams', function(done) {
    this.helpers.mock.models({});

    mockery.registerMock('../../core/activitystreams', {
      getUserStreams: function(user, options, cb) {
        return cb(null, [{_id: 123}]);
      }
    });

    var activitystreams = require(this.testEnv.basePath + '/backend/webserver/controllers/activitystreams');
    var req = {
      user: {
        _id: '12345'
      }
    };

    var res = {
      json: function(code, result) {
        expect(code).to.equal(200);
        expect(result).to.exist;
        expect(result.length).to.equal(1);
        done();
      }
    };
    activitystreams.getMine(req, res);
  });

  it('getMine should return 200 when activitystreams module sends back nothing', function(done) {
    this.helpers.mock.models({});

    mockery.registerMock('../../core/activitystreams', {
      getUserStreams: function(user, options, cb) {
        return cb();
      }
    });

    var activitystreams = require(this.testEnv.basePath + '/backend/webserver/controllers/activitystreams');
    var req = {
      user: {
        _id: '12345'
      }
    };

    var res = {
      json: function(code, result) {
        expect(code).to.equal(200);
        expect(result).to.exist;
        expect(result.length).to.equal(0);
        done();
      }
    };
    activitystreams.getMine(req, res);
  });

});
