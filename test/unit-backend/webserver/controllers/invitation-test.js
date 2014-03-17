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

  describe('POST /api/invitation', function() {
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

    beforeEach(function(done) {
      this.mongoose = require('mongoose');
      var self = this;
      this.mongoose.connect(this.testEnv.mongoUrl, function(err) {
        if (err) {
          return done(err);
        }
        mockery.registerMock('../../core/invitation', handler);
        Invitation = require(self.testEnv.basePath + '/backend/core/db/mongo/models/invitation');
        webserver = require(self.testEnv.basePath + '/backend/webserver');
        done();
      });
    });

    afterEach(function(done) {
      this.mongoose.connection.db.dropDatabase();
      this.mongoose.disconnect(done);
    });

    it('should fail on empty payload', function(done) {
      request(webserver.application).post('/api/invitation').expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail on missing type', function(done) {
      request(webserver.application).post('/api/invitation').send({name: 'hiveety'}).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should fail on any other JSON data', function(done) {
      request(webserver.application).post('/api/invitation').send({ foo: 'bar', baz: 1}).expect(400).end(function(err, res) {
        expect(err).to.be.null;
        expect(res.body).to.be.not.null;
        done();
      });
    });

    it('should save the invitation', function(done) {
      var invitation = { type: 'test', data: {}};
      request(webserver.application).post('/api/invitation').send(invitation).expect(201).end(function(err, res) {
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

    beforeEach(function(done) {
      this.mongoose = require('mongoose');
      var self = this;
      this.mongoose.connect(this.testEnv.mongoUrl, function(err) {
        if (err) {
          return done(err);
        }
        mockery.registerMock('../../core/invitation', handler);
        Invitation = require(self.testEnv.basePath + '/backend/core/db/mongo/models/invitation');
        webserver = require(self.testEnv.basePath + '/backend/webserver');
        done();
      });
    });

    afterEach(function(done) {
      this.mongoose.connection.db.dropDatabase();
      this.mongoose.disconnect(done);
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

    beforeEach(function(done) {
      this.mongoose = require('mongoose');
      var self = this;
      this.mongoose.connect(this.testEnv.mongoUrl, function(err) {
        if (err) {
          return done(err);
        }
        Invitation = require(self.testEnv.basePath + '/backend/core/db/mongo/models/invitation');
        webserver = require(self.testEnv.basePath + '/backend/webserver');
        done();
      });
    });

    afterEach(function(done) {
      this.mongoose.connection.db.dropDatabase();
      this.mongoose.disconnect(done);
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
