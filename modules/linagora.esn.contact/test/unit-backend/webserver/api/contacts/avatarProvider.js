'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The contacts api avatar provider', function() {

  var provider, searchModuleMock, controllerMock, authModuleMock, davserverMock, url;

  beforeEach(function() {
    url = 'anUrl';
    davserverMock = {
      utils: {
        getDavEndpoint: function(callback) {
          return callback(url);
        }
      }
    };
    this.moduleHelpers.addDep('davserver', davserverMock);

    authModuleMock = {};
    this.moduleHelpers.addDep('auth', authModuleMock);

    this.moduleHelpers.addDep('avatar', {
      registerProvider: function() {}
    });

    controllerMock = {};
    mockery.registerMock('./controller', function() {
      return controllerMock;
    });

    searchModuleMock = {};
    mockery.registerMock('../../../lib/search/index', function() {
      return searchModuleMock;
    });

    this.moduleHelpers.backendPath = this.moduleHelpers.modulesPath + 'linagora.esn.contact/backend';
    provider = require(this.moduleHelpers.backendPath +
    '/webserver/api/contacts/avatarProvider').init(this.moduleHelpers.dependencies);
  });

  it('should expose 2 functions', function() {
    expect(provider.findByEmail).to.be.a.function;
    expect(provider.getAvatar).to.be.a.function;
  });

  describe('the findByEmail function', function() {
    var email = 'user@domain.com';

    it('should call searchModule and return err if some', function() {
      searchModuleMock.searchContacts = function(query, callback) {
        expect(query).to.deep.equal({search: email});
        return callback(new Error());
      };
      provider.findByEmail(email, function(err, object) {
        expect(err).to.exist;
        expect(object).to.not.exist;
      });
    });

    it('should call searchModule and return nothing if no contact is found', function() {
      searchModuleMock.searchContacts = function(query, callback) {
        expect(query).to.deep.equal({search: email});
        return callback();
      };
      provider.findByEmail(email, function(err, object) {
        expect(err).to.not.exist;
        expect(object).to.not.exist;
      });
    });

    it('should call searchModule and return the first found contact', function() {
      var contact = { id: 'contactId' };
      searchModuleMock.searchContacts = function(query, callback) {
        expect(query).to.deep.equal({search: email});
        return callback(null, {
          list: [contact, {id: 'otherContact'}]
        });
      };
      provider.findByEmail(email, function(err, object) {
        expect(err).to.not.exist;
        expect(object).to.deep.equal(contact);
      });
    });
  });

  describe('the getAvatar function', function() {
    var contact = {
      _id: 'contactId',
      _source: {
        userId: 'userId',
        bookId: 'bookId'
      }
    };

    beforeEach(function() {
      this.resWithError500 = function(done) {
        return {
          json: function(code) {
            expect(code).to.equal(500);
            done();
          }
        };
      };
    });

    it('should send back 500 if token generation fails', function(done) {
      authModuleMock.token = {
        getNewToken: function(options, callback) {
          expect(options).to.deep.equal({user: contact._source.userId});
          return callback(new Error());
        }
      };
      provider.getAvatar(contact, {}, this.resWithError500(done));
    });

    it('should send back 500 if token generation returns nothing', function(done) {
      authModuleMock.token = {
        getNewToken: function(options, callback) {
          expect(options).to.deep.equal({user: contact._source.userId});
          return callback();
        }
      };

      provider.getAvatar(contact, {}, this.resWithError500(done));
    });

    it('should call getAvatar from the api controller', function(done) {
      var token = 'aToken';

      controllerMock.getAvatar = function(req) {
        expect(req.token).to.equal(token);
        expect(req.davserver).to.equal(url);
        expect(req.params.addressBookId).to.equal(contact._source.bookId);
        expect(req.params.contactId).to.equal(contact._id);
        done();
      };

      authModuleMock.token = {
        getNewToken: function(options, callback) {
          expect(options).to.deep.equal({user: contact._source.userId});
          return callback(null, token);
        }
      };

      provider.getAvatar(contact, {params: {}});
    });
  });

});
