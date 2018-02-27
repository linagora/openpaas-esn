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
  var dav, davServer;

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

    self.createDavServer = function(done) {
      var port = self.testEnv.serversConfig.express.port;
      var caldavConfiguration = {
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

    describe('GET /addressbooks', function() {

      it('should return 200 with the result', function(done) {
        var self = this;
        var called = false;

        var path = '/addressbooks/123/contacts.json';

        var result = [{foo: 'bar'}];
        dav.get(path, function(req, res) {
          called = true;
          return res.status(200).json(result);
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

    describe('The search contacts module', function() {

      describe('Single Properties search', function() {
        var localpubsub, globalpubsub;
        var contact;

        var search = function(term, expectedSize, done) {
          if (typeof expectedSize === 'function') {
            done = expectedSize;
            expectedSize = 1;
          }
          localpubsub.topic('contacts:contact:add').forward(globalpubsub, contact);
          var self = this;
          this.helpers.api.loginAsUser(this.app, user.emails[0], password, function(err, requestAsMember) {
            if (err) {
              return done(err);
            }

            self.helpers.elasticsearch.checkDocumentsIndexed({index: 'contacts.idx', type: 'contacts', ids: [contact.id]}, function(err) {
              if (err) {
                return done(err);
              }

              var req = requestAsMember(request(self.app).get(PREFIX + '/addressbooks/' + user._id + '/contacts.json'));
              req.query({search: term}).expect(200).end(function(err, res) {
                expect(err).to.not.exist;
                expect(res.body).to.exist;
                expect(res.headers['x-esn-items-count']).to.equal('' + expectedSize);
                done();
              });
            });
          });
        };

        beforeEach(function(done) {
          localpubsub = this.helpers.requireBackend('core/pubsub').local;
          globalpubsub = this.helpers.requireBackend('core/pubsub').global;
          contact = {
            user: user,
            contactId: '4db41c7b-c747-41fe-ad8f-c3aa584bf0d9',
            bookId: user._id.toString(),
            bookName: 'contacts',
            vcard: ['vcard', [
              ['version', {}, 'text', '4.0'],
              ['uid', {}, 'text', '3c6d4032-fce2-485b-b708-3d8d9ba280da'],
              ['fn', {}, 'text', 'Brubru Will'],
              ['n', {}, 'text', ['Willis', 'Bruce']],
              ['org', {}, 'text', 'Master of the world'],
              ['url', {}, 'uri', 'http://will.io'],
              ['socialprofile', {type: 'Twitter'}, 'text', '@twillis'],
              ['socialprofile', {type: 'Facebook'}, 'text', 'http://facebook.com/fbruce'],
              ['nickname', {}, 'text', 'Bruno'],
              ['email', {type: 'Home'}, 'text', 'mailto:me@home.com'],
              ['email', {type: 'Office'}, 'text', 'mailto:me@work.com'],
              ['adr', {type: 'Home'}, 'text', ['', '', '123 Main Street', 'Any Town', 'CA', '91921-1234', 'U.S.A.']]
            ]],
            id: '4db41c7b-c747-41fe-ad8f-c3aa584bf0d9'
          };
          this.helpers.redis.publishConfiguration();
          this.helpers.elasticsearch.saveTestConfiguration(this.helpers.callbacks.noError(done));
        });

        it('should return contact with matching firstname', function(done) {
          search.bind(this)('bruce', done);
        });

        it('should return contact with matching lastname', function(done) {
          search.bind(this)('willis', done);
        });

        it('should return contact with matching emails', function(done) {
          search.bind(this)('me@home', done);
        });

        it('should return contact with matching org', function(done) {
          search.bind(this)('master of', done);
        });

        it('should return contact with matching urls', function(done) {
          search.bind(this)('http://will.io', done);
        });

        it('should return contact with matching twitter socialprofile', function(done) {
          search.bind(this)('@twilli', done);
        });

        it('should return contact with matching facebook socialprofile', function(done) {
          search.bind(this)('facebook.com/fbru', done);
        });

        it('should return contact with matching nickname', function(done) {
          search.bind(this)('bruno', done);
        });

        it('should return contact with matching adr', function(done) {
          search.bind(this)('123 Main', done);
        });

        it('should not return result when contact is not a user one', function(done) {
          delete contact.user;
          search.bind(this)('123 Main', 0, done);
        });

        it('should not return result when contact is not in a user addressbook', function(done) {
          delete contact.bookId;
          search.bind(this)('123 Main', 0, done);
        });
      });
    });

    describe('PUT /addressbooks', function() {

      it('should return 201 with the result', function(done) {
        var self = this;
        var called = false;

        var path = '/addressbooks/123/contacts.json';
        var result = {_id: '123'};

        dav.put(path, function(req, res) {
          called = true;
          return res.status(201).json(result);
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

        dav.delete(path, function(req, res) {
          called = true;
          return res.status(204).end();
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

        dav.delete(path, function(req, res) {
          called = true;
          return res.status(204).end();
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

        dav.delete(path, function(req, res) {
          called = true;
          return res.status(204).end();
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

        dav.post(path, function(req, res) {
          called = true;
          return res.status(201).json(result);
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

    describe('POST /addressbooks/:bookId.json', function() {
      it('should respond 401 if user is not authenticated', function(done) {
        this.helpers.api.requireLogin(this.app, 'post', `${PREFIX}/addressbooks/123.json`, done);
      });

      it('should respond 400 if there is no addressbook type', function(done) {
        const self = this;
        const addressbook = {
          name: 'addressbook test',
          description: 'addressbook description'
        };

        self.createDavServer(err => {
          if (err) {
            return done(err);
          }

          self.helpers.api.loginAsUser(self.app, user.emails[0], password, (err, loggedInAsUser) => {
            if (err) {
              return done(err);
            }

            const req = loggedInAsUser(request(self.app).post(`${PREFIX}/addressbooks/123.json`));

            req.send(addressbook)
              .expect(400)
              .end((err, res) => {
                expect(err).to.not.exist;
                expect(res.body).to.deep.equal({
                  error: {
                    code: 400,
                    message: 'Bad Request',
                    details: 'Addressbook type is required'
                  }
                });
                done();
              });
          });
        });
      });

      it('should respond 400 if addressbook type is not supported', function(done) {
        const self = this;
        const addressbook = {
          name: 'addressbook test',
          description: 'addressbook description',
          type: 'unsupport type'
        };

        self.createDavServer(err => {
          if (err) {
            return done(err);
          }

          self.helpers.api.loginAsUser(self.app, user.emails[0], password, (err, loggedInAsUser) => {
            if (err) {
              return done(err);
            }

            const req = loggedInAsUser(request(self.app).post(`${PREFIX}/addressbooks/123.json`));

            req.send(addressbook)
              .expect(400)
              .end((err, res) => {
                expect(err).to.not.exist;
                expect(res.body).to.deep.equal({
                  error: {
                    code: 400,
                    message: 'Bad Request',
                    details: 'Addressbook type is not supported'
                  }
                });
                done();
              });
          });
        });
      });

      it('should respond 201 if success to create addressbook', function(done) {
        const self = this;
        let called = false;
        const path = '/addressbooks/123.json';
        const addressbook = {
          name: 'addressbook test',
          description: 'addressbook description',
          type: 'user'
        };

        dav.post(path, (req, res) => {
          called = true;

          return res.status(201).json();
        });

        self.createDavServer(err => {
          if (err) {
            return done(err);
          }

          self.helpers.api.loginAsUser(self.app, user.emails[0], password, (err, loggedInAsUser) => {
            if (err) {
              return done(err);
            }

            const req = loggedInAsUser(request(self.app).post(`${PREFIX}${path}`));

            req.send(addressbook)
              .expect(201)
              .end((err, res) => {
                expect(err).to.not.exist;
                expect(called).to.be.true;
                expect(res.body).to.deep.equal({
                  id: addressbook.name,
                  'dav:name': addressbook.name,
                  'carddav:description': addressbook.description,
                  'dav:acl': ['dav:read', 'dav:write'],
                  type: addressbook.type
                });
                done();
              });
          });
        });
      });
    });

    describe('DELETE /addressbooks/:bookId/:bookName.json', function() {
      it('should respond 401 if user is not authenticated', function(done) {
        this.helpers.api.requireLogin(this.app, 'delete', `${PREFIX}/addressbooks/123/test.json`, done);
      });

      it('should respond 204 if success to remove addressbook', function(done) {
        const self = this;
        let called = false;
        const path = '/addressbooks/123/test.json';

        dav.delete(path, (req, res) => {
          called = true;

          return res.status(204).json();
        });

        self.createDavServer(err => {
          if (err) {
            return done(err);
          }

          self.helpers.api.loginAsUser(self.app, user.emails[0], password, (err, loggedInAsUser) => {
            if (err) {
              return done(err);
            }

            const req = loggedInAsUser(request(self.app).delete(`${PREFIX}${path}`));

            req.expect(204)
              .end(err => {
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
