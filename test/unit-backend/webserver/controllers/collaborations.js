'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');


describe('getMembers fn', function() {

  beforeEach(function() {
    mockery.registerMock('../../core/collaboration/index', {});
    mockery.registerMock('../../core/collaboration/permission', {});
    mockery.registerMock('../../core/user', {});
    mockery.registerMock('../../helpers/user', {});
    mockery.registerMock('../../core/user/domain', {});
  });

  it('should send back 500 if req.collaboration is undefined', function(done) {
    var res = {
      json: function(code) {
        expect(code).to.equal(500);
        done();
      }
    };

    var req = {};

    var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
    collaborations.getMembers(req, res);
  });

  it('should send back 500 if collaboration.getMembers returns error', function(done) {
    var res = {
      json: function(code) {
        expect(code).to.equal(500);
        done();
      }
    };

    var req = {
      params: {
        objectType: 'communty'
      },
      collaboration: {},
      query: function() {}
    };

    mockery.registerMock('../../core/collaboration/index', {
      getMembers: function(com, objectType, query, callback) {
        return callback(new Error());
      }
    });
    var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
    collaborations.getMembers(req, res);
  });

  it('should send back 200 is collaboration.getMembers returns result', function(done) {
    var res = {
      json: function(code) {
        expect(code).to.equal(200);
        done();
      },
      header: function() {}
    };

    var req = {
      params: {
        objectType: 'communty'
      },
      collaboration: {},
      query: function() {}
    };

    mockery.registerMock('../../core/collaboration/index', {
      getMembers: function(com, objectType, query, callback) {
        return callback(null, []);
      }
    });
    var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
    collaborations.getMembers(req, res);
  });

  it('should set the header with the members size', function(done) {
    var members = [1, 2, 3];

    var res = {
      json: function(code) {
        expect(code).to.equal(200);
        done();
      },
      header: function(name, value) {
        expect(name).to.equal('X-ESN-Items-Count');
        expect(value).to.equal(members.length);
      }
    };

    var req = {
      params: {
        objectType: 'communty'
      },
      collaboration: {
        members: members
      },
      query: function() {}
    };

    mockery.registerMock('../../core/collaboration/index', {
      getMembers: function(com, objectType, query, callback) {
        return callback(null, []);
      }
    });
    var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
    collaborations.getMembers(req, res);
  });

  it('should query user with request query parameters', function(done) {
    var members = [1, 2, 3];
    var limit = 23;
    var offset = 45;

    var res = {
      json: function(code) {
        expect(code).to.equal(200);
        done();
      },
      header: function(name, value) {
        expect(name).to.equal('X-ESN-Items-Count');
        expect(value).to.equal(members.length);
      }
    };

    var req = {
      params: {
        objectType: 'communty'
      },
      collaboration: {
        members: members
      },
      query: {
        limit: limit,
        offset: offset
      }
    };

    mockery.registerMock('../../core/collaboration/index', {
      getMembers: function(com, objectType, query, callback) {
        expect(query).to.exist;
        expect(query.limit).to.equal(limit);
        expect(query.offset).to.equal(offset);

        return callback(null, []);
      }
    });
    var collaborations = require(this.testEnv.basePath + '/backend/webserver/controllers/collaborations');
    collaborations.getMembers(req, res);
  });
});
