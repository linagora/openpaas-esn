'use strict';

var expect = require('chai').expect,
  request = require('supertest'),
  mockery = require('mockery'),
  mongoose = require('mongoose');

describe('The invitation controller', function() {
  var Invitation;

  before(function() {
    //load the schema
    this.testEnv.writeDBConfigFile();
  });

  after(function() {
    this.testEnv.removeDBConfigFile();
  });

  describe('PUT /api/invitation', function() {
    var webserver = null;
    var handler = {
      init: function(invitation, cb) {
        console.log('Init');
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
      mongoose.connect(this.testEnv.mongoUrl);
      mockery.registerMock('../../core/invitation', handler);
      webserver = require(this.testEnv.basePath + '/backend/webserver');
      require(this.testEnv.basePath + '/backend/core/db/mongo/models/invitation');
      Invitation = mongoose.model('Invitation');
    });

    it('should fail on empty payload', function(done) {
      request(webserver.application).put('/api/invitation').expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail on missing type', function(done) {
      request(webserver.application).put('/api/invitation').send({name: 'hiveety'}).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail on any other JSON data', function(done) {
      request(webserver.application).put('/api/invitation').send({ foo: 'bar', baz: 1}).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should save the invitation', function(done) {
      var invitation = { type: 'test'};
      request(webserver.application).put('/api/invitation').send(invitation).expect(201).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        expect(res.body.uuid).to.be.not.null;
        done();
      });
    });
  });

  describe('PUT /api/invitation/:uuid', function() {
    var webserver = null;
    var called = false;
    var handler = {
      finalize: function(req, res, next) {
        called = true;
        return res.send(201);
      }
    };

    beforeEach(function() {
      mongoose.connect(this.testEnv.mongoUrl);
      mockery.registerMock('../../core/invitation', handler);
      webserver = require(this.testEnv.basePath + '/backend/webserver');
      require(this.testEnv.basePath + '/backend/core/db/mongo/models/invitation');
      Invitation = mongoose.model('Invitation');
    });

    it('should fail if UUID is unknown', function(done) {
      var data = { foo: 'bar'};
      request(webserver.application).put('/api/invitation/123456789').send(data).expect(404).end(function(err, res) {
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
        request(webserver.application).put('/api/invitation/' + invitation.uuid).send(data).expect(201).end(function(err, res) {
          expect(err).to.be.null;
          expect(called).to.be.true;
          done();
        });
      });
    });
  });

  describe('GET /api/invitation', function() {
    var webserver = null;

    before(function() {
      webserver = require(this.testEnv.basePath + '/backend/webserver');
    });

    it('should return 404 on root resource', function(done) {
      request(webserver.application).get('/api/invitation').expect(404).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should return 404 on unknown resource', function(done) {
      request(webserver.application).get('/api/invitation/123').expect(404).end(function(err, res) {
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
        request(webserver.application).get('/api/invitation/' + invitation.uuid).expect(200).end(function(err, res) {
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
