'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The contacts controller module', function() {

  describe('getOAuthURL method', function() {
    it('should return HTTP 200', function(done) {
      var url = 'http://anurl.pipo';
      var googleApisMock = {
        OAuth2Client: function() {
          return {
            generateAuthUrl: function(options) {
              return url;
            }
          };
        }
      };
      var mongooseMock = {
        model: function() {
          return {};
        }
      };
      mockery.registerMock('mongoose', mongooseMock);
      mockery.registerMock('googleapis', googleApisMock);
      mockery.registerMock('../../core/contacts/helper', {});

      var contacts = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      var req = {
        params: {},
        get: function() {
          return 'anurl.pipo';
        },
        protocol: 'http'
      };
      var res = {
        json: function(result) {
          expect(result.url).to.equal(url);
          done();
        }
      };
      contacts.getOAuthURL(req, res);
    });
  });

  describe('fetchContacts method', function() {

    it('should return HTTP 500 when user is not set', function(done) {
      var mongooseMock = {
        model: function() {
          return {};
        }
      };
      mockery.registerMock('mongoose', mongooseMock);
      mockery.registerMock('../../core/contacts/helper', {});
      var contacts = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      var req = {
        params: {}
      };
      var res = {
        send: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };
      contacts.fetchContacts(req, res);
    });


    it('should redirect to /#/contacts if query is incomplete', function(done) {
      var mongooseMock = {
        model: function() {
          return {};
        }
      };
      mockery.registerMock('mongoose', mongooseMock);
      mockery.registerMock('../../core/contacts/helper', {});
      var contacts = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      var req = {
        user: {
          emails: ['pipo1@pipo.com']
        },
        params: {},
        query: {}
      };
      var res = {
        redirect: function(url) {
          expect(url).to.equal('/#/contacts');
          done();
        }
      };
      contacts.fetchContacts(req, res);
    });


    it('should return HTTP 500 if google token could not be got', function(done) {
      var mongooseMock = {
        model: function() {
          return {};
        }
      };
      mockery.registerMock('mongoose', mongooseMock);
      var googleApisMock = {
        OAuth2Client: function() {
          return {
            getToken: function(code, callback) {
              return callback('Error', null);
            }
          };
        }
      };
      mockery.registerMock('googleapis', googleApisMock);
      mockery.registerMock('../../core/contacts/helper', {});

      var contacts = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      var req = {
        params: {},
        user: {
          emails: ['pipo1@pipo.com']
        },
        query: {code: 1234}
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };
      contacts.fetchContacts(req, res);
    });


    it('should make an https request to the contact API once token is got', function(done) {
      var mongooseMock = {
        model: function() {
          return {};
        }
      };
      mockery.registerMock('mongoose', mongooseMock);
      var googleApisMock = {
        OAuth2Client: function() {
          return {
            getToken: function(code, callback) {
              return callback(null, 'credentials');
            },
            setCredentials: function() {},
            credentials: {
              acces_token: 'token'
            }
          };
        }
      };
      var httpsMock = {
        get: function(options, callback) {
          done();
        }
      };
      mockery.registerMock('googleapis', googleApisMock);
      mockery.registerMock('../../core/contacts/helper', {});
      mockery.registerMock('https', httpsMock);

      var contacts = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      var req = {
        params: {},
        user: {
          emails: ['pipo1@pipo.com']
        },
        query: {code: 1234}
      };
      contacts.fetchContacts(req, {});
    });


  });

});
