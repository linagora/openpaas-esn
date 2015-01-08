'use strict';

var expect = require('chai').expect;

describe('load() method', function() {
  it('should call next with error if collaboration module sends back error on load', function(done) {

    var req = {
      lib: {
        queryOne: function(id, callback) {
          return callback(new Error());
        }
      },
      params: {
        id: 123
      }
    };

    var collaboration = require(this.testEnv.basePath + '/backend/webserver/middleware/collaboration');
    collaboration.load(req, {}, function(err) {
      expect(err).to.exist;
      done();
    });
  });

  it('should send back 404 if collaboration can not be found', function(done) {

    var res = {
      json: function(code) {
        expect(code).to.equal(404);
        done();
      }
    };

    var req = {
      lib: {
        queryOne: function(id, callback) {
          return callback();
        }
      },
      params: {
        id: 123
      }
    };

    var collaboration = require(this.testEnv.basePath + '/backend/webserver/middleware/collaboration');
    collaboration.load(req, res);
  });

  it('should set req.collaboration when collaboration can be found', function(done) {
    var collaboration = {_id: 123};

    var req = {
      lib: {
        queryOne: function(id, callback) {
          return callback(null, collaboration);
        },
        isMember: function(collaboration, user, callback) {
          return callback(null, true);
        }
      },
      params: {
        id: 123
      },
      user: {
        _id: 1
      }
    };
    var collaborationMW = require(this.testEnv.basePath + '/backend/webserver/middleware/collaboration');
    collaborationMW.load(req, {}, function(err) {
      expect(err).to.not.exist;
      expect(req.collaboration).to.exist;
      expect(req.collaboration).to.deep.equal(collaboration);
      done();
    });
  });

  it('should send back members array', function(done) {
    var collaboration = {_id: 123, members: [1, 2, 3]};

    var req = {
      lib: {
        queryOne: function(id, callback) {
          return callback(null, collaboration);
        },
        isMember: function(collaboration, user, callback) {
          return callback(null, true);
        }
      },
      params: {
        id: 123
      },
      user: {
        id: 1
      }
    };
    var collaborationMW = require(this.testEnv.basePath + '/backend/webserver/middleware/collaboration');
    collaborationMW.load(req, {}, function(err) {
      expect(err).to.not.exist;
      expect(req.collaboration).to.exist;
      expect(req.collaboration.members).to.deep.equal([1, 2, 3]);
      done();
    });
  });
});
