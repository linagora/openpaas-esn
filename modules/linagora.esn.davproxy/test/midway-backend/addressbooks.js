const { expect } = require('chai');
const request = require('supertest');
const mongoose = require('mongoose');
const async = require('async');

const moduleName = 'linagora.esn.davproxy';
const PREFIX = '/dav/api';
const password = 'secret';

describe('The addressbooks dav proxy', function() {

  let esnServer, models, esnURL, user, user2;

  before(function(done) {
    this.testEnv.presetConfiguration(mongoose, done);
  });

  beforeEach(function(done) {
    const self = this;
    const davserver = { backend: { url: `http://${self.testEnv.serversConfig.davserver.host}:${self.testEnv.serversConfig.davserver.port}` } };

    self.helpers.modules.initMidway(moduleName, error => {
      if (error) return done(error);

      self.helpers.modules.getLib('linagora.esn.core.wsserver').start('4500');

      async.series([
        cb => self.helpers.modules.start(moduleName, cb),
        cb => self.helpers.modules.start('linagora.esn.calendar', cb), //TODO Mock rabbitmq exchange listener from calendar
        cb => self.helpers.requireBackend('core/esn-config')('davserver').store(davserver, cb)
      ], err => {
        if (err) return done(err);

        self.helpers.api.applyDomainDeployment('linagora_IT', (err, deployed) => {
          if (err) return done(err);

          user = deployed.users[0];
          user2 = deployed.users[1];
          models = deployed;
          done();
        });
      });
    });
  });

  /**
   * Setup ESN webserver
   */
  beforeEach(function(done) {
    const self = this;
    const { modules } = self.helpers;
    const port = self.testEnv.serversConfig.esn.port;
    const davproxyApp = require('../../backend/webserver/application')(modules.current.deps);

    davproxyApp.use(PREFIX + '/addressbooks', modules.current.lib.api.addressbooks);
    esnServer = modules.getWebServer(davproxyApp).listen(port, err => {
      if (err) return done(err);

      esnURL = `http://localhost:${port}`;
      done();
    });
  });

  afterEach(function(done) {
    esnServer ? esnServer.close(done) : done();
  });

  afterEach(function(done) {
    this.helpers.api.cleanDomainDeployment(models, done);
  });

  describe('addressbooks proxy', function() {

    describe('GET /addressbooks', function() {

      it('should return 200 with the result', function(done) {
        const self = this;
        const path = `/addressbooks/${user._id}/contacts.json`;

        self.helpers.api.loginAsUser(esnURL, user.emails[0], password, (err, loggedInAsUser) => {
          if (err) return done(err);

          loggedInAsUser(request(esnURL).get(PREFIX + path)).expect(200).end(done);
        });
      });
    });

    describe('PROPFIND /addressbooks/:bookHome/:bookName.json', function() {

      it('should return 404 if address book not found', function(done) {
        const path = `/addressbooks/${user._id}/notexist.json`;

        this.helpers.api.loginAsUser(esnURL, user.emails[0], password, (err, loggedInAsUser) => {
          if (err) return done(err);

          loggedInAsUser(request(esnURL).propfind(PREFIX + path))
            .expect(404)
            .end((err, res) => {
              if (err) return done(err);

              expect(res.body).to.deep.equal({
                error: {
                  code: 404,
                  message: 'Not Found',
                  details: 'Addressbook notexist is not found'
                }
              });
              done();
            });
        });
      });
    });

    describe('The search contacts module', function() {

      describe('Single Properties search', function() {
        let contact, requestAsMember;

        beforeEach(function(done) {
          const self = this;

          contact = {
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

          self.helpers.api.loginAsUser(esnURL, user.emails[0], password, (error, requestWithCookies) => {
            if (error) return done(error);

            requestAsMember = requestWithCookies;

            requestAsMember(request(esnURL).put(`${PREFIX}/addressbooks/${user._id}/contacts/${contact.id}.vcf`))
              .send(contact.vcard)
              .expect(201)
              .end(done);
          });
        });

        const search = function(term, expectedSize, done) {
          if (typeof expectedSize === 'function') {
            done = expectedSize;
            expectedSize = 1;
          }
          const self = this;

          self.helpers.elasticsearch.checkDocumentsIndexed({index: 'contacts.idx', type: 'contacts', ids: [contact.id]}, err => {
            if (err) return done(err);

            requestAsMember(request(esnURL)
              .get(PREFIX + '/addressbooks/' + user._id + '/contacts.json'))
              .query({search: term})
              .expect(200)
              .end((err, res) => {
                if (err) return done(err);

                expect(res.body).to.exist;
                expect(res.headers['x-esn-items-count']).to.equal('' + expectedSize);
                done();
              });
          });
        };

        it('should return contact with matching firstname', function(done) {
          const self = this;

          search.bind(self)('bruce', done);
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

        it('should not return result when contact is not in a user addressbook', function(done) {
          const self = this;

          self.helpers.api.loginAsUser(esnURL, user2.emails[0], password, (error, requestAsUser2) => {
            if (error) return done(error);

            self.helpers.elasticsearch.checkDocumentsIndexed({index: 'contacts.idx', type: 'contacts', ids: [contact.id]}, err => {
              if (err) return done(err);

              requestAsUser2(request(esnURL)
                .get(PREFIX + '/addressbooks/' + user2._id + '/contacts.json'))
                .query({search: 'bruce'})
                .expect(200)
                .end((err, res) => {
                  if (err) return done(err);

                  expect(res.body).to.exist;
                  expect(res.headers['x-esn-items-count']).to.equal('0');
                  done();
                });
            });
          });
        });
      });
    });

    describe('PUT /addressbooks/:bookHome/:bookName/:contactId.vcf', function() {

      it('should return 201 with the result', function(done) {
        const self = this;

        self.helpers.api.loginAsUser(esnURL, user.emails[0], password, function(err, loggedInAsUser) {
          if (err) return done(err);

          loggedInAsUser(request(esnURL).put(`${PREFIX}/addressbooks/${user.id}/contacts/newcontact.vcf`))
            .send(['vcard', [
              ['version', {}, 'text', '4.0'],
              ['uid', {}, 'text', 'newcontact'],
              ['n', {}, 'text', ['Foo', 'Bar']]
            ]])
            .expect(201)
            .end(done);
        });
      });
    });

    describe('DELETE /addressbooks/:bookId/contacts/:contactId.vcf', function() {

      it('should return 401 if user is not authenticated', function(done) {
        const self = this;

        self.helpers.api.requireLogin(esnURL, 'delete', PREFIX + '/addressbooks/123/contacts/456.vcf', done);
      });

      it('should return 204', function(done) {
        const self = this;

        self.helpers.api.loginAsUser(esnURL, user.emails[0], password, function(err, loggedInAsUser) {
          if (err) return done(err);

          loggedInAsUser(request(esnURL).put(`${PREFIX}/addressbooks/${user.id}/contacts/newcontact.vcf`))
            .send(['vcard', [
              ['version', {}, 'text', '4.0'],
              ['uid', {}, 'text', 'newcontact'],
              ['n', {}, 'text', ['Foo', 'Bar']]
            ]])
            .expect(201)
            .end(testDeleteContact);

          function testDeleteContact(error) {
            if (error) return done(error);

            loggedInAsUser(request(esnURL).delete(`${PREFIX}/addressbooks/${user.id}/contacts/newcontact.vcf`))
              .expect(204)
              .end(done);
          }
        });
      });
    });

    describe('DELETE /addressbooks/:bookId/contacts/:contactId.vcf with graceperiod', function() {

      it('should return 401 if user is not authenticated', function(done) {
        const self = this;

        self.helpers.api.requireLogin(esnURL, 'delete', PREFIX + '/addressbooks/123/contacts/456.vcf?graceperiod=10000', done);
      });

      it('should return 202', function(done) {
        const self = this;

        self.helpers.api.loginAsUser(esnURL, user.emails[0], password, (err, loggedInAsUser) => {
          if (err) {
            return done(err);
          }

          loggedInAsUser(request(esnURL).del(`${PREFIX}/addressbooks/${user.id}/contacts/456.vcf?graceperiod=10000`))
            .expect(202)
            .end(function(err, res) {
              if (err) return done(err);

              expect(res.headers['x-esn-task-id']).to.be.a.string;
              done();
            });
        });
      });
    });

    describe('POST /addressbooks/:bookId.json', function() {
      it('should respond 401 if user is not authenticated', function(done) {
        this.helpers.api.requireLogin(esnURL, 'post', `${PREFIX}/addressbooks/123.json`, done);
      });

      it('should respond 400 if there is no addressbook id', function(done) {
        const self = this;
        const addressbook = {
          description: 'addressbook description',
          type: 'user'
        };

        self.helpers.api.loginAsUser(esnURL, user.emails[0], password, (err, loggedInAsUser) => {
          if (err) return done(err);

          loggedInAsUser(request(esnURL).post(`${PREFIX}/addressbooks/${user.id}.json`))
            .send(addressbook)
            .expect(400)
            .end((err, res) => {
              if (err) return done(err);

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

      it('should respond 400 if there is no addressbook name', function(done) {
        const self = this;
        const addressbook = {
          id: '4e2a6aef-d443-4709-b925-d9585ebc9109',
          description: 'addressbook description',
          type: 'user'
        };

        self.helpers.api.loginAsUser(esnURL, user.emails[0], password, (err, loggedInAsUser) => {
          if (err) return done(err);

          loggedInAsUser(request(esnURL).post(`${PREFIX}/addressbooks/123.json`))
            .send(addressbook)
            .expect(400)
            .end((err, res) => {
              if (err) return done(err);

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

      it('should respond 400 if there is no addressbook type', function(done) {
        const self = this;
        const addressbook = {
          id: '4e2a6aef-d443-4709-b925-d9585ebc9109',
          name: 'addressbook test',
          description: 'addressbook description'
        };

        self.helpers.api.loginAsUser(esnURL, user.emails[0], password, (err, loggedInAsUser) => {
          if (err) return done(err);

          loggedInAsUser(request(esnURL).post(`${PREFIX}/addressbooks/123.json`))
            .send(addressbook)
            .expect(400)
            .end((err, res) => {
              if (err) return done(err);

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

      it('should respond 400 if addressbook type is not supported', function(done) {
        const self = this;
        const addressbook = {
          id: '4e2a6aef-d443-4709-b925-d9585ebc9109',
          name: 'addressbook test',
          description: 'addressbook description',
          type: 'unsupport type'
        };

        self.helpers.api.loginAsUser(esnURL, user.emails[0], password, (err, loggedInAsUser) => {
          if (err) return done(err);

          loggedInAsUser(request(esnURL).post(`${PREFIX}/addressbooks/123.json`))
            .send(addressbook)
            .expect(400)
            .end((err, res) => {
              if (err) return done(err);

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

      it('should respond 201 if success to create addressbook', function(done) {
        const self = this;
        const addressbook = {
          id: '4e2a6aef-d443-4709-b925-d9585ebc9109',
          name: 'addressbook test',
          description: 'addressbook description',
          type: 'user',
          state: 'enabled'
        };

        self.helpers.api.loginAsUser(esnURL, user.emails[0], password, (err, loggedInAsUser) => {
          if (err) return done(err);

          loggedInAsUser(request(esnURL).post(`${PREFIX}/addressbooks/${user.id}.json`))
            .send(addressbook)
            .expect(201)
            .end(done);
        });
      });
    });

    describe('DELETE /addressbooks/:bookHome/:bookName.json', function() {

      it('should respond 401 if user is not authenticated', function(done) {
        this.helpers.api.requireLogin(esnURL, 'delete', `${PREFIX}/addressbooks/123/test.json`, done);
      });

      it('should return 204', function(done) {
        const self = this;

        self.helpers.api.loginAsUser(esnURL, user.emails[0], password, (err, loggedInAsUser) => {
          if (err) return done(err);

          loggedInAsUser(request(esnURL).post(`${PREFIX}/addressbooks/${user.id}.json`))
            .send({ name: 'foobar', type: 'user', id: '78c5334a-6502-4b1b-a926-bfd56d0ac49b' })
            .expect(201)
            .end(testDeleteAddressBook);

          function testDeleteAddressBook(error) {
            if (error) return done(error);

            loggedInAsUser(request(esnURL).delete(`${PREFIX}/addressbooks/${user.id}/78c5334a-6502-4b1b-a926-bfd56d0ac49b.json`))
              .expect(204)
              .end(done);
          }
        });
      });
    });

    describe('PUT /addressbooks/:bookId/:bookName.json', function() {
      it('should respond 401 if user is not authenticated', function(done) {
        this.helpers.api.requireLogin(esnURL, 'put', `${PREFIX}/addressbooks/123/test.json`, done);
      });

      it('should respond 204 if success to update addressbook', function(done) {
        const self = this;
        const addressbook = { name: 'foobar', type: 'user', id: '78c5334a-6502-4b1b-a926-bfd56d0ac49b' };

        self.helpers.api.loginAsUser(esnURL, user.emails[0], password, (err, loggedInAsUser) => {
          if (err) return done(err);

          loggedInAsUser(request(esnURL).post(`${PREFIX}/addressbooks/${user.id}.json`))
            .send(addressbook)
            .expect(201)
            .end(testUpdateAddressbook);

          function testUpdateAddressbook(error) {
            if (error) return done(error);

            addressbook.name = 'foo bloody bar';

            loggedInAsUser(request(esnURL).put(`${PREFIX}/addressbooks/${user.id}/${addressbook.id}.json`))
              .send(addressbook)
              .expect(204)
              .end(done);
          }
        });
      });
    });

    describe('MOVE /addressbook/:bookId/:bookName/:cardId.vcf', function() {
      it('should respond 401 if user is not authenticated', function(done) {
        this.helpers.api.requireLogin(esnURL, 'move', `${PREFIX}/addressbooks/123/contacts/456.vcf`, done);
      });

      it('should respond 400 if there is no destination in request headers', function(done) {
        const self = this;

        self.helpers.api.loginAsUser(esnURL, user.emails[0], password, (err, loggedInAsUser) => {
          if (err) return done(err);

          loggedInAsUser(request(esnURL).move(`${PREFIX}/addressbooks/${user.id}/contacts/456.vcf`))
            .expect(400)
            .end((err, res) => {
              if (err) return done(err);

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

      it('should return 201 with the result', function(done) {
        const self = this;
        const addressbook = { name: 'target', type: 'user', id: '123456' };

        self.helpers.api.loginAsUser(esnURL, user.emails[0], password, (err, loggedInAsUser) => {
          if (err) return done(err);

          loggedInAsUser(request(esnURL).post(`${PREFIX}/addressbooks/${user.id}.json`))
            .send(addressbook)
            .expect(201)
            .end(createContact);

          function createContact(error) {
            if (error) return done(new Error('Failed to create addressbook', error.message));

            loggedInAsUser(request(esnURL).put(`${PREFIX}/addressbooks/${user.id}/contacts/createdcontact.vcf`))
              .send(['vcard', [
                ['version', {}, 'text', '4.0'],
                ['uid', {}, 'text', 'createdcontact'],
                ['n', {}, 'text', ['Foo', 'Bar']]
              ]])
              .expect(201)
              .end(testMoveContact);
          }

          function testMoveContact(error) {
            if (error) return done(new Error('Failed to create contact', error.message));

            loggedInAsUser(request(esnURL).move(`${PREFIX}/addressbooks/${user.id}/contacts/createdcontact.vcf`))
              .set('destination', `/addressbooks/${user.id}/123456/createdcontact.vcf`) //FIX it returns 403, why??
              .expect(201)
              .end(done);
          }
        });
      });
    });

    describe('POST /addressbook/:bookHome.json', function() {
      it('should respond 201 if success to create subscription', function(done) {
        const self = this;
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

        self.helpers.api.loginAsUser(esnURL, user.emails[0], password, (err, loggedInAsUser) => {
          if (err) return done(err);

          loggedInAsUser(request(esnURL).post(`${PREFIX}/addressbooks/${user.id}.json`))
            .send(addressbook)
            .expect(201)
            .end(done);
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

        self.helpers.api.loginAsUser(esnURL, user.emails[0], password, (err, loggedInAsUser) => {
          if (err) return done(err);

          loggedInAsUser(request(esnURL).post(`${PREFIX}${path}`))
            .send(addressbook)
            .expect(400)
            .end((err, res) => {
              if (err) return done(err);

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

    describe('GET /addressbook/:bookHome.json', function() {
      it('should respond 401 if user is not authenticated', function(done) {
        this.helpers.api.requireLogin(esnURL, 'get', `${PREFIX}/addressbooks/123.json`, done);
      });

      describe('With search query', function() {
        let requestAsUser;
        let contact1, contact2;

        beforeEach(function(done) {
          const self = this;

          contact1 = {
            bookName: 'contacts',
            vcard: ['vcard', [
              ['version', {}, 'text', '4.0'],
              ['uid', {}, 'text', '3c6d4032-fce2-485b-b708-3d8d9ba280da'],
              ['n', {}, 'text', ['Willis', 'Bruce']]
            ]],
            id: '4db41c7b-c747-41fe-ad8f-c3aa584bf0d9'
          };

          contact2 = {
            bookName: 'collected',
            vcard: ['vcard', [
              ['version', {}, 'text', '4.0'],
              ['uid', {}, 'text', '3cdq4032-fcs2-4g5w-bc0c-wo2o0aa280da'],
              ['n', {}, 'text', ['Justin', 'Bruce']]
            ]],
            id: '4dbasc7b-cd47-41fe-ac8f-c3aks2k3nf0d9'
          };

          self.helpers.api.loginAsUser(esnURL, user.emails[0], password, (error, requestWithCookies) => {
            if (error) return done(error);

            requestAsUser = requestWithCookies;

            async.series([
              cb => requestAsUser(request(esnURL).put(`${PREFIX}/addressbooks/${user._id}/${contact1.bookName}/${contact1.id}.vcf`))
                .send(contact1.vcard)
                .expect(201)
                .end(cb),
              cb => requestAsUser(request(esnURL).put(`${PREFIX}/addressbooks/${user._id}/${contact2.bookName}/${contact2.id}.vcf`))
                .send(contact2.vcard)
                .expect(201)
                .end(cb),
              cb => self.helpers.elasticsearch.checkDocumentsIndexed({ index: 'contacts.idx', type: 'contacts', ids: [contact1.id, contact2.id] }, cb)
            ], done);
          });
        });

        it('should respond 200 with empty result if user try to search on unavailable bookNames', function(done) {
          const path = `/addressbooks/${user.id}.json?search=456&bookName=unavailableBookName,unavailableBookName2`;

          requestAsUser(request(esnURL).get(`${PREFIX}${path}`))
            .expect(200).end((err, res) => {
              if (err) return done(err);

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

        it('should respond 200 with result if user search contact on a specific available bookName', function(done) {
          requestAsUser(request(esnURL).get(`${PREFIX}/addressbooks/${user.id}.json?search=bruce&bookName=contacts`))
            .expect(200).end((err, res) => {
              if (err) return done(err);

              expect(res.body._embedded['dav:item'][0]._links.self.href).to.include(`/addressbooks/${user.id}/contacts/${contact1.id}.vcf`);
              expect(res.headers['x-esn-items-count']).to.equal('1');
              done();
            });
        });

        it('should respond 200 with result if user search contact on available bookNames', function(done) {
          const path = `/addressbooks/${user.id}.json?search=bruce&bookName=contacts,collected`;

          requestAsUser(request(esnURL).get(`${PREFIX}${path}`))
            .expect(200)
            .end((err, res) => {
              if (err) return done(err);

              expect(res.body._embedded['dav:item'][0]._links.self.href).to.include(`/addressbooks/${user.id}/${contact2.bookName}/${contact2.id}.vcf`);
              expect(res.body._embedded['dav:item'][1]._links.self.href).to.include(`/addressbooks/${user.id}/${contact1.bookName}/${contact1.id}.vcf`);
              expect(res.headers['x-esn-items-count']).to.equal('2');
              done();
            });
        });

        it('should respond 200 with the result of searching on all available bookNames if there is no bookName specified', function(done) {
          const path = `/addressbooks/${user.id}.json?search=bruce`;

          requestAsUser(request(esnURL).get(`${PREFIX}${path}`))
            .expect(200)
            .end((err, res) => {
              if (err) return done(err);

              expect(res.body._embedded['dav:item'][0]._links.self.href).to.include(`/addressbooks/${user.id}/${contact2.bookName}/${contact2.id}.vcf`);
              expect(res.body._embedded['dav:item'][1]._links.self.href).to.include(`/addressbooks/${user.id}/${contact1.bookName}/${contact1.id}.vcf`);
              expect(res.headers['x-esn-items-count']).to.equal('2');
              done();
            });
        });

        it('should respond 200 with the result of searching on all available bookNames includes subscription address books', function(done) {
          let requestAsUser2;
          const self = this;
          const path = `/addressbooks/${user.id}.json?search=bruce`;
          const contact3 = {
            vcard: ['vcard', [
              ['version', {}, 'text', '4.0'],
              ['uid', {}, 'text', '30f712b2-2a3d-4966-b6f2-5cd11d7f5652'],
              ['n', {}, 'text', ['Le', 'Bruce']]
            ]],
            id: '30f712b2-2a3d-4966-b6f2-5cd11d7f5652'
          };
          const subscriptionBook = {
            name: 'user2 book',
            type: 'subscription',
            'openpaas:source': {
              _links: {
                self: {
                  href: `/addressbooks/${user2.id}/contacts.json`
                }
              }
            },
            id: 'subscription-of-user2-addressbook'
          };

          async.series([
            assignRequestAsUser2,
            cb => self.helpers.requireBackend('core/esn-config')('features')
              .inModule('linagora.esn.contact')
              .forUser(user)
              .store({ isSharingAddressbookEnabled: true }, cb),
            cb => requestAsUser2(request(esnURL).put(`${PREFIX}/addressbooks/${user2._id}/contacts/${contact3.id}.vcf`))
              .send(contact3.vcard)
              .expect(201)
              .end(cb),
            cb => requestAsUser2(request(esnURL).post(`${PREFIX}/addressbooks/${user2.id}/contacts.json`))
              .send({ 'dav:publish-addressbook': { privilege: '{DAV:}read' }})
              .set('Accept', 'application/json')
              .expect(204)
              .end(cb),
            cb => requestAsUser(request(esnURL).post(`${PREFIX}/addressbooks/${user.id}.json`))
              .send(subscriptionBook)
              .expect(201)
              .end(cb),
            cb => self.helpers.elasticsearch.checkDocumentsIndexed({index: 'contacts.idx', type: 'contacts', ids: [contact3.id]}, cb)
          ], testSearch);

          function testSearch(error) {
            if (error) return done(error);

            requestAsUser(request(esnURL).get(`${PREFIX}${path}`))
              .expect(200).end((err, res) => {
                if (err) return done(err);

                expect(res.headers['x-esn-items-count']).to.equal('3');

                const subscribedContact = res.body._embedded['dav:item'].find(
                  contact => contact._links.self.href.includes(`/addressbooks/${user2.id}/contacts/${contact3.id}.vcf`)
                );

                expect(subscribedContact).to.exist;
                expect(subscribedContact['openpaas:addressbook']).to.deep.equal({
                  bookHome: user.id,
                  bookName: 'subscription-of-user2-addressbook'
                });
                done();
              });
          }

          function assignRequestAsUser2(callback) {
            self.helpers.api.loginAsUser(esnURL, user2.emails[0], password, (error, requestWithCookies) => {
              if (error) callback(error);

              requestAsUser2 = requestWithCookies;
              callback();
            });
          }
        });
      });
    });
  });
});
