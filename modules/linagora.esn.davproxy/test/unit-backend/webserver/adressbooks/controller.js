'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');
const sinon = require('sinon');
var q = require('q');

describe('The addressbooks module', function() {

  var deps, dependencies, contactVcardMock;
  var endpoint = 'http://devhost:98298';

  beforeEach(function() {
    contactVcardMock = {
      get: function() {},
      create: function() {},
      update: function() {},
      del: function() {},
      list: function() {}
    };
    dependencies = {
      'esn-config': function() {
        return {
          get: function(callback) {
            return callback(null, {
              backend: { url: endpoint },
              base_url: null
            });
          }
        };
      },
      logger: {
        error: console.log, // eslint-disable-line no-console
        debug: function() {},
        warn: function() {}
      },
      config: function() {
        return {};
      },

      contact: {
        lib: {
          constants: require('../../../../../linagora.esn.contact/backend/lib/constants'),
          client: function() {
            return {
              addressbookHome: function() {
                return {
                  addressbook: function() {
                    return {
                      vcard: function() {
                        return contactVcardMock;
                      }
                    };
                  }
                };
              }
            };
          }
        }
      },
      helpers: {
        config: {
          getBaseUrl: function(user, callback) {
            callback(null, 'http://localhost:8080');
          }
        }
      }
    };
    deps = function(name) {
      return dependencies[name];
    };
  });

  var getController = function() {
    return require('../../../../backend/webserver/addressbooks/controller')(deps);
  };

  describe('The defaultHandler function', function() {

    it('should call the proxy module', function(done) {
      mockery.registerMock('../proxy', function() {
        return function() {
          return {
            handle: function() {
              return function() {
                done();
              };
            }
          };
        };
      });
      getController().defaultHandler();
    });
  });

  describe('The searchContacts fn', function() {
    const BOOK_HOME = 'book12345';

    function createContactClientMock({ searchContacts }) {
      dependencies.contact = {
        lib: {
          client() {
            return {
              searchContacts
            };
          }
        }
      };
    }

    it('should search in addressbooks', function(done) {
      createContactClientMock({
        searchContacts() {
          return {
            then() { done(); }
          };
        }
      });

      const controller = getController();
      const req = {
        user: { id: BOOK_HOME },
        params: {bookHome: BOOK_HOME},
        query: {
          search: 'me'
        }
      };

      controller.searchContacts(req);
    });

    it('should return 500 response on error', function(done) {
      createContactClientMock({
        searchContacts() { return q.reject(); }
      });

      const controller = getController();
      const req = {
        user: { id: BOOK_HOME },
        params: {bookHome: BOOK_HOME},
        query: {
          search: 'me'
        }
      };

      controller.searchContacts(req, {
        status: function(code) {
          expect(code).to.equal(500);

          return {
            json: function(json) {
              expect(json).to.eql({
                error: {
                  code: 500,
                  message: 'Server Error',
                  details: 'Error while searching contacts'
                }
              });
              done();
            }
          };
        }
      });
    });

    it('should not inject text avatar if there is no body in card data', function(done) {
      const injectTextAvatarSpy = sinon.stub().returns(q.resolve());

      mockery.registerMock('./avatarHelper', function() {
        return {
          injectTextAvatar: injectTextAvatarSpy
        };
      });
      createContactClientMock({
        searchContacts() {
          return q.resolve({
            results: [{
              response: {
                statusCode: 200
              },
              current_page: 1,
              body: {}
            }, {
              response: {
                statusCode: 200
              },
              current_page: 1
            }]
          });
        }
      });

      const controller = getController();
      const req = {
        user: { id: BOOK_HOME },
        params: { bookHome: BOOK_HOME },
        query: {
          search: 'me'
        }
      };

      controller.searchContacts(req, {
        header: () => {},
        status(code) {
          expect(code).to.equal(200);

          return {
            json() {
              expect(injectTextAvatarSpy).to.have.been.calledOnce;
              done();
            }
          };
        }
      });
    });
  });
});
