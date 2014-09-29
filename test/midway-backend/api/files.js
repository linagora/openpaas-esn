'use strict';

var expect = require('chai').expect;
var request = require('supertest');

describe('The files API', function() {
  var webserver, filestore;
  var domain, user;
  var password = 'secret';

  beforeEach(function() {
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/domain');
    require(this.testEnv.basePath + '/backend/core/db/mongo/models/user');
    filestore = require(this.testEnv.basePath + '/backend/core/filestore');
  });

  beforeEach(function(done) {
    var self = this;
    this.testEnv.initCore(function() {
      webserver = require(self.testEnv.basePath + '/backend/webserver');
      self.mongoose = require('mongoose');
      done();
    });
  });

  beforeEach(function(done) {
    this.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
      if (err) { return done(err); }
      domain = models.domain;
      user = models.users[0];
      done();
    });
  });

  afterEach(function(done) {
    this.mongoose.connection.db.dropDatabase();
    this.mongoose.disconnect(done);
  });

  describe('POST /api/files', function() {
    it('should send back 401 when not logged in', function(done) {
      request(webserver.application).post('/api/files').expect(401).end(function(err, res) {
        expect(err).to.be.null;
        done();
      });
    });

    it('should create the file', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(webserver.application, user.emails[0], password, function(err, loggedInAsUser) {
        if (err) { return done(err); }
        var req = loggedInAsUser(request(webserver.application).post('/api/files'));
        req.query({ 'size': 11, 'mimetype': 'text/plain', 'name': 'fname'})
           .set('Content-Type', 'text/plain')
           .send('hello world')
           .expect(201)
           .end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.body._id).to.exist;

          filestore.get(res.body._id, function(err, meta, readStream) {
            if (err) { return done(err); }
            self.helpers.api.getStreamData(readStream, function(data) {
              expect(data).to.equal('hello world');
              expect(meta.contentType).to.equal('text/plain');
              expect(meta.length).to.equal(11);
              expect(meta.metadata.name).to.equal('fname');
              done();
            });
          });
        });
      });
    });

    it('should create the file without a name', function(done) {
      var self = this;
      this.helpers.api.loginAsUser(webserver.application, user.emails[0], password, function(err, loggedInAsUser) {
        if (err) { return done(err); }
        var req = loggedInAsUser(request(webserver.application).post('/api/files'));
        req.query({ 'size': 11, 'mimetype': 'text/plain' })
           .set('Content-Type', 'text/plain')
           .send('hello world')
           .expect(201)
           .end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.body._id).to.exist;

          filestore.get(res.body._id, function(err, meta, readStream) {
            if (err) { return done(err); }
            self.helpers.api.getStreamData(readStream, function(data) {
              expect(data).to.equal('hello world');
              expect(meta.contentType).to.equal('text/plain');
              expect(meta.length).to.equal(11);
              expect(meta.metadata).to.be.an('object');
              expect(meta.metadata.name).to.not.exist;
              done();
            });
          });
        });
      });
    });

    it('should not create the file if the size param is missing', function(done) {
      this.helpers.api.loginAsUser(webserver.application, user.emails[0], password, function(err, loggedInAsUser) {
        if (err) { return done(err); }
        var req = loggedInAsUser(request(webserver.application).post('/api/files'));
        req.query({ 'mimetype': 'text/plain' })
           .set('Content-Type', 'text/plain')
           .send('hello world')
           .expect(400)
           .end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.body.error).to.equal(400);
          done();
        });
      });
    });

    it('should not create the file if the mimetype param is missing', function(done) {
      this.helpers.api.loginAsUser(webserver.application, user.emails[0], password, function(err, loggedInAsUser) {
        if (err) { return done(err); }
        var req = loggedInAsUser(request(webserver.application).post('/api/files'));
        req.query({ 'size': 11 })
           .set('Content-Type', 'text/plain')
           .send('hello world')
           .expect(400)
           .end(function(err, res) {
          expect(err).to.not.exist;
          expect(res.body).to.exist;
          expect(res.body.error).to.equal(400);
          done();
        });
      });
    });

    it('should set the current user as creator in file metadata', function(done) {
      this.helpers.api.loginAsUser(webserver.application, user.emails[0], password, function(err, loggedInAsUser) {
        if (err) { return done(err); }
        var req = loggedInAsUser(request(webserver.application).post('/api/files'));
        req.query({ 'size': 15, 'mimetype': 'text/plain', 'name': 'creator'})
          .set('Content-Type', 'text/plain')
          .send('testing creator')
          .expect(201)
          .end(function(err, res) {
            expect(err).to.not.exist;
            expect(res.body).to.exist;
            expect(res.body._id).to.exist;

            filestore.getMeta(res.body._id, function(err, meta) {
              if (err) { return done(err); }
              if (!meta) {
                return done(new Error('Meta should exist'));
              }

              expect(meta.metadata).to.exist;
              expect(meta.metadata.creator).to.exist;
              expect(meta.metadata.creator.objectType).to.equal('user');
              expect(meta.metadata.creator.id + '').to.equal(user._id + '');
              done();
            });
          });
      });
    });
  });
});
