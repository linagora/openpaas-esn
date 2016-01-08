'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var VCARD_JSON = 'application/vcard+json';

describe('The contact client APIs', function() {
  var deps;
  var DAV_PREFIX = '/dav/api';

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
            callback(DAV_PREFIX);
          }
        }
      },
      pubsub: {}
    };
  });

  var dependencies = function(name) {
    return deps[name];
  };

  function getModule() {
    return require('../../../../backend/lib/client/index')(dependencies);
  }

  describe('The addressbookHome fn', function() {
    var CLIENT_OPTIONS = { ESNToken: '1111' };
    var BOOK_ID = '123';
    var BOOK_NAME = 'mybookname';
    var CONTACT_ID = '456';

    function expectBookHomeURL(url) {
      expect(url).to.equal(DAV_PREFIX + '/addressbooks/' + BOOK_ID + '.json');
    }

    function expectBookNameURL(url) {
      expect(url).to.equal(DAV_PREFIX + '/addressbooks/' + BOOK_ID + '/' + BOOK_NAME + '.json');
    }

    function expectVCardURL(url) {
      expect(url).to.equal(DAV_PREFIX + '/addressbooks/' + BOOK_ID + '/' + BOOK_NAME + '/' + CONTACT_ID + '.vcf');
    }

    function getAddressbookHome() {
      return getModule()(CLIENT_OPTIONS).addressbookHome(BOOK_ID);
    }

    describe('The addressbook fn', function() {

      function getAddressbook() {
        return getAddressbookHome().addressbook(BOOK_NAME);
      }

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
              expectBookNameURL(options.url);
              expect(options.query).to.equal(query);
              done();
            }
          });
          getAddressbook().list(query);
        });

        it('should have default empty query', function(done) {
          mockery.registerMock('../dav-client', {
            rawClient: function(options) {
              expect(options.query).to.eql({});
              done();
            }
          });
          getAddressbook().list();
        });

        it('should resolve with response and body', function(done) {
          var response = {
            statusCode: 200
          };
          var body = {
            _id: 123
          };

          mockery.registerMock('../dav-client', {
            rawClient: function(options, callback) {
              callback(null, response, body);
            }
          });

          getAddressbook().list().then(function(data) {
            expect(data.response).to.deep.equal(response);
            expect(data.body).to.deep.equal(body);
            done();
          });
        });

        it('should reject with error', function(done) {
          mockery.registerMock('../dav-client', {
            rawClient: function(options, callback) {
              callback('a error');
            }
          });

          getAddressbook().list().then(null, function(err) {
            expect(err).to.equal('a error');
            done();
          });
        });
      });

      describe('The vcard fn', function() {

        function getVcard(id) {
          return getAddressbook().vcard(id);
        }

        describe('The get fn', function() {
          it('should call davClient with right parameters', function(done) {
            mockery.registerMock('../dav-client', {
              rawClient: function(options) {
                expect(options.json).to.be.true;
                expect(options.headers).to.eql({
                  ESNToken: CLIENT_OPTIONS.ESNToken,
                  accept: VCARD_JSON
                });
                expectVCardURL(options.url);
                done();
              }
            });
            getVcard(CONTACT_ID).get();
          });

          it('should resolve with response and body', function(done) {
            var response = {
              statusCode: 200
            };
            var body = {
              _id: 123
            };

            mockery.registerMock('../dav-client', {
              rawClient: function(options, callback) {
                callback(null, response, body);
              }
            });

            getVcard(CONTACT_ID).get().then(function(data) {
              expect(data.response).to.deep.equal(response);
              expect(data.body).to.deep.equal(body);
              done();
            });
          });

          it('should reject with error', function(done) {
            mockery.registerMock('../dav-client', {
              rawClient: function(options, callback) {
                callback('a error');
              }
            });

            getVcard(CONTACT_ID).get().then(null, function(err) {
              expect(err).to.equal('a error');
              done();
            });
          });
        });

        describe('The create fn', function() {
          it('should call davClient with right parameters', function(done) {
            var contact = {id: '456'};
            mockery.registerMock('../dav-client', {
              rawClient: function(options) {
                expect(options.method).to.equal('PUT');
                expect(options.json).to.be.true;
                expect(options.headers).to.eql({
                  ESNToken: CLIENT_OPTIONS.ESNToken,
                  accept: VCARD_JSON
                });
                expectVCardURL(options.url);
                expect(options.body).to.deep.equal(contact);
                done();
              }
            });
            getVcard(CONTACT_ID).create(contact);
          });

          it('should resolve with response and body', function(done) {
            var response = {
              statusCode: 200
            };
            var body = {
              _id: 123
            };

            mockery.registerMock('../dav-client', {
              rawClient: function(options, callback) {
                callback(null, response, body);
              }
            });

            getVcard(CONTACT_ID).create({}).then(function(data) {
              expect(data.response).to.deep.equal(response);
              expect(data.body).to.deep.equal(body);
              done();
            });
          });

          it('should reject with error when client returns error', function(done) {
            mockery.registerMock('../dav-client', {
              rawClient: function(options, callback) {
                callback('a error');
              }
            });

            getVcard(CONTACT_ID).create({}).then(null, function(err) {
              expect(err).to.equal('a error');
              done();
            });
          });

          it('should reject when HTTP status is not 201', function(done) {
            mockery.registerMock('../dav-client', {
              rawClient: function(options, callback) {
                callback(null, {statusCode: 199});
              }
            });

            getVcard(CONTACT_ID).create({}).then(null, function(err) {
              expect(err).to.exist;
              done();
            });
          });
        });

        describe('The update fn', function() {
          it('should call davClient with right parameters', function(done) {
            var contact = {id: '456'};
            mockery.registerMock('../dav-client', {
              rawClient: function(options) {
                expect(options.method).to.equal('PUT');
                expect(options.json).to.be.true;
                expect(options.headers).to.eql({
                  ESNToken: CLIENT_OPTIONS.ESNToken,
                  accept: VCARD_JSON
                });
                expectVCardURL(options.url);
                expect(options.body).to.deep.equal(contact);
                done();
              }
            });

            getVcard(CONTACT_ID).update(contact);
          });

          it('should resolve with response and body', function(done) {
            var response = {
              statusCode: 200
            };
            var body = {
              _id: 123
            };

            mockery.registerMock('../dav-client', {
              rawClient: function(options, callback) {
                callback(null, response, body);
              }
            });

            getVcard(CONTACT_ID).update({}).then(function(data) {
              expect(data.response).to.deep.equal(response);
              expect(data.body).to.deep.equal(body);
              done();
            });
          });

          it('should reject with error', function(done) {
            mockery.registerMock('../dav-client', {
              rawClient: function(options, callback) {
                callback('a error');
              }
            });

            getVcard(CONTACT_ID).update({}).then(null, function(err) {
              expect(err).to.equal('a error');
              done();
            });
          });

          it('should reject when HTTP status is not 200', function(done) {
            mockery.registerMock('../dav-client', {
              rawClient: function(options, callback) {
                callback(null, {statusCode: 199});
              }
            });

            getVcard(CONTACT_ID).update({}).then(null, function(err) {
              expect(err).to.exist;
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
                expectVCardURL(options.url);
                done();
              }
            });

            getVcard(CONTACT_ID).del();
          });

          it('should resolve with response and body', function(done) {
            var response = {
              statusCode: 204
            };
            var body = {
              _id: 123
            };

            mockery.registerMock('../dav-client', {
              rawClient: function(options, callback) {
                callback(null, response, body);
              }
            });

            getVcard(CONTACT_ID).del().then(function(data) {
              expect(data.response).to.deep.equal(response);
              expect(data.body).to.deep.equal(body);
              done();
            });
          });

          it('should reject with error', function(done) {
            mockery.registerMock('../dav-client', {
              rawClient: function(options, callback) {
                callback('a error');
              }
            });

            getVcard(CONTACT_ID).del().then(null, function(err) {
              expect(err).to.equal('a error');
              done();
            });
          });

          it('should reject when HTTP status is not 204', function(done) {
            mockery.registerMock('../dav-client', {
              rawClient: function(options, callback) {
                callback(null, {statusCode: 203});
              }
            });

            getVcard(CONTACT_ID).del().then(null, function(err) {
              expect(err).to.exist;
              done();
            });
          });

        });
      });

      describe('The search fn', function() {

        function createSearchClientMock(mock) {
          return function() {
            return {
              searchContacts: mock
            };
          };
        }

        it('should call searchClient.searchContacts with the right parameters', function(done) {
          var searchOptions = {
            search: 'alex',
            userId: 'userId',
            limit: 10,
            page: 1
          };
          mockery.registerMock('../search', createSearchClientMock(function(options) {
            expect(options).to.eql({
              bookId: '123',
              search: searchOptions.search,
              userId: searchOptions.userId,
              limit: searchOptions.limit,
              page: searchOptions.page
            });
            done();
          }));
          getAddressbook().search(searchOptions);
        });

        it('should reject error occur while searching contact', function(done) {
          mockery.registerMock('../search', createSearchClientMock(function(options, callback) {
            callback('some error');
          }));
          getAddressbook().search({}).then(null, function(err) {
            expect(err).to.equal('some error');
            done();
          });
        });

        it('should resolve empty results when the search list is undefined', function(done) {
          mockery.registerMock('../search', createSearchClientMock(function(options, callback) {
            callback(null, {});
          }));
          getAddressbook().search({}).then(function(data) {
            expect(data.results).to.eql([]);
            done();
          });
        });

        it('should resolve total_count and current_page returned from search', function(done) {
          mockery.registerMock('../search', createSearchClientMock(function(options, callback) {
            callback(null, {
              total_count: 100,
              current_page: 2
            });
          }));
          getAddressbook().search({}).then(function(data) {
            expect(data.total_count).to.equal(100);
            expect(data.current_page).to.equal(2);
            done();
          });
        });

        it('should resolve contacts fetched from DAV', function(done) {
          var counter = 0;
          var hitLists = [{ _id: 1 }, { _id: 2 }, { _id: 3 }];
          mockery.registerMock('../dav-client', {
            rawClient: function(options, callback) {
              expect(options.url).to.equal(DAV_PREFIX + '/addressbooks/' + BOOK_ID + '/' + BOOK_NAME + '/' + hitLists[counter]._id + '.vcf');
              counter++;
              if (counter === 3) {
                callback('some error');
              } else {
                callback(null, {statusCode: 200}, {counter: counter});
              }
            }
          });

          mockery.registerMock('../search', createSearchClientMock(function(options, callback) {
            callback(null, {
              list: hitLists
            });
          }));

          getAddressbook().search({}).then(function(data) {
            expect(data.results).to.eql([
              { contactId: 1, response: {statusCode: 200}, body: {counter: 1}},
              { contactId: 2, response: {statusCode: 200}, body: {counter: 2}},
              { contactId: 3, err: 'some error' }
            ]);
            done();
          });
        });

        it('should return the contacts in the correct order', function(done) {
          var counter = 0;
          var hitLists = [{ _id: 1 }, { _id: 2 }, { _id: 3 }];
          mockery.registerMock('../dav-client', {
            rawClient: function(options, callback) {
              expect(options.url).to.equal(DAV_PREFIX + '/addressbooks/' + BOOK_ID + '/' + BOOK_NAME + '/' + hitLists[counter]._id + '.vcf');
              counter++;
              if (counter === 1) {
                setTimeout(function() {
                  callback(null, {statusCode: 200}, {delay: 1});
                }, 200);
              } else {
                callback(null, {statusCode: 200}, {counter: counter});
              }
            }
          });

          mockery.registerMock('../search', createSearchClientMock(function(options, callback) {
            callback(null, {
              list: hitLists
            });
          }));

          getAddressbook().search({}).then(function(data) {
            expect(data.results).to.eql([
              { contactId: 1, response: {statusCode: 200}, body: {delay: 1}},
              { contactId: 2, response: {statusCode: 200}, body: {counter: 2}},
              { contactId: 3, response: {statusCode: 200}, body: {counter: 3}}
            ]);
            done();
          });

        });

      });

    }); // The addressbook fn

    describe('The create addressbook fn', function() {

      it('should call davClient with right parameters', function(done) {
        var addressbook = { id: '456' };
        mockery.registerMock('../dav-client', {
          rawClient: function(options) {
            expect(options.method).to.equal('POST');
            expect(options.json).to.be.true;
            expect(options.headers).to.eql({
              ESNToken: CLIENT_OPTIONS.ESNToken,
              accept: VCARD_JSON
            });
            expectBookHomeURL(options.url);
            expect(options.body).to.equal(addressbook);
            done();
          }
        });
        getAddressbookHome().create(addressbook);
      });

      it('should resolve with response', function(done) {
        var response = {
          statusCode: 200
        };

        mockery.registerMock('../dav-client', {
          rawClient: function(options, callback) {
            callback(null, response);
          }
        });

        getAddressbookHome().create({}).then(function(data) {
          expect(data.response).to.deep.equal(response);
          done();
        });
      });

      it('should reject with error when client returns error', function(done) {
        mockery.registerMock('../dav-client', {
          rawClient: function(options, callback) {
            callback('a error');
          }
        });

        getAddressbookHome().create({}).then(null, function(err) {
          expect(err).to.equal('a error');
          done();
        });
      });

      it('should reject when HTTP status is not 201', function(done) {
        mockery.registerMock('../dav-client', {
          rawClient: function(options, callback) {
            callback(null, {statusCode: 199});
          }
        });

        getAddressbookHome().create({}).then(null, function(err) {
          expect(err).to.exist;
          done();
        });
      });
    }); // The create addressbook fn

    describe('The list addressbook fn', function() {

      it('should call davClient with the right parameters', function(done) {
        mockery.registerMock('../dav-client', {
          rawClient: function(options) {
            expect(options).to.shallowDeepEqual({
              method: 'GET',
              json: true,
              headers: {
                ESNToken: CLIENT_OPTIONS.ESNToken,
                accept: VCARD_JSON
              },
              body: undefined
            });
            expectBookHomeURL(options.url);
            done();
          }
        });
        getAddressbookHome().list();
      });

      it('should resolve with response on success', function(done) {
        var response = {
          statusCode: 200
        };

        mockery.registerMock('../dav-client', {
          rawClient: function(options, callback) {
            callback(null, response);
          }
        });

        getAddressbookHome().list().then(function(data) {
          expect(data.response).to.deep.equal(response);
          done();
        });
      });

      it('should reject with error when client returns error', function(done) {
        mockery.registerMock('../dav-client', {
          rawClient: function(options, callback) {
            callback('a error');
          }
        });

        getAddressbookHome().list().then(null, function(err) {
          expect(err).to.equal('a error');
          done();
        });
      });

    }); // The list addresbook fn

  });

});
