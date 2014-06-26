'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The contacts controller module', function() {

  describe('getGoogleOAuthURL method', function() {
    it('should return HTTP 200', function(done) {
      var url = 'http://anurl.pipo';
      var googleApisMock = {
        OAuth2Client: {
          generateAuthUrl: function(options) {
            return url;
          }
        }
      };
      var mongooseMock = {
        model: function() {
          return {};
        }
      };
      mockery.registerMock('mongoose', mongooseMock);
      mockery.registerMock('googleapis', googleApisMock);
      mockery.registerMock('../../../core/contact/google', {
        getGoogleOAuthClient: function(url, callback) {
          return callback(null, googleApisMock.OAuth2Client);
        }
      });

      var contacts = require(this.testEnv.basePath + '/backend/webserver/controllers/import/google');
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
      contacts.getGoogleOAuthURL(req, res);
    });
  });

  describe('fetchGoogleContacts method', function() {

    it('should return HTTP 500 when user is not set', function(done) {
      var mongooseMock = {
        model: function() {
          return {};
        }
      };
      mockery.registerMock('mongoose', mongooseMock);
      mockery.registerMock('../../../core/contacts/google', {});
      var contacts = require(this.testEnv.basePath + '/backend/webserver/controllers/import/google');
      var req = {
        params: {},
        get: function() {
        }
      };
      var res = {
        send: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };
      contacts.fetchGoogleContacts(req, res);
    });


    it('should redirect to /#/contacts if query is incomplete', function(done) {
      var mongooseMock = {
        model: function() {
          return {};
        }
      };
      mockery.registerMock('mongoose', mongooseMock);
      mockery.registerMock('../../../core/contacts/google', {});
      var contacts = require(this.testEnv.basePath + '/backend/webserver/controllers/import/google');
      var req = {
        user: {
          emails: ['pipo1@pipo.com']
        },
        params: {},
        query: {},
        get: function() {
        }
      };
      var res = {
        redirect: function(url) {
          expect(url).to.equal('/#/contacts');
          done();
        }
      };
      contacts.fetchGoogleContacts(req, res);
    });


    it('should return HTTP 500 if google token could not be got', function(done) {
      var mongooseMock = {
        model: function() {
          return {};
        }
      };
      mockery.registerMock('mongoose', mongooseMock);
      var googleApisMock = {
        OAuth2Client: {
          getToken: function(code, callback) {
            return callback(new Error(), null);
          }
        }
      };
      mockery.registerMock('googleapis', googleApisMock);
      mockery.registerMock('../../../core/contact/google', {
        getGoogleOAuthClient: function(url, callback) {
          return callback(null, googleApisMock.OAuth2Client);
        },
        fetchAndSaveGoogleContacts: function(url, user, code, callback) {
          return callback(new Error());
        }
      });

      var contacts = require(this.testEnv.basePath + '/backend/webserver/controllers/import/google');
      var req = {
        params: {},
        user: {
          emails: ['pipo1@pipo.com']
        },
        query: {code: 1234},
        get: function() {
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };
      contacts.fetchGoogleContacts(req, res);
    });
  });
});
