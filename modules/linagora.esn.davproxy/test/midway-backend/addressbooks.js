'use strict';

var expect = require('chai').expect;
var request = require('supertest');

var express = require('express');
var bodyParser = require('body-parser');

describe('The addressbooks dav proxy', function() {
  var moduleName = 'linagora.esn.davproxy';
  var PREFIX = '/dav/api';
  var domain;
  var user;
  var password = 'secret';

  beforeEach(function(done) {
    var self = this;
    this.helpers.modules.initMidway(moduleName, function(err) {
      if (err) {
        return done(err);
      }

      self.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
        if (err) {
          return done(err);
        }
        domain = models.domain;
        user = models.users[0];
        self.models = models;
        done();
      });
    });
  });

  beforeEach(function() {
    var self = this;

    self.dav = express();
    self.dav.use(bodyParser.json());

    self.createDavServer = function(done) {
      var self = this;

      var port = self.testEnv.serversConfig.express.port;
      var caldavConfiguration = {
        _id: 'davserver',
        backend: {
          url: 'http://localhost:' + port
        },
        frontend: {
          url: 'http://localhost:' + port
        }
      };

      self.davServer = self.dav.listen(port, function() {
        self.helpers.mongo.saveDoc('configuration', caldavConfiguration, done);
      });
    };

    self.shutdownDav = function(done) {
      if (!self.davServer) {
        return done();
      }

      self.davServer.close(function() {
        done();
      });
    };
  });

  afterEach(function(done) {
    var self = this;
    self.shutdownDav(function() {
      self.helpers.api.cleanDomainDeployment(self.models, function() {
        self.helpers.mongo.dropCollections(done);
      });
    });
  });

  describe('addressbooks proxy', function() {

    beforeEach(function() {
      var expressApp = require('../../backend/webserver/application')(this.helpers.modules.current.deps);
      expressApp.use(PREFIX + '/addressbooks', this.helpers.modules.current.lib.api.addressbooks);
      this.app = this.helpers.modules.getWebServer(expressApp);
    });

    describe('headers', function() {
      it('should proxy headers', function() {
        it('should return 200 with the result', function(done) {
          var self = this;
          var yo = 'lo';
          var lo = 'yo';

          var path = '/addressbooks/123/contacts.json';
          var called = false;

          self.dav.get(path, function(req, res) {
            expect(req.headers.yo).to.equal(yo);
            expect(req.headers.lo).to.equal(lo);
            called = true;
            return res.send(200);
          });

          self.createDavServer(function(err) {
            if (err) {
              return done(err);
            }

            self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, loggedInAsUser) {
              if (err) {
                return done(err);
              }

              var req = loggedInAsUser(request(self.app).get(PREFIX + path));
              req.set('yo', yo);
              req.set('lo', lo);
              req.expect(200).end(function(err, done) {
                expect(err).to.not.exist;
                expect(called).to.be.true;
                done();
              });
            });
          });
        });
      });
    });

    describe('GET /addressbooks', function() {

      it('should return 200 with the result', function(done) {
        var self = this;
        var called = false;

        var path = '/addressbooks/123/contacts.json';

        var result = [{foo: 'bar'}];
        self.dav.get(path, function(req, res) {
          called = true;
          return res.json(200, result);
        });

        self.createDavServer(function(err) {
          if (err) {
            return done(err);
          }

          self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }

            var req = loggedInAsUser(request(self.app).get(PREFIX + path));
            req.expect(200).end(function(err, res) {
              expect(err).to.not.exist;
              expect(called).to.be.true;
              expect(res.body).to.deep.equal(result);
              done();
            });
          });
        });
      });
    });

    describe('PUT /addressbooks', function() {

      it('should return 201 with the result', function(done) {
        var self = this;
        var called = false;

        var path = '/addressbooks/123/contacts.json';
        var result = {_id: '123'};

        self.dav.put(path, function(req, res) {
          called = true;
          return res.json(201, result);
        });

        self.createDavServer(function(err) {
          if (err) {
            return done(err);
          }

          self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }

            var req = loggedInAsUser(request(self.app).put(PREFIX + path));
            req.expect(201).end(function(err, res) {
              expect(err).to.not.exist;
              expect(called).to.be.true;
              expect(res.body).to.deep.equal(result);
              done();
            });
          });
        });
      });
    });

    describe('DELETE /addressbooks', function() {

      it('should return 204', function(done) {
        var self = this;
        var called = false;

        var path = '/addressbooks/123/contacts.json';

        self.dav.delete(path, function(req, res) {
          called = true;
          return res.send(204);
        });

        self.createDavServer(function(err) {
          if (err) {
            return done(err);
          }

          self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }

            var req = loggedInAsUser(request(self.app). delete(PREFIX + path));
            req.expect(204).end(function(err) {
              expect(err).to.not.exist;
              expect(called).to.be.true;
              done();
            });
          });
        });
      });
    });

    describe('DELETE /addressbooks/:bookId/contacts/:contactId.vcf', function() {

      it('should return 401 if user is not authenticated', function(done) {
        var self = this;
        self.createDavServer(function() {
          self.helpers.api.requireLogin(self.app, 'delete', PREFIX + '/addressbooks/123/contacts/456.vcf', done);
        });
      });

      it('should return 204', function(done) {
        var self = this;
        var called = false;

        var path = '/addressbooks/123/contacts/456.vcf';

        self.dav.delete(path, function(req, res) {
          called = true;
          return res.send(204);
        });

        self.createDavServer(function(err) {
          if (err) {
            return done(err);
          }

          self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }

            var req = loggedInAsUser(request(self.app).del(PREFIX + path));
            req.expect(204).end(function(err) {
              expect(err).to.not.exist;
              expect(called).to.be.true;
              done();
            });
          });
        });
      });
    });

    describe('DELETE /addressbooks/:bookId/contacts/:contactId.vcf with graceperiod', function() {

      it('should return 401 if user is not authenticated', function(done) {
        var self = this;
        self.createDavServer(function() {
          self.helpers.api.requireLogin(self.app, 'delete', PREFIX + '/addressbooks/123/contacts/456.vcf?graceperiod=10000', done);
        });
      });

      it('should return 202', function(done) {
        var self = this;
        var called = false;

        var path = '/addressbooks/123/contacts/456.vcf?graceperiod=10000';

        self.dav.delete(path, function(req, res) {
          called = true;
          return res.send(204);
        });

        self.createDavServer(function(err) {
          if (err) {
            return done(err);
          }

          self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }

            var req = loggedInAsUser(request(self.app).del(PREFIX + path));
            req.expect(202).end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.headers['x-esn-task-id']).to.be.a.string;
              expect(called).to.be.false;
              done();
            });
          });
        });
      });
    });

    describe('POST /addressbooks', function() {

      it('should return 201 with the result', function(done) {
        var self = this;
        var called = false;

        var path = '/addressbooks/123/contacts';
        var result = {_id: '123'};

        self.dav.post(path, function(req, res) {
          called = true;
          return res.json(201, result);
        });

        self.createDavServer(function(err) {
          if (err) {
            return done(err);
          }

          self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, loggedInAsUser) {
            if (err) {
              return done(err);
            }

            var req = loggedInAsUser(request(self.app).post(PREFIX + path));
            req.expect(201).end(function(err, res) {
              expect(err).to.not.exist;
              expect(res.body).to.exist;
              expect(called).to.be.true;
              expect(res.body).to.deep.equal(result);
              done();
            });
          });
        });
      });
    });
  });
});
