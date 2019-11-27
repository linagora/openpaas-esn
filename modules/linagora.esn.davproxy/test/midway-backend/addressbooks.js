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

    describe('PROPFIND /addressbooks/:bookHome/:bookName.json', function() {
      it('should return 404 if address book not found', function(done) {
        const path = '/addressbooks/123/contacts.json';
        let called = false;

        dav.propfind(path, (req, res) => {
          called = true;

          return res.status(404).json([]);
        });

        this.createDavServer(err => {
          if (err) {
            return done(err);
          }

          this.helpers.api.loginAsUser(this.app, user.emails[0], password, (err, loggedInAsUser) => {
            if (err) {
              return done(err);
            }

            const req = loggedInAsUser(request(this.app).propfind(PREFIX + path));

            req.expect(404).end((err, res) => {
              expect(err).to.not.exist;
              expect(called).to.be.true;
              expect(res.body).to.deep.equal({
                error: {
                  code: 404,
                  message: 'Not Found',
                  details: 'Addressbook contacts is not found'
                }
              });

              done();
            });
          });
        });
      });
    });

    describe('The search contacts module', function() {

      describe('Single Properties search', function() {
        var localpubsub;
        var contact;

        beforeEach(function() {
          dav.report('/addressbooks', (req, res) =>
            res.status(207).send(`<?xml version="1.0" encoding="utf-8" ?>
                      <d:multistatus xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:carddav">
                        <d:response>
                          <d:href></d:href>
                          <d:propstat>
                            <d:prop>
                              <d:getetag></d:getetag>
                              <card:address-data></card:address-data>
                            </d:prop>
                            <d:status>HTTP/1.1 200 OK</d:status>
                          </d:propstat>
                        </d:response>
                      </d:multistatus>`
            )
          );

          dav.get('/addressbooks/' + user._id + '.json', (req, res) =>
            res.status(200).json({
              _embedded: {
                'dav:addressbook': [{
                  _links: {
                    self: { href: PREFIX + '/addressbooks/' + user._id + '/contacts.json' }
                  }
                }]
              }
            })
          );
        });

        var search = function(term, expectedSize, done) {
          if (typeof expectedSize === 'function') {
            done = expectedSize;
            expectedSize = 1;
          }
          localpubsub.topic('elasticsearch:contact:added').publish(contact);
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
          contact = {
            userId: user._id.toString(),
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
          this.helpers.redis.publishConfiguration(this.helpers.callbacks.noErrorAnd(() => {
            this.helpers.elasticsearch.saveTestConfiguration(this.helpers.callbacks.noError(done));
          }));
        });

        it('should return contact with matching firstname', function(done) {
          const self = this;

          self.createDavServer(self.helpers.callbacks.noErrorAnd(() => search.bind(self)('bruce', done)));
        });

        it('should return contact with matching lastname', function(done) {
          const self = this;

          self.createDavServer(self.helpers.callbacks.noErrorAnd(() => search.bind(this)('willis', done)));
        });

        it('should return contact with matching emails', function(done) {
          const self = this;

          self.createDavServer(self.helpers.callbacks.noErrorAnd(() => search.bind(this)('me@home', done)));
        });

        it('should return contact with matching org', function(done) {
          const self = this;

          self.createDavServer(self.helpers.callbacks.noErrorAnd(() => search.bind(this)('master of', done)));
        });

        it('should return contact with matching urls', function(done) {
          const self = this;

          self.createDavServer(self.helpers.callbacks.noErrorAnd(() => search.bind(this)('http://will.io', done)));
        });

        it('should return contact with matching twitter socialprofile', function(done) {
          const self = this;

          self.createDavServer(self.helpers.callbacks.noErrorAnd(() => search.bind(this)('@twilli', done)));
        });

        it('should return contact with matching facebook socialprofile', function(done) {
          const self = this;

          self.createDavServer(self.helpers.callbacks.noErrorAnd(() => search.bind(this)('facebook.com/fbru', done)));
        });

        it('should return contact with matching nickname', function(done) {
          const self = this;

          self.createDavServer(self.helpers.callbacks.noErrorAnd(() => search.bind(this)('bruno', done)));
        });

        it('should return contact with matching adr', function(done) {
          const self = this;

          self.createDavServer(self.helpers.callbacks.noErrorAnd(() => search.bind(this)('123 Main', done)));
        });

        it('should not return result when contact is not in a user addressbook', function(done) {
          const self = this;

          self.createDavServer(self.helpers.callbacks.noErrorAnd(() => {
            delete contact.bookId;
            search.bind(this)('123 Main', 0, done);
          }));
        });
      });
    });

    describe('PUT /addressbooks', function() {

      it('should return 201 with the result', function(done) {
        var self = this;
        var called = false;

        var path = '/addressbooks/123/contacts.vcf';
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

      it('should respond 400 if there is no addressbook id', function(done) {
        const self = this;
        const addressbook = {
          description: 'addressbook description',
          type: 'user'
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
                    details: 'Addressbook id is required'
                  }
                });
                done();
              });
          });
        });
      });

      it('should respond 400 if there is no addressbook name', function(done) {
        const self = this;
        const addressbook = {
          id: '4e2a6aef-d443-4709-b925-d9585ebc9109',
          description: 'addressbook description',
          type: 'user'
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
                    details: 'Addressbook name is required'
                  }
                });
                done();
              });
          });
        });
      });

      it('should respond 400 if there is no addressbook type', function(done) {
        const self = this;
        const addressbook = {
          id: '4e2a6aef-d443-4709-b925-d9585ebc9109',
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
          id: '4e2a6aef-d443-4709-b925-d9585ebc9109',
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
        const bookId = '59c86d0ec89099103b0bafbf';
        const path = `/addressbooks/${bookId}.json`;
        const addressbook = {
          id: '4e2a6aef-d443-4709-b925-d9585ebc9109',
          name: 'addressbook test',
          description: 'addressbook description',
          type: 'user',
          state: 'enabled'
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
              .end(err => {
                expect(err).to.not.exist;
                expect(called).to.be.true;
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

    describe('PUT /addressbooks/:bookId/:bookName.json', function() {
      it('should respond 401 if user is not authenticated', function(done) {
        this.helpers.api.requireLogin(this.app, 'put', `${PREFIX}/addressbooks/123/test.json`, done);
      });

      it('should respond 204 if success to update addressbook', function(done) {
        const self = this;
        let called = false;
        const path = '/addressbooks/123/test.json';
        const addressBookToUpdate = {
          name: 'modified addressbook name',
          description: 'modified addressbook description',
          state: 'modified addressbook state'
        };

        dav.proppatch(path, (req, res) => {
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

            const req = loggedInAsUser(request(self.app).put(`${PREFIX}${path}`));

            req.send(addressBookToUpdate)
              .expect(204)
              .end(err => {
                expect(err).to.not.exist;
                expect(called).to.be.true;
                done();
              });
          });
        });
      });
    });

    describe('MOVE /addressbook/:bookId/:bookName/:cardId.vcf', function() {
      it('should respond 401 if user is not authenticated', function(done) {
        this.helpers.api.requireLogin(this.app, 'move', `${PREFIX}/addressbooks/123/contacts/456.vcf`, done);
      });

      it('should respond 400 if there is no destination in request headers', function(done) {
        const self = this;

        self.createDavServer(err => {
          if (err) {
            return done(err);
          }

          self.helpers.api.loginAsUser(self.app, user.emails[0], password, (err, loggedInAsUser) => {
            if (err) {
              return done(err);
            }

            const req = loggedInAsUser(request(self.app).move(`${PREFIX}/addressbooks/123/contacts/456.vcf`));

            req.expect(400)
              .end((err, res) => {
                expect(err).to.not.exist;
                expect(res.body).to.deep.equal({
                  error: {
                    code: 400,
                    message: 'Bad Request',
                    details: 'The destination header is required'
                  }
                });
                done();
              });
          });
        });
      });

      it('should return 201 with the result', function(done) {
        const self = this;
        const path = '/addressbooks/123/contacts/456.vcf';
        let called = false;

        dav.get(path, (req, res) => res.status(200).json({}));
        dav.move(path, (req, res) => {
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

            const req = loggedInAsUser(request(self.app).move(`${PREFIX}${path}`));

            req.header.destination = '789';
            req.expect(201).end(err => {
              expect(err).to.not.exist;
              expect(called).to.be.true;
              done();
            });
          });
        });
      });
    });

    describe('POST /addressbook/:bookHome.json', function() {
      it('should respond 201 if success to create subscription', function(done) {
        const self = this;
        const path = '/addressbooks/123.json';

        const addressbook = {
          id: '4e2a6aef-d443-4709-b925-d9585ebc9109',
          name: 'addressbook name',
          description: 'addressbook description',
          type: 'subscription',
          'openpaas:source': {
            _links: {
              self: {
                href: '/addressbooks/abc/456.json'
              }
            }
          }
        };

        dav.post(path, (req, res) => res.status(201).json({}));

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
              .end(err => {
                expect(err).to.not.exist;
                done();
              });
          });
        });
      });

      it('should return 400 if address book type is subscription but no openpaas:source present in request body', function(done) {
        const self = this;
        const path = '/addressbooks/123.json';
        const addressbook = {
          id: '4e2a6aef-d443-4709-b925-d9585ebc9109',
          name: 'addressbook name',
          description: 'addressbook description',
          type: 'subscription'
        };

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
              .expect(400)
              .end((err, res) => {
                expect(err).to.not.exist;
                expect(res.body).to.deep.equal({
                  error: {
                    code: 400,
                    message: 'Bad Request',
                    details: 'openpaas:source is required for subscription'
                  }
                });
                done();
              });
          });
        });
      });
    });

    describe('GET /addressbook/:bookHome.json', function() {
      it('should respond 401 if user is not authenticated', function(done) {
        this.helpers.api.requireLogin(this.app, 'get', `${PREFIX}/addressbooks/123.json`, done);
      });

      describe('With search query', function() {
        let localpubsub;
        let contact1, contact2;

        beforeEach(function(done) {

          localpubsub = this.helpers.requireBackend('core/pubsub').local;
          contact1 = {
            userId: user._id.toString(),
            contactId: '4db41c7b-c747-41fe-ad8f-c3aa584bf0d9',
            bookId: user._id.toString(),
            bookName: 'contacts',
            vcard: ['vcard', [
              ['version', {}, 'text', '4.0'],
              ['uid', {}, 'text', '3c6d4032-fce2-485b-b708-3d8d9ba280da'],
              ['n', {}, 'text', ['Willis', 'Bruce']]
            ]],
            id: '4db41c7b-c747-41fe-ad8f-c3aa584bf0d9'
          };

          contact2 = {
            userId: user._id.toString(),
            contactId: '4dbasc7b-cd47-41fe-ac8f-c3aks2k3nf0d9',
            bookId: user._id.toString(),
            bookName: 'collected',
            vcard: ['vcard', [
              ['version', {}, 'text', '4.0'],
              ['uid', {}, 'text', '3cdq4032-fcs2-4g5w-bc0c-wo2o0aa280da'],
              ['n', {}, 'text', ['Justin', 'Bruce']]
            ]],
            id: '4dbasc7b-cd47-41fe-ac8f-c3aks2k3nf0d9'
          };

          this.helpers.elasticsearch.saveTestConfiguration(err => {
            if (err) return done(err);

            localpubsub.topic('elasticsearch:contact:added').publish(contact1);
            localpubsub.topic('elasticsearch:contact:added').publish(contact2);

            this.helpers.elasticsearch.checkDocumentsIndexed({ index: 'contacts.idx', type: 'contacts', ids: [contact1.id, contact2.id] }, err => {
              if (err) return done(err);

              done();
            });
          });
        });

        it('should respond 403 if user try to use others\' bookHome', function(done) {
          const path = '/addressbooks/123456.json?search=abc';
          const self = this;

          self.helpers.api.loginAsUser(self.app, user.emails[0], password, (err, loggedInAsUser) => {
            if (err) {
              return done(err);
            }

            const req = loggedInAsUser(request(self.app).get(`${PREFIX}${path}`));

            req.expect(403).end((err, res) => {

              expect(err).to.not.exist;
              expect(res.body).to.deep.equal({
                error: {
                  code: 403,
                  message: 'Forbidden',
                  details: 'User do not have the required privileges for this bookHome'
                }
              });
              done();
            });
          });
        });

        it('should respond 200 with empty result if user try to search on unavailable bookNames', function(done) {
          const self = this;
          const path = `/addressbooks/${user.id}.json?search=456&bookName=unavailableBookName,unavailableBookName2`;

          dav.get(`/addressbooks/${user.id}.json`, (req, res) => res.status(200).json({
              _embedded: {
                'dav:addressbook': [{
                  _links: {
                    self: {
                      href: `addressbooks/${user.id}/availableBookName.json`
                    }
                  }
                }]
              }
            })
          );

          self.createDavServer(err => {
            if (err) {
              return done(err);
            }

            self.helpers.api.loginAsUser(self.app, user.emails[0], password, (err, loggedInAsUser) => {
              if (err) {
                return done(err);
              }

              const req = loggedInAsUser(request(self.app).get(`${PREFIX}${path}`));

              req.expect(200).end((err, res) => {
                expect(err).to.not.exist;
                expect(res.headers['x-esn-items-count']).to.equal('0');
                expect(res.body).to.deep.equal({
                  _links: {
                    self: {
                      href: `/dav/api${path}`
                    }
                  },
                  _total_hits: 0,
                  _current_page: '1',
                  _embedded: {
                    'dav:item': []
                  }
                });
                done();
              });
            });
          });
        });

        it('should respond 200 with result if user search contact on a specific available bookName', function(done) {
          const self = this;
          const path = `/addressbooks/${user.id}.json?search=bruce&bookName=contacts`;

          dav.report('/addressbooks', (req, res) =>
            res.status(207).send(`<?xml version="1.0" encoding="utf-8" ?>
                      <d:multistatus xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:carddav">
                        <d:response>
                          <d:href>/addressbooks/${contact1.bookId}/${contact1.bookName}/${contact1.contactId}.vcf</d:href>
                          <d:propstat>
                            <d:prop>
                              <d:getetag></d:getetag>
                              <card:address-data></card:address-data>
                            </d:prop>
                            <d:status>HTTP/1.1 200 OK</d:status>
                          </d:propstat>
                        </d:response>
                      </d:multistatus>`
            )
          );

          dav.get(`/addressbooks/${user.id}.json`, (req, res) => res.status(200).json({
              _embedded: {
                'dav:addressbook': [{
                  _links: {
                    self: {
                      href: `addressbooks/${user.id}/contacts.json`
                    }
                  }
                }, {
                  _links: {
                    self: {
                      href: `addressbooks/${user.id}/collected.json`
                    }
                  }
                }]
              }
            })
          );

          self.createDavServer(err => {
            if (err) {
              return done(err);
            }

            self.helpers.api.loginAsUser(self.app, user.emails[0], password, (err, loggedInAsUser) => {
              if (err) {
                return done(err);
              }

              const req = loggedInAsUser(request(self.app).get(`${PREFIX}${path}`));

              req.expect(200).end((err, res) => {
                expect(err).to.not.exist;
                expect(res.body._embedded['dav:item'][0]._links.self.href).to.include(`/addressbooks/${contact1.bookId}/${contact1.bookName}/${contact1.contactId}.vcf`);
                expect(res.headers['x-esn-items-count']).to.equal('1');
                done();
              });
            });
          });
        });

        it('should respond 200 with result if user search contact on available bookNames', function(done) {
          const self = this;
          const path = `/addressbooks/${user.id}.json?search=bruce&bookName=contacts,collected`;

          dav.report('/addressbooks', (req, res) =>
            res.status(207).send(`<?xml version="1.0" encoding="utf-8" ?>
                      <d:multistatus xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:carddav">
                        <d:response>
                          <d:href>/addressbooks/${contact1.bookId}/${contact1.bookName}/${contact1.contactId}.vcf</d:href>
                          <d:propstat>
                            <d:prop>
                              <d:getetag></d:getetag>
                              <card:address-data></card:address-data>
                            </d:prop>
                            <d:status>HTTP/1.1 200 OK</d:status>
                          </d:propstat>
                        </d:response>
                        <d:response>
                          <d:href>/addressbooks/${contact2.bookId}/${contact2.bookName}/${contact2.contactId}.vcf</d:href>
                          <d:propstat>
                            <d:prop>
                              <d:getetag></d:getetag>
                              <card:address-data></card:address-data>
                            </d:prop>
                            <d:status>HTTP/1.1 200 OK</d:status>
                          </d:propstat>
                        </d:response>
                      </d:multistatus>`
            )
          );

          dav.get(`/addressbooks/${user.id}.json`, (req, res) => res.status(200).json({
              _embedded: {
                'dav:addressbook': [{
                  _links: {
                    self: {
                      href: `addressbooks/${user.id}/contacts.json`
                    }
                  }
                }, {
                  _links: {
                    self: {
                      href: `addressbooks/${user.id}/collected.json`
                    }
                  }
                }]
              }
            })
          );

          self.createDavServer(err => {
            if (err) {
              return done(err);
            }

            self.helpers.api.loginAsUser(self.app, user.emails[0], password, (err, loggedInAsUser) => {
              if (err) {
                return done(err);
              }

              const req = loggedInAsUser(request(self.app).get(`${PREFIX}${path}`));

              req.expect(200).end((err, res) => {
                expect(err).to.not.exist;
                expect(res.body._embedded['dav:item'][0]._links.self.href).to.include(`/addressbooks/${contact1.bookId}/${contact1.bookName}/${contact1.contactId}.vcf`);
                expect(res.body._embedded['dav:item'][1]._links.self.href).to.include(`/addressbooks/${contact2.bookId}/${contact2.bookName}/${contact2.contactId}.vcf`);
                expect(res.headers['x-esn-items-count']).to.equal('2');
                done();
              });
            });
          });
        });

        it('should respond 200 with the result of searching on all available bookNames if there is no bookName specified', function(done) {
          const self = this;
          const path = `/addressbooks/${user.id}.json?search=bruce`;

          dav.report('/addressbooks', (req, res) =>
            res.status(207).send(`<?xml version="1.0" encoding="utf-8" ?>
                      <d:multistatus xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:carddav">
                        <d:response>
                          <d:href>/addressbooks/${contact1.bookId}/${contact1.bookName}/${contact1.contactId}.vcf</d:href>
                          <d:propstat>
                            <d:prop>
                              <d:getetag></d:getetag>
                              <card:address-data></card:address-data>
                            </d:prop>
                            <d:status>HTTP/1.1 200 OK</d:status>
                          </d:propstat>
                        </d:response>
                        <d:response>
                          <d:href>/addressbooks/${contact2.bookId}/${contact2.bookName}/${contact2.contactId}.vcf</d:href>
                          <d:propstat>
                            <d:prop>
                              <d:getetag></d:getetag>
                              <card:address-data></card:address-data>
                            </d:prop>
                            <d:status>HTTP/1.1 200 OK</d:status>
                          </d:propstat>
                        </d:response>
                      </d:multistatus>`
            )
          );

          dav.get(`/addressbooks/${user.id}.json`, (req, res) => res.status(200).json({
              _embedded: {
                'dav:addressbook': [{
                  _links: {
                    self: {
                      href: `addressbooks/${user.id}/contacts.json`
                    }
                  }
                }, {
                  _links: {
                    self: {
                      href: `addressbooks/${user.id}/collected.json`
                    }
                  }
                }]
              }
            })
          );

          self.createDavServer(err => {
            if (err) {
              return done(err);
            }

            self.helpers.api.loginAsUser(self.app, user.emails[0], password, (err, loggedInAsUser) => {
              if (err) {
                return done(err);
              }

              const req = loggedInAsUser(request(self.app).get(`${PREFIX}${path}`));

              req.expect(200).end((err, res) => {
                expect(err).to.not.exist;
                expect(res.body._embedded['dav:item'][0]._links.self.href).to.include(`/addressbooks/${contact1.bookId}/${contact1.bookName}/${contact1.contactId}.vcf`);
                expect(res.body._embedded['dav:item'][1]._links.self.href).to.include(`/addressbooks/${contact2.bookId}/${contact2.bookName}/${contact2.contactId}.vcf`);
                expect(res.headers['x-esn-items-count']).to.equal('2');
                done();
              });
            });
          });
        });

        it('should respond 200 with the result of searching on all available bookNames includes subscription address books', function(done) {
          const self = this;
          const path = `/addressbooks/${user.id}.json?search=bruce`;
          const sourceUserId = 'sourceUserId';
          const subscribedBookName = 'subscription';
          const contact3 = {
            userId: sourceUserId,
            contactId: '5acb4d8d458d4c3e008b4567',
            bookId: sourceUserId,
            bookName: 'collected',
            vcard: ['vcard', [
              ['version', {}, 'text', '4.0'],
              ['uid', {}, 'text', '30f712b2-2a3d-4966-b6f2-5cd11d7f5652'],
              ['n', {}, 'text', ['Le', 'Bruce']]
            ]],
            id: '5acb4d8d458d4c3e008b4567'
          };

          dav.report('/addressbooks', (req, res) =>
            res.status(207).send(`<?xml version="1.0" encoding="utf-8" ?>
                      <d:multistatus xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:carddav">
                        <d:response>
                          <d:href>/addressbooks/${contact1.bookId}/${contact1.bookName}/${contact1.contactId}.vcf</d:href>
                          <d:propstat>
                            <d:prop>
                              <d:getetag></d:getetag>
                              <card:address-data></card:address-data>
                            </d:prop>
                            <d:status>HTTP/1.1 200 OK</d:status>
                          </d:propstat>
                        </d:response>
                        <d:response>
                          <d:href>/addressbooks/${contact2.bookId}/${contact2.bookName}/${contact2.contactId}.vcf</d:href>
                          <d:propstat>
                            <d:prop>
                              <d:getetag></d:getetag>
                              <card:address-data></card:address-data>
                            </d:prop>
                            <d:status>HTTP/1.1 200 OK</d:status>
                          </d:propstat>
                        </d:response>
                        <d:response>
                          <d:href>/addressbooks/${contact3.bookId}/${contact3.bookName}/${contact3.contactId}.vcf</d:href>
                          <d:propstat>
                            <d:prop>
                              <d:getetag></d:getetag>
                              <card:address-data></card:address-data>
                            </d:prop>
                            <d:status>HTTP/1.1 200 OK</d:status>
                          </d:propstat>
                        </d:response>
                      </d:multistatus>`
            )
          );

          localpubsub.topic('elasticsearch:contact:added').publish(contact3);

          dav.get(`/addressbooks/${user.id}.json`, (req, res) => res.status(200).json({
              _embedded: {
                'dav:addressbook': [{
                  _links: {
                    self: {
                      href: `addressbooks/${user.id}/contacts.json`
                    }
                  }
                }, {
                  _links: {
                    self: {
                      href: `addressbooks/${user.id}/collected.json`
                    }
                  }
                }, {
                  _links: {
                    self: {
                      href: `addressbooks/${user.id}/${subscribedBookName}.json`
                    }
                  },
                  'openpaas:source': `addressbooks/${sourceUserId}/collected.json`
                }]
              }
            })
          );

          self.createDavServer(self.helpers.callbacks.noErrorAnd(() => {
            self.helpers.elasticsearch.checkDocumentsIndexed({index: 'contacts.idx', type: 'contacts', ids: [contact3.id]}, err => {
              if (err) return done(err);

              self.helpers.api.loginAsUser(self.app, user.emails[0], password, self.helpers.callbacks.noErrorAnd(loggedInAsUser => {
                const req = loggedInAsUser(request(self.app).get(`${PREFIX}${path}`));

                req.expect(200).end((err, res) => {
                  expect(err).to.not.exist;
                  expect(res.headers['x-esn-items-count']).to.equal('3');
                  expect(res.body._embedded['dav:item'][2]._links.self.href).to.include(`/addressbooks/${contact3.bookId}/${contact3.bookName}/${contact3.contactId}.vcf`);
                  expect(res.body._embedded['dav:item'][2]['openpaas:addressbook']).to.deep.equal({
                    bookHome: user._id.toString(),
                    bookName: subscribedBookName
                  });
                  done();
                });
              }));
            });
          }));
        });
      });
    });
  });
});
