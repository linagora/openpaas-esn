'use strict';

var expect = require('chai').expect;
var request = require('supertest');

var express = require('express');
var bodyParser = require('body-parser');

describe('The addressbooks dav proxy', function() {
  var moduleName = 'linagora.esn.davproxy';
  var PREFIX = '/dav/api';
  var user;
  var password = 'secret';
  var dav, davServer, caldavConfiguration;

  beforeEach(function(done) {
    var self = this;

    this.mongoose = require('mongoose');

    this.testEnv.initRedisConfiguration(this.mongoose, function(err) {
      if (err) {
        return done(err);
      }

      self.helpers.modules.initMidway(moduleName, function(err) {
        if (err) {
          return done(err);
        }

        var wsserver = self.helpers.modules.getLib('linagora.esn.core.wsserver');

        wsserver.start('4500');

        self.helpers.modules.start(moduleName, function(err) {
          if (err) {
            return done(err);
          }
          self.helpers.api.applyDomainDeployment('linagora_IT', function(err, models) {
            if (err) {
              return done(err);
            }
            user = models.users[0];
            self.models = models;
            done();
          });
        });
      });
    });
  });

  beforeEach(function() {
    var self = this;

    dav = express();
    dav.use(bodyParser.json());
    dav.propfind(`/principals/users/${user._id}`, function(req, res) {
      res.status(200).json({});
    });

    self.createDavServer = function(done) {
      var port = self.testEnv.serversConfig.express.port;

      caldavConfiguration = {
        backend: {
          url: 'http://localhost:' + port
        },
        frontend: {
          url: 'http://localhost:' + port
        }
      };

      davServer = dav.listen(port, function() {
        self.helpers.requireBackend('core/esn-config')('davserver').store(caldavConfiguration, done);
      });
    };

    self.shutdownDav = function(done) {
      if (!davServer) {
        return done();
      }

      try {
        davServer.close(function() {
          done();
        });
      } catch (e) {
        done();
      }
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
      describe('should proxy headers', function() {
        it('should return 200 with the result', function(done) {
          var self = this;
          var yo = 'lo';
          var lo = 'yo';

          var path = '/addressbooks/123/contacts/456.vcf';
          var called = false;

          // only contact update and deletion proxy the header
          dav.delete(path, function(req, res) {
            expect(req.headers.yo).to.equal(yo);
            expect(req.headers.lo).to.equal(lo);
            called = true;

            return res.status(200).end();
          });

          self.createDavServer(function(err) {
            if (err) {
              return done(err);
            }

            self.helpers.api.loginAsUser(self.app, user.emails[0], password, function(err, loggedInAsUser) {
              if (err) {
                return done(err);
              }

              var req = loggedInAsUser(request(self.app).delete(PREFIX + path));

              req.set('yo', yo);
              req.set('lo', lo);
              req.expect(200).end(function(err) {
                expect(err).to.not.exist;
                expect(called).to.be.true;
                done();
              });
            });
          });
        });
      });
    });
  });
});
