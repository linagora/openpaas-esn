'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var VCARD_JSON = 'application/vcard+json';

describe('The contact client APIs', function() {
  var deps;

  beforeEach(function() {
    deps = {
      logger: {
        error: function() {},
        debug: function() {},
        info: function() {},
        warning: function() {}
      },
      davserver: {
        utils: {
          getDavEndpoint: function(callback) {
            callback('/dav/api');
          }
        }
      }
    };
  });

  var dependencies = function(name) {
    return deps[name];
  };

  function getModule() {
    return require('../../../../backend/lib/client')(dependencies);
  }


  describe('The addressbook fn', function() {
    var CLIENT_OPTIONS = { ESNToken: '1111' };
    var BOOK_ID = '123';

    function addressbook() {
      return getModule()(CLIENT_OPTIONS).addressbook(BOOK_ID);
    }

    describe('The contacts fn', function() {
      describe('The list fn', function() {
        it('should call davClient with right parameters', function(done) {
          var query = { q: 'some query' };
          mockery.registerMock('../dav-client', {
            rawClient: function(options) {
              expect(options.json).to.be.true;
              expect(options.headers).to.eql({
                ESNToken: CLIENT_OPTIONS.ESNToken,
                accept: VCARD_JSON
              });
              expect(options.url).to.equal('/dav/api/addressbooks/123/contacts.json');
              expect(options.query).to.equal(query);
              done();
            }
          });
          addressbook().contacts().list(query);
        });

        it('should have default empty query', function(done) {
          mockery.registerMock('../dav-client', {
            rawClient: function(options) {
              expect(options.query).to.eql({});
              done();
            }
          });
          addressbook().contacts().list();
        });

        it('should resolve with response and body', function(done) {
          mockery.registerMock('../dav-client', {
            rawClient: function(options, callback) {
              callback(null, 'response', 'body');
            }
          });

          addressbook().contacts().list().then(function(data) {
            expect(data.response).to.equal('response');
            expect(data.body).to.equal('body');
            done();
          });
        });

        it('should reject with error', function(done) {
          mockery.registerMock('../dav-client', {
            rawClient: function(options, callback) {
              callback('a error');
            }
          });

          addressbook().contacts().list().then(null, function(err) {
            expect(err).to.equal('a error');
            done();
          });
        });
      });


      describe('The get fn', function() {
        it('should call davClient with right parameters', function(done) {
          mockery.registerMock('../dav-client', {
            rawClient: function(options) {
              expect(options.json).to.be.true;
              expect(options.headers).to.eql({
                ESNToken: CLIENT_OPTIONS.ESNToken,
                accept: VCARD_JSON
              });
              expect(options.url).to.equal('/dav/api/addressbooks/123/contacts/456.vcf');
              done();
            }
          });
          addressbook().contacts('456').get();
        });

        it('should resolve with response and body', function(done) {
          mockery.registerMock('../dav-client', {
            rawClient: function(options, callback) {
              callback(null, 'response', 'body');
            }
          });

          addressbook().contacts('456').get().then(function(data) {
            expect(data.response).to.equal('response');
            expect(data.body).to.equal('body');
            done();
          });
        });

        it('should reject with error', function(done) {
          mockery.registerMock('../dav-client', {
            rawClient: function(options, callback) {
              callback('a error');
            }
          });

          addressbook().contacts('456').get().then(null, function(err) {
            expect(err).to.equal('a error');
            done();
          });
        });

      });


      describe('The create fn', function() {
        it('should call davClient with right parameters', function(done) {
          var contact = { id: '456' };
          mockery.registerMock('../dav-client', {
            rawClient: function(options) {
              expect(options.method).to.equal('PUT');
              expect(options.json).to.be.true;
              expect(options.headers).to.eql({
                ESNToken: CLIENT_OPTIONS.ESNToken,
                accept: VCARD_JSON
              });
              expect(options.url).to.equal('/dav/api/addressbooks/123/contacts/456.vcf');
              expect(options.body).to.equal(contact);
              done();
            }
          });
          addressbook().contacts(contact.id).create(contact);
        });

        it('should resolve with response and body', function(done) {
          mockery.registerMock('../dav-client', {
            rawClient: function(options, callback) {
              callback(null, 'response', 'body');
            }
          });

          addressbook().contacts('456').create({}).then(function(data) {
            expect(data.response).to.equal('response');
            expect(data.body).to.equal('body');
            done();
          });
        });

        it('should reject with error', function(done) {
          mockery.registerMock('../dav-client', {
            rawClient: function(options, callback) {
              callback('a error');
            }
          });

          addressbook().contacts('456').create({}).then(null, function(err) {
            expect(err).to.equal('a error');
            done();
          });
        });
      });


      describe('The update fn', function() {
        it('should call davClient with right parameters', function(done) {
          var contact = { id: '456' };
          mockery.registerMock('../dav-client', {
            rawClient: function(options) {
              expect(options.method).to.equal('PUT');
              expect(options.json).to.be.true;
              expect(options.headers).to.eql({
                ESNToken: CLIENT_OPTIONS.ESNToken,
                accept: VCARD_JSON
              });
              expect(options.url).to.equal('/dav/api/addressbooks/123/contacts/456.vcf');
              expect(options.body).to.equal(contact);
              done();
            }
          });

          addressbook().contacts('456').update(contact);
        });

        it('should resolve with response and body', function(done) {
          mockery.registerMock('../dav-client', {
            rawClient: function(options, callback) {
              callback(null, 'response', 'body');
            }
          });

          addressbook().contacts('456').update({}).then(function(data) {
            expect(data.response).to.equal('response');
            expect(data.body).to.equal('body');
            done();
          });
        });

        it('should reject with error', function(done) {
          mockery.registerMock('../dav-client', {
            rawClient: function(options, callback) {
              callback('a error');
            }
          });

          addressbook().contacts('456').update({}).then(null, function(err) {
            expect(err).to.equal('a error');
            done();
          });
        });
      });


      describe('The deleteContact fn', function() {
        it('should call davClient with right parameters', function(done) {
          mockery.registerMock('../dav-client', {
            rawClient: function(options) {
              expect(options.method).to.equal('DELETE');
              expect(options.json).to.be.true;
              expect(options.headers).to.eql({
                ESNToken: CLIENT_OPTIONS.ESNToken
              });
              expect(options.url).to.equal('/dav/api/addressbooks/123/contacts/456.vcf');
              done();
            }
          });

          addressbook().contacts('456').del();
        });

        it('should resolve with response and body', function(done) {
          mockery.registerMock('../dav-client', {
            rawClient: function(options, callback) {
              callback(null, 'response', 'body');
            }
          });

          addressbook().contacts('456').del().then(function(data) {
            expect(data.response).to.equal('response');
            expect(data.body).to.equal('body');
            done();
          });
        });

        it('should reject with error', function(done) {
          mockery.registerMock('../dav-client', {
            rawClient: function(options, callback) {
              callback('a error');
            }
          });

          addressbook().contacts('456').del().then(null, function(err) {
            expect(err).to.equal('a error');
            done();
          });
        });
      });

    });

  });

});
