'use strict';

var mockery = require('mockery');
var chai = require('chai');
var expect = chai.expect;

describe('The project module', function() {

  var module;
  var deps = {
    collaboration: {},
    community: {},
    logger: {
      error: function() {},
      info: function() {},
      warning: function() {}
    }
  };

  var dependencies = function(name) {
    return deps[name];
  };

  describe('The getUserProjects function', function() {

    beforeEach(function() {
      mockery.registerMock('../backend/db/mongo/project', function() {});
      module = require('../../../lib/index')(dependencies);
    });

    it('should fail when userId is undefined', function(done) {
      module.getUserProjects(null, {}, this.helpers.callbacks.error(done));
    });

    it('should get all the projects where the user is member of a collaboration linked ot the project', function(done) {
      var communities = [{_id: 1}, {_id: 2}];
      deps.community.getUserCommunities = function(user, options, callback) {
        return callback(null, communities);
      };

      deps.collaboration.query = function(type, q, callback) {
        expect(type).to.equal('project');
        expect(q.$or.length).to.equal(communities.length + 1);
        done();
      };
      module.getUserProjects(1, {});
    });

    it('should query with input options', function(done) {
      var communities = [{_id: 1}, {_id: 2}];
      var options = {member: true, domainid: 1, name: 'My name'};
      var user = 'userA';
      var query = {'$elemMatch': { 'member.objectType': 'user', 'member.id': user}};

      deps.community.getUserCommunities = function(user, options, callback) {
        expect(options.member).to.equal(options.member);
        return callback(null, communities);
      };

      deps.collaboration.query = function(type, q) {
        expect(q.$or.pop().members).to.deep.equal(query);
        expect(q.domain_ids).to.equal(options.domainid);
        expect(q.title).to.equal(options.name);
        done();
      };
      module.getUserProjects(user, options);
    });

    it('should filter writable projects when options is set to true', function(done) {
      var user = 'userA';
      var communities = [{_id: 1}, {_id: 2}];
      deps.community.getUserCommunities = function(user, options, callback) {
        return callback(null, communities);
      };

      deps.collaboration.query = function(type, q, callback) {
        expect(type).to.equal('project');
        expect(q.$or.length).to.equal(communities.length + 1);
        return callback(null, communities);
      };

      deps.collaboration.permission = {
        filterWritable: function(collaborations, tuple, callback) {
          expect(collaborations.length).to.equal(communities.length);
          expect(tuple).to.deep.equal({objectType: 'user', id: user});
          done();
        }
      };

      module.getUserProjects(user, {writable: true});

    });

    it('should send back error when query fails', function(done) {
      var user = 'userA';
      var communities = [{_id: 1}, {_id: 2}];
      deps.community.getUserCommunities = function(user, options, callback) {
        return callback(null, communities);
      };

      deps.collaboration.query = function(type, q, callback) {
        return callback(new Error());
      };

      deps.collaboration.permission = {
        filterWritable: function() {
          done(new Error());
        }
      };
      module.getUserProjects(user, {writable: true}, this.helpers.callbacks.error(done));
    });

    it('should send back empty array when query sends back nothing', function(done) {
      var user = 'userA';
      var communities = [{_id: 1}, {_id: 2}];
      deps.community.getUserCommunities = function(user, options, callback) {
        return callback(null, communities);
      };

      deps.collaboration.query = function(type, q, callback) {
        return callback();
      };

      deps.collaboration.permission = {
        filterWritable: function() {
          done(new Error());
        }
      };
      module.getUserProjects(user, {writable: true}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.empty;
        done();
      });
    });

    it('should send back empty array when query sends back empty array', function(done) {
      var user = 'userA';
      var communities = [{_id: 1}, {_id: 2}];
      deps.community.getUserCommunities = function(user, options, callback) {
        return callback(null, communities);
      };

      deps.collaboration.query = function(type, q, callback) {
        return callback(null, []);
      };

      deps.collaboration.permission = {
        filterWritable: function() {
          done(new Error());
        }
      };
      module.getUserProjects(user, {writable: true}, function(err, result) {
        expect(err).to.not.exist;
        expect(result).to.be.empty;
        done();
      });
    });

  });
});
