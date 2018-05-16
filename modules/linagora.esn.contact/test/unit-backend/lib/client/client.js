'use strict';

const expect = require('chai').expect;
const mockery = require('mockery');
const sinon = require('sinon');
const HEADER_JSON = 'application/json';
const HEADER_VCARD_JSON = 'application/vcard+json';

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
          getDavEndpoint: function(user, callback) {
            callback(DAV_PREFIX);
          }
        }
      }
    };

    mockery.registerMock('./listener', function() {});
  });

  var dependencies = function(name) {
    return deps[name];
  };

  function getModule() {
    return require('../../../../backend/lib/client/index')(dependencies);
  }

  it('should not call getDavEndpoint if davserver option is provided', function() {
    const clientOptions = {
      ESNToken: '1111',
      davserver: 'http://localhost:80'
    };
    const addressbook = { id: 'addressbookId' };

    deps.davserver.utils.getDavEndpoint = sinon.spy();

    getModule()(clientOptions).addressbookHome().addressbook().create(addressbook);

    expect(deps.davserver.utils.getDavEndpoint).to.not.have.been.called;
  });

  it('should call getDavEndpoint to get DAV endpoint and cache it if davserver option is not provided', function() {
    const clientOptions = {
      ESNToken: '1111',
      user: { _id: '1', preferredDomainId: 'domain123' }
    };
    const addressbook = { id: 'addressbookId' };

    deps.davserver.utils.getDavEndpoint = sinon.spy(function(user, callback) {
      expect(user).to.equal(clientOptions.user);
      callback('http://localhost:80');
    });

    var client = getModule()(clientOptions);

    client.addressbookHome().addressbook().create(addressbook);
    client.addressbookHome().addressbook().create(addressbook);

    expect(deps.davserver.utils.getDavEndpoint).to.have.been.calledOnce;
    expect(deps.davserver.utils.getDavEndpoint).to.have.been.calledWith(clientOptions.user, sinon.match.func);
  });

  describe('The addressbookHome fn', function() {
    var CLIENT_OPTIONS = { ESNToken: '1111' };
    var BOOK_ID = '123';
    var BOOK_NAME = 'mybookname';
    var CONTACT_ID = '456';

    function expectBookHomeURL(url) {
      expect(url).to.equal([DAV_PREFIX, 'addressbooks', BOOK_ID + '.json'].join('/'));
    }

    function expectBookNameURL(url) {
      expect(url).to.equal([DAV_PREFIX, 'addressbooks', BOOK_ID, BOOK_NAME + '.json'].join('/'));
    }

    function expectVCardURL(url) {
      expect(url).to.equal([DAV_PREFIX, 'addressbooks', BOOK_ID, BOOK_NAME, CONTACT_ID + '.vcf'].join('/'));
    }

    function getAddressbookHome() {
      return getModule()(CLIENT_OPTIONS).addressbookHome(BOOK_ID);
    }

    function getVCardUrl(cardId) {
      return [DAV_PREFIX, 'addressbooks', BOOK_ID, BOOK_NAME, cardId + '.vcf'].join('/');
    }

    describe('The addressbook fn', function() {

      function getAddressbook() {
        return getAddressbookHome().addressbook(BOOK_NAME);
      }

      describe('The list addressbook fn', function() {

        it('should call davClient with the right parameters', function(done) {
          mockery.registerMock('../dav-client', {
            rawClient: function(options) {
              expect(options).to.shallowDeepEqual({
                method: 'GET',
                json: true,
                headers: {
                  ESNToken: CLIENT_OPTIONS.ESNToken,
                  accept: HEADER_VCARD_JSON
                },
                body: undefined
              });
              expectBookHomeURL(options.url);
              done();
            }
          });
          getAddressbookHome().addressbook().list();
        });

        it('should call davClient with the right query if query present in options', function(done) {
          var options = {
            query: { public: true }
          };

          mockery.registerMock('../dav-client', {
            rawClient: function(clientOptions) {
              expect(clientOptions).to.shallowDeepEqual({
                method: 'GET',
                json: true,
                headers: {
                  ESNToken: CLIENT_OPTIONS.ESNToken,
                  accept: HEADER_VCARD_JSON
                },
                body: undefined,
                query: options.query
              });
              expectBookHomeURL(clientOptions.url);
              done();
            }
          });
          getAddressbookHome().addressbook().list(options);
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

          getAddressbookHome().addressbook().list().then(function(data) {
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

          getAddressbookHome().addressbook().list().then(null, function(err) {
            expect(err).to.equal('a error');
            done();
          });
        });

      });

      describe('The create addressbook fn', function() {

        it('should call davClient with right parameters', function(done) {
          var addressbook = { id: '456' };
          mockery.registerMock('../dav-client', {
            rawClient: function(options) {
              expect(options.method).to.equal('POST');
              expect(options.json).to.be.true;
              expect(options.headers).to.eql({
                ESNToken: CLIENT_OPTIONS.ESNToken,
                accept: HEADER_VCARD_JSON
              });
              expectBookHomeURL(options.url);
              expect(options.body).to.equal(addressbook);
              done();
            }
          });
          getAddressbookHome().addressbook().create(addressbook);
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

          getAddressbookHome().addressbook().create({}).then(function(data) {
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

          getAddressbookHome().addressbook().create({}).then(null, function(err) {
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

          getAddressbookHome().addressbook().create({}).then(null, function(err) {
            expect(err).to.exist;
            done();
          });
        });
      });

      describe('The get addressbook fn', function() {
        var PROPERTIES = {
          '{DAV:}displayname': 'dav:name',
          '{urn:ietf:params:xml:ns:carddav}addressbook-description': 'carddav:description',
          '{DAV:}acl': 'dav:acl',
          '{http://open-paas.org/contacts}source': 'openpaas:source',
          '{http://open-paas.org/contacts}type': 'type',
          acl: 'acl'
        };

        it('should call davClient with right parameters', function(done) {
          mockery.registerMock('../dav-client', {
            rawClient: function(options) {
              expect(options).to.shallowDeepEqual({
                method: 'PROPFIND',
                json: true,
                headers: {
                  ESNToken: CLIENT_OPTIONS.ESNToken,
                  accept: HEADER_JSON
                },
                body: { properties: Object.keys(PROPERTIES) }
              });
              expectBookNameURL(options.url);
              done();
            }
          });
          getAddressbookHome().addressbook(BOOK_NAME).get();
        });

        it('should resolve with response after extracting info', function(done) {
          const name = 'addressbook display name';
          const description = 'addressbook description';
          const davAcl = ['dav:read'];
          const type = 'twitter';
          const acl = [];
          const source = { _links: { href: '' }};
          const response = { statusCode: 200 };
          const body = {
            '{DAV:}displayname': name,
            '{urn:ietf:params:xml:ns:carddav}addressbook-description': description,
            '{DAV:}acl': davAcl,
            '{http://open-paas.org/contacts}source': source,
            '{http://open-paas.org/contacts}type': type,
            acl
          };

          mockery.registerMock('../dav-client', {
            rawClient: function(options, callback) {
              callback(null, response, body);
            }
          });

          getAddressbookHome().addressbook(BOOK_NAME).get().then(function(data) {
            expect(data.response).to.deep.equal(response);
            expect(data.body).to.deep.equal({
              _links: {
                self: {
                  href: ['/dav/api/addressbooks', BOOK_ID, BOOK_NAME + '.json'].join('/')
                }
              },
              'dav:name': name,
              'carddav:description': description,
              'dav:acl': davAcl,
              'openpaas:source': source,
              type: type,
              acl
            });
            done();
          }).catch(done);
        });

        it('should reject with error when client returns error', function(done) {
          mockery.registerMock('../dav-client', {
            rawClient: function(options, callback) {
              callback('a error');
            }
          });

          getAddressbookHome().addressbook(BOOK_NAME).get().then(null, function(err) {
            expect(err).to.equal('a error');
            done();
          });
        });

      });

      describe('The update addressbook function', function() {
        it('should reject when HTTP status is not 204', function(done) {
          mockery.registerMock('../dav-client', {
            rawClient: (options, callback) => {
              callback(null, { statusCode: 403 });
            }
          });

          getAddressbook().update({})
            .then(null, err => {
              expect(err).to.exist;
              done();
            });
        });
      });

      describe('The vcard fn', function() {

        function getVcard(id) {
          return getAddressbook().vcard(id);
        }

        describe('The list fn', function() {
          it('should call davClient with right parameters', function(done) {
            var query = { q: 'some query' };
            mockery.registerMock('../dav-client', {
              rawClient: function(options) {
                expect(options.json).to.be.true;
                expect(options.headers).to.eql({
                  ESNToken: CLIENT_OPTIONS.ESNToken,
                  accept: HEADER_VCARD_JSON
                });
                expectBookNameURL(options.url);
                expect(options.query).to.equal(query);
                done();
              }
            });
            getAddressbook().vcard().list(query);
          });

          it('should have default empty query', function(done) {
            mockery.registerMock('../dav-client', {
              rawClient: function(options) {
                expect(options.query).to.eql({});
                done();
              }
            });
            getAddressbook().vcard().list();
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

            getAddressbook().vcard().list().then(function(data) {
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

            getAddressbook().vcard().list().then(null, function(err) {
              expect(err).to.equal('a error');
              done();
            });
          });
        });

        describe('The search fn', function() {
          beforeEach(function() {
            mockery.registerMock('../dav-client', {
              rawClient: (options, callback) => {
                if (options.url === `${DAV_PREFIX}/addressbooks/${BOOK_ID}.json`) {
                  callback(
                    null,
                    { statusCode: 200 },
                    {
                      _embedded: {
                        'dav:addressbook': [{
                          _links: {
                            self: {
                              href: `addressbooks/${BOOK_ID}/${BOOK_NAME}.json`
                            }
                          }
                        }]
                      }
                    }
                  );
                }
              }
            });
          });

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
                addressbooks: [{
                  bookHome: BOOK_ID,
                  bookName: BOOK_NAME
                }],
                search: searchOptions.search,
                limit: searchOptions.limit,
                page: searchOptions.page
              });
              done();
            }));
            getAddressbook().vcard().search(searchOptions);
          });

          it('should reject error occur while searching contact', function(done) {
            mockery.registerMock('../search', createSearchClientMock(function(options, callback) {
              callback('some error');
            }));
            getAddressbook().vcard().search({}).then(null, function(err) {
              expect(err).to.equal('some error');
              done();
            });
          });

          it('should resolve empty results when the search list is undefined', function(done) {
            mockery.registerMock('../search', createSearchClientMock(function(options, callback) {
              callback(null, {});
            }));
            getAddressbook().vcard().search({}).then(function(data) {
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
            getAddressbook().vcard().search({}).then(function(data) {
              expect(data.total_count).to.equal(100);
              expect(data.current_page).to.equal(2);
              done();
            });
          });

          it('should resolve contacts fetched from DAV', function(done) {
            var counter = 0;
            var hitLists = [
              {_id: 1, _source: {bookId: BOOK_ID, bookName: BOOK_NAME, _id: 1}},
              {_id: 2, _source: {bookId: BOOK_ID, bookName: BOOK_NAME, _id: 2}},
              {_id: 3, _source: {bookId: BOOK_ID, bookName: BOOK_NAME, _id: 3}}
            ];

            mockery.registerMock('../dav-client', {
              rawClient: (options, callback) => {
                if (options.url === `${DAV_PREFIX}/addressbooks/${BOOK_ID}.json`) {
                  callback(
                    null,
                    { statusCode: 200 },
                    {
                      _embedded: {
                        'dav:addressbook': [{
                          _links: {
                            self: {
                              href: `addressbooks/${BOOK_ID}/${BOOK_NAME}.json`
                            }
                          }
                        }]
                      }
                    }
                  );
                } else if (options.url === `${DAV_PREFIX}/addressbooks/${BOOK_ID}/${BOOK_NAME}/${hitLists[counter]._id}.vcf`) {
                  counter++;
                  if (counter === 3) {
                    callback('some error');
                  } else {
                    callback(null, { statusCode: 200 }, { counter: counter });
                  }
                }
              }
            });

            mockery.registerMock('../search', createSearchClientMock(function(options, callback) {
              callback(null, {
                list: hitLists
              });
            }));

            getAddressbook().vcard().search({}).then(function(data) {
              expect(data.results).to.eql([
                { contactId: 1, bookId: BOOK_ID, bookName: BOOK_NAME, response: {statusCode: 200}, body: {counter: 1}},
                { contactId: 2, bookId: BOOK_ID, bookName: BOOK_NAME, response: {statusCode: 200}, body: {counter: 2}},
                { contactId: 3, bookId: BOOK_ID, bookName: BOOK_NAME, err: 'some error' }
              ]);
              done();
            });
          });

          it('should return the contacts in the correct order', function(done) {
            var counter = 0;
            var hitLists = [
              {_id: 1, _source: {bookId: BOOK_ID, bookName: BOOK_NAME}},
              {_id: 2, _source: {bookId: BOOK_ID, bookName: BOOK_NAME}},
              {_id: 3, _source: {bookId: BOOK_ID, bookName: BOOK_NAME}}
            ];

            mockery.registerMock('../dav-client', {
              rawClient: (options, callback) => {
                if (options.url === `${DAV_PREFIX}/addressbooks/${BOOK_ID}.json`) {
                  callback(
                    null,
                    { statusCode: 200 },
                    {
                      _embedded: {
                        'dav:addressbook': [{
                          _links: {
                            self: {
                              href: `addressbooks/${BOOK_ID}/${BOOK_NAME}.json`
                            }
                          }
                        }]
                      }
                    }
                  );
                } else if (options.url === `${DAV_PREFIX}/addressbooks/${BOOK_ID}/${BOOK_NAME}/${hitLists[counter]._id}.vcf`) {
                  counter++;
                  if (counter === 1) {
                    setTimeout(function() {
                      callback(null, {statusCode: 200}, {delay: 1});
                    }, 200);
                  } else {
                    callback(null, {statusCode: 200}, {counter: counter});
                  }
                }
              }
            });

            mockery.registerMock('../search', createSearchClientMock(function(options, callback) {
              callback(null, {
                list: hitLists
              });
            }));

            getAddressbook().vcard().search({}).then(function(data) {
              expect(data.results).to.eql([
                { contactId: 1, bookId: BOOK_ID, bookName: BOOK_NAME, response: {statusCode: 200}, body: {delay: 1}},
                { contactId: 2, bookId: BOOK_ID, bookName: BOOK_NAME, response: {statusCode: 200}, body: {counter: 2}},
                { contactId: 3, bookId: BOOK_ID, bookName: BOOK_NAME, response: {statusCode: 200}, body: {counter: 3}}
              ]);
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
                  accept: HEADER_VCARD_JSON
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
                  accept: HEADER_VCARD_JSON
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
                  accept: HEADER_VCARD_JSON
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

        describe('The remove fn', function() {
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

            getVcard(CONTACT_ID).remove();
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

            getVcard(CONTACT_ID).remove().then(function(data) {
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

            getVcard(CONTACT_ID).remove().then(null, function(err) {
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

            getVcard(CONTACT_ID).remove().then(null, function(err) {
              expect(err).to.exist;
              done();
            });
          });

        });

        describe('The removeMultiple fn', function() {
          it('should query for contacts at first', function(done) {
            var query = {
              modifiedBefore: '123'
            };
            mockery.registerMock('../dav-client', {
              rawClient: function(options) {
                expect(options).to.shallowDeepEqual({
                  method: 'GET',
                  json: true,
                  headers: {
                    ESNToken: CLIENT_OPTIONS.ESNToken
                  },
                  query: query
                });
                expectBookNameURL(options.url);
                done();
              }
            });

            getVcard().removeMultiple(query);
          });

          it('should remove contacts one by one', function(done) {
            var response = {
              statusCode: 200
            };
            var body = {
              _embedded: {
                'dav:item': [{
                  data: ['vcard', [
                    ['uid', {}, 'text', '1']
                  ], []]
                }, {
                  data: ['vcard', [
                    ['uid', {}, 'text', '2']
                  ], []]
                }, {
                  data: ['vcard', [
                    ['uid', {}, 'text', '3']
                  ], []]
                }]
              }
            };

            var callCounter = 0;
            mockery.registerMock('../dav-client', {
              rawClient: function(options, callback) {
                if (options.method === 'GET') {
                  callback(null, response, body);
                } else if (options.method === 'DELETE') {
                  callCounter++;
                  expect(options.url).to.equal(getVCardUrl(callCounter));
                  if (callCounter === 3) {
                    done();
                  }
                  callback(null, { statusCode: 204 });
                }
              }
            });

            getVcard().removeMultiple({ modifiedBefore: 1 }).catch(done);
          });

          it('should resolve an array of removed contact object informations', function(done) {
            var getResponse = {
              statusCode: 200
            };
            var getBody = {
              _embedded: {
                'dav:item': [{
                  data: ['vcard', [
                    ['uid', {}, 'text', '1']
                  ], []]
                }, {
                  data: ['vcard', [
                    ['uid', {}, 'text', '2']
                  ], []]
                }, {
                  data: ['vcard', [
                    ['uid', {}, 'text', '3']
                  ], []]
                }]
              }
            };

            var deleteResponse = { statusCode: 204 };

            mockery.registerMock('../dav-client', {
              rawClient: function(options, callback) {
                if (options.method === 'GET') {
                  callback(null, getResponse, getBody);
                } else if (options.method === 'DELETE') {
                  callback(null, deleteResponse);
                }
              }
            });

            var deleteData = { response: deleteResponse };
            getVcard().removeMultiple({ modifiedBefore: 1 }).then(function(data) {
              expect(data).to.shallowDeepEqual([{
                cardId: '1',
                data: deleteData
              }, {
                cardId: '2',
                data: deleteData
              }, {
                cardId: '3',
                data: deleteData
              }]);
              done();
            }, done);
          });

          it('should still resolve an array of removed contact object informations when some contacts are failed to remove', function(done) {
            var getResponse = {
              statusCode: 200
            };
            var getBody = {
              _embedded: {
                'dav:item': [{
                  data: ['vcard', [
                    ['uid', {}, 'text', '1']
                  ], []]
                }, {
                  data: ['vcard', [
                    ['uid', {}, 'text', '2']
                  ], []]
                }, {
                  data: ['vcard', [
                    ['uid', {}, 'text', '3']
                  ], []]
                }]
              }
            };

            var deleteResponse = { statusCode: 204 };

            var callCounter = 0;
            mockery.registerMock('../dav-client', {
              rawClient: function(options, callback) {
                if (options.method === 'GET') {
                  callback(null, getResponse, getBody);
                } else if (options.method === 'DELETE') {
                  callCounter++;
                  if (callCounter === 2) {
                    callback(null, { statusCode: 500 });
                  } else {
                    callback(null, { statusCode: 204 });
                  }
                }
              }
            });
            var deleteData = { response: deleteResponse };
            getVcard().removeMultiple({ modifiedBefore: 1 }).then(function(data) {
              expect(data).to.shallowDeepEqual([{
                cardId: '1',
                data: deleteData
              }, {
                cardId: '2',
                error: new Error()
              }, {
                cardId: '3',
                data: deleteData
              }]);
              done();
            }, done);
          });

          it('should reject when called with no options', function(done) {
            getVcard().removeMultiple().then(done, function(err) {
              expect(err.message).to.equal('options.modifiedBefore is required');
              done();
            });
          });

          it('should reject when called with options without modifiedBefore field', function(done) {
            getVcard().removeMultiple({}).then(done, function(err) {
              expect(err.message).to.equal('options.modifiedBefore is required');
              done();
            });
          });

        });

        describe('The move function', function() {
          it('should send a request to dav server with right destination header to move contact', function(done) {
            const destAddressbook = '/addressbooks/123/destination-addressook/456.vcf';

            mockery.registerMock('../dav-client', {
              rawClient: function(options) {
                expect(options.method).to.equal('MOVE');
                expect(options.headers).to.deep.equal({
                  ESNToken: CLIENT_OPTIONS.ESNToken,
                  Destination: `${DAV_PREFIX}${destAddressbook}`
                });
                expectVCardURL(options.url);
                done();
              }
            });

            getVcard(CONTACT_ID).move(destAddressbook);
          });
        });
      });
    });
  });
});
