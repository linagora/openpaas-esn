'use strict';

var expect = require('chai').expect,
  request = require('supertest'),
  mockery = require('mockery');

describe('The invitation controller', function() {
  var Invitation;

  before(function() {
    this.testEnv.writeDBConfigFile();
  });

  after(function() {
    this.testEnv.removeDBConfigFile();
  });

  describe('POST /api/invitations', function() {
    var webserver = null;
    var handler = {
      init: function(invitation, cb) {
        return cb(null, invitation);
      },
      process: function(req, res, next) {
        return next(null, true);
      },
      validate: function(invitation, cb) {
        if (!invitation) {
          return cb(new Error('invitation is null'));
        }
        if (!invitation.type) {
          return cb(new Error('type is null'));
        }
        return cb(null, true);
      },
      bar: function() {

      }
    };

    beforeEach(function() {
      this.testEnv.initCore();
      this.mongoose = require('mongoose');
      mockery.registerMock('../../core/invitation', handler);
      webserver = require(this.testEnv.basePath + '/backend/webserver');
      require(this.testEnv.basePath + '/backend/core/db/mongo/models/invitation');
      Invitation = this.mongoose.model('Invitation');
    });

    it('should fail on empty payload', function(done) {
      request(webserver.application).post('/api/invitations').expect(400).end(function(err, res) {
        console.log(err);
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail on missing type', function(done) {
      request(webserver.application).post('/api/invitations').send({name: 'hiveety'}).expect(400).end(function(err, res) {
        console.log(err);
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail on any other JSON data', function(done) {
      request(webserver.application).post('/api/invitations').send({ foo: 'bar', baz: 1}).expect(400).end(function(err, res) {
        console.log(err);
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should save the invitation', function(done) {
      var invitation = { type: 'test', data: {}};
      request(webserver.application).post('/api/invitations').send(invitation).expect(201).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        expect(res.body.uuid).to.be.not.null;
        done();
      });
    });
  });

  describe('PUT /api/invitations/:uuid', function() {
    var webserver = null;
    var called = false;
    var handler = {
      finalize: function(invitation, data, done) {
        called = true;
        return done(null, true);
      }
    };

    beforeEach(function() {
      this.testEnv.initCore();
      this.mongoose = require('mongoose');
      mockery.registerMock('../../core/invitation', handler);
      webserver = require(this.testEnv.basePath + '/backend/webserver');
      require(this.testEnv.basePath + '/backend/core/db/mongo/models/invitation');
      Invitation = this.mongoose.model('Invitation');
    });

    it('should fail if UUID is unknown', function(done) {
      var data = { foo: 'bar'};
      request(webserver.application).put('/api/invitations/123456789').send(data).expect(404).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should finalize the invitation process', function(done) {
      var json = {type: 'finalizetest'};
      var i = new Invitation(json);
      i.save(function(err, invitation) {
        if (err) {
          return done(err);
        }
        var data = { foo: 'bar'};
        request(webserver.application).put('/api/invitations/' + invitation.uuid).send(data).expect(201).end(function(err, res) {
          expect(err).to.be.null;
          expect(called).to.be.true;
          done();
        });
      });
    });
  });

  describe('GET /api/invitations', function() {
    var webserver = null;

    beforeEach(function(done) {
      this.testEnv.initCore(function() {
        this.mongoose = require('mongoose');
        Invitation = this.mongoose.model('Invitation');
        webserver = require(this.testEnv.basePath + '/backend/webserver');
        done();
      }.bind(this));
    });

    it('should return 404 on root resource', function(done) {
      request(webserver.application).get('/api/invitations').expect(404).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return 404 on unknown resource', function(done) {
      request(webserver.application).get('/api/invitations/123').expect(404).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return invitation for valid UUID', function(done) {
      var json = {type: 'test'};
      var i = new Invitation(json);
      i.save(function(err, invitation) {
        if (err) {
          return done(err);
        }
        request(webserver.application).get('/api/invitations/' + invitation.uuid).expect(200).end(function(err, res) {
          expect(err).to.be.null;
          expect(res.body).to.exist;
          expect(res.body.uuid).to.equals(invitation.uuid);
          expect(res.body.type).to.equals(json.type);
          done();
        });
      });
    });
  });
});
