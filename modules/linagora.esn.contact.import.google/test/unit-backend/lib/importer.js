'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');
var q = require('q');

describe('The google contact importer', function() {

  var deps, dependencies, mappingMock, passportRefreshMock, requestMock, optionsMock, xml2jsMock;
  var response, body;
  var accessToken = 1234;

  beforeEach(function() {
    mappingMock = {
      toVcard: function() {}
    };
    response = { statusCode: 200 };
    body = {
      feed: {
        'openSearch:startIndex': [0],
        'openSearch:totalResults': [199],
        entry: [
          { id: 1, link: [{$: { type: 'image/*' }}] },
          { id: 2, link: [{$: { type: 'image/*' }}] },
          { id: 3, link: [{$: { type: 'image/*' }}] }
        ]
      }
    };
    requestMock = function(option, callback) {
      callback(null, response, null);
    };
    passportRefreshMock = {
      requestNewAccessToken: function(name, refresh_token, callback) {
        callback(null, accessToken);
      }
    };
    xml2jsMock = {
      parseString: function(xml, callback) {
        callback(null, body);
        body.feed['openSearch:startIndex'][0] += 50;
      }
    };
    optionsMock = {
      account: {
        data: {
          refresh_token: 'abcde'
        }
      }
    };
    dependencies = {
      logger: {
        info: function() {},
        error: function() {},
        debug: function() {},
        warn: function() {}
      },
      'contact-import': {
        constants: {
          CONTACT_IMPORT_ERROR: {
            ACCOUNT_ERROR: 'contact:import:account:error',
            API_CLIENT_ERROR: 'contact:import:api:error',
            CONTACT_CLIENT_ERROR: 'contact:import:contact:error'
          }
        },
        lib: {
          import: {
            buildErrorMessage: function() {
              return {};
            },
            createContact: function() {
              return q.resolve({});
            }
          }
        }
      }
    };
    deps = function(name) {
      return dependencies[name];
    };
    mockery.registerMock('./mapping', function() { return mappingMock; });
    mockery.registerMock('passport-oauth2-refresh', passportRefreshMock);
    mockery.registerMock('request', requestMock);
    mockery.registerMock('xml2js', xml2jsMock);
  });

  var getImporter = function() {
    return require('../../../backend/lib/importer')(deps);
  };

  describe('The importContact function', function() {
    it('should refresh the access token', function(done) {
      passportRefreshMock.requestNewAccessToken = function(name, refresh_token) {
        expect(name).to.equal('google-authz');
        expect(refresh_token).to.equal(optionsMock.account.data.refresh_token);
        done();
      };
      getImporter().importContact(optionsMock);
    });

    it('should reject if can not refresh the access token', function(done) {
      var err = new Error('can not refresh access token');
      passportRefreshMock.requestNewAccessToken = function(name, refresh_token, callback) {
        callback(err, accessToken);
      };
      getImporter().importContact(optionsMock).then(null, function(error) {
        expect(error).to.deep.equal(err);
        done();
      });
    });

    it('should send request to google server with correct options', function(done) {
      requestMock = function(option) {
        expect(option).to.deep.equal({
          method: 'GET',
          url: 'https://www.google.com/m8/feeds/contacts/default/full?max-results=50',
          headers: { 'GData-Version': '3.0', Authorization: 'Bearer 1234' }
        });
        done();
      };
      mockery.registerMock('request', requestMock);
      getImporter().importContact(optionsMock);
    });

    it('should reject if request to google server returns error', function(done) {
      var error = new Error('[Error: Error while getting the contact from google (HTTP %s)]');
      requestMock = function(option, callback) {
        callback(null, {statusCode: 500});
      };
      mockery.registerMock('request', requestMock);
      getImporter().importContact(optionsMock).then(null, function(err) {
        expect(err).to.deep.equal(error);
        done();
      });
    });

    it('should send multiple request to google server to get all contacts', function(done) {
      var count = 0;
      requestMock = function(option, callback) {
        var defaultUrl = 'https://www.google.com/m8/feeds/contacts/default/full?max-results=50';
        var url = count > 0 ? defaultUrl + '&start-index=' + count * 50 : defaultUrl;
        count++;
        expect(option).to.deep.equal({
          method: 'GET',
          url: url,
          headers: { 'GData-Version': '3.0', Authorization: 'Bearer 1234' }
        });
        if (count === 3) {
          done();
        }

        callback(null, response, null);
      };
      mockery.registerMock('request', requestMock);
      getImporter().importContact(optionsMock);
    });

    it('should reject if can not parse the response from google', function(done) {
      var error = new Error('can not parse string');
      xml2jsMock.parseString = function(body, callback) {
        callback(error);
      };
      mockery.registerMock('xml2js', xml2jsMock);
      getImporter().importContact(optionsMock).then(null, function(err) {
        expect(err).to.deep.equal(error);
        done();
      });
    });

    it('should create contact if the response from google is correct', function(done) {
      var count = 0;
      dependencies['contact-import'].lib.import.createContact = function(json, opt) {
        expect(opt).to.equal(optionsMock);
        count++;
      };
      getImporter().importContact(optionsMock).then(function() {
        expect(count).to.equal(12);
        done();
      });
    });

    it('should get all contact photo if gd:etag exist', function(done) {
      var count = 0;
      body.feed['openSearch:totalResults'] = [49];
      var googleContactPhotoURL = 'https://www.google.com/m8/feeds/photos/media/';
      var contactLink = [{
        $: {
          type: 'image/*',
          'gd:etag': 1234,
          href: googleContactPhotoURL
        }
      }];
      body = {
        feed: {
          'openSearch:startIndex': [0],
          'openSearch:totalResults': [49],
          entry: [
            { id: 1, link: contactLink },
            { id: 2, link: contactLink },
            { id: 3, link: contactLink }
          ]
        }
      };
      requestMock = function(option, callback) {
        if (option.url === googleContactPhotoURL) {
          count++;
          callback(null, response, 'my photo');
        } else {
          callback(null, response, null);
        }
      };
      mockery.registerMock('request', requestMock);
      mockery.registerMock('xml2js', xml2jsMock);
      getImporter().importContact(optionsMock).then(function() {
        expect(count).to.equal(3);
        done();
      });
    });

  });
});
