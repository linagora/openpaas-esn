'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The contact helper module', function() {

  describe('saveGoogleContacts function', function() {

    it('should send back an error if no xml is provided', function(done) {
      var mongooseMock = {
        model: function() {
          return {};
        }
      };
      mockery.registerMock('mongoose', mongooseMock);

      var helper = require(this.testEnv.basePath + '/backend/core/contact/google');
      helper.saveGoogleContacts('', 'user', function(err) {
        expect(err).to.exist;
        done();
      });
    });

    it('should send back an error if no user is provided', function(done) {
      var mongooseMock = {
        model: function() {
          return {};
        }
      };
      mockery.registerMock('mongoose', mongooseMock);

      var helper = require(this.testEnv.basePath + '/backend/core/contact/google');
      helper.saveGoogleContacts('<pipo>PIPO</pipo>', null, function(err) {
        expect(err).to.exist;
        done();
      });
    });


    it('should send back an error if xml parsing fails', function(done) {
      var mongooseMock = {
        model: function() {
          return {};
        }
      };
      mockery.registerMock('mongoose', mongooseMock);
      var errorString = 'parseError';
      var xml2jsMock = {
        parseString: function(xml, callback) {
          return callback(errorString);
        }
      };
      mockery.registerMock('xml2js', xml2jsMock);

      var helper = require(this.testEnv.basePath + '/backend/core/contact/google');
      helper.saveGoogleContacts('<pipo>PIPO</pipo>', 'user', function(err) {
        expect(err).to.exist;
        expect(err).to.equal(errorString);
        done();
      });
    });


    it('should send back an error if the address book could not be found or created', function(done) {
      var user = {
        _id: 'pipoID'
      };
      var errorString = 'addresbookfinderror';
      var mongooseMock = {
        model: function(modelName) {
          return {
            findOneAndUpdate: function(query, ignore, options, callback) {
              expect(modelName).to.equal('AddressBook');

              expect(query.name).to.equal('Google Contacts');
              expect(query.creator).to.equal(user._id);

              expect(options.upsert).to.be.true;

              callback(errorString, null);
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongooseMock);
      var xml2jsMock = {
        parseString: function(xml, callback) {
          return callback(null, {});
        }
      };
      mockery.registerMock('xml2js', xml2jsMock);

      var helper = require(this.testEnv.basePath + '/backend/core/contact/google');
      helper.saveGoogleContacts('<pipo>PIPO</pipo>', user, function(err) {
        expect(err).to.exist;
        done();
      });
    });


    it('should send back an error if the contact could not be found or created', function(done) {
      var user = {
        _id: 'pipoID'
      };
      var errorString = 'contactfinderror';
      var mongooseMock = {
        model: function(modelName) {
          return {
            findOneAndUpdate: function(query, update, options, callback) {
              if (modelName === 'AddressBook') {
                var addressbook = {
                  _id: 1234
                };
                return callback(null, addressbook);
              }
              expect(modelName).to.equal('Contact');
              callback(errorString, null);
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongooseMock);
      var contactsAsJson = require(this.testEnv.basePath + '/test/unit-backend/fixtures/contacts/googleContacts.json');
      var xml2jsMock = {
        parseString: function(xml, callback) {
          return callback(null, contactsAsJson);
        }
      };
      mockery.registerMock('xml2js', xml2jsMock);

      var helper = require(this.testEnv.basePath + '/backend/core/contact/google');
      helper.saveGoogleContacts('<pipo>PIPO</pipo>', user, function(err) {
        expect(err).to.exist;
        expect(err).to.equal(errorString);
        done();
      });
    });

    it('should create contacts with correct data', function(done) {
      var contactSaveCount = 0;
      var user = {
        _id: 'pipoID'
      };
      var addresbookId = 1234;
      var mongooseMock = {
        model: function(modelName) {
          return {
            findOneAndUpdate: function(query, update, options, callback) {
              if (modelName === 'AddressBook') {
                var addressbook = {
                  _id: addresbookId
                };
                return callback(null, addressbook);
              }

              expect(modelName).to.equal('Contact');
              contactSaveCount++;

              expect(query.addressbooks).to.equal(addresbookId);
              expect(query.owner).to.equal(user._id);
              expect(query.emails === 'pipo1@linagora.com' || query.emails === 'pipo2@linagora.com').to.be.true;
              expect(update.given_name === 'pipo1' || update.given_name === 'pipo2').to.be.true;

              expect(modelName).to.equal('Contact');
              callback(null, {});
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongooseMock);
      var contactsAsJson = require(this.testEnv.basePath + '/test/unit-backend/fixtures/contacts/googleContacts.json');
      var xml2jsMock = {
        parseString: function(xml, callback) {
          return callback(null, contactsAsJson);
        }
      };
      mockery.registerMock('xml2js', xml2jsMock);

      var helper = require(this.testEnv.basePath + '/backend/core/contact/google');
      helper.saveGoogleContacts('<pipo>PIPO</pipo>', user, function(err) {
        expect(err).to.not.exist;
        expect(contactSaveCount).to.equal(2);
        done();
      });
    });

  });

  describe('fetchAndSaveGoogleContacts fn', function() {

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
            setCredentials: function() {
            },
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
      mockery.registerMock('https', httpsMock);

      var esnConf = function(key) {
        return {
          get: function(callback) {
            return callback(null, {google: {}});
          }
        };
      };
      mockery.registerMock('../esn-config', esnConf);

      var contacts = require(this.testEnv.basePath + '/backend/webserver/controllers/import/google');

      var req = {
        params: {},
        user: {
          emails: ['pipo1@pipo.com']
        },
        query: {code: 1234},
        get: function() {
        },
        openpaas: {
          getBaseURL: function() {
            return 'http://localhost';
          }
        }
      };
      contacts.fetchGoogleContacts(req, {});
    });
  });

});
