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
      },
      pubsub: {}
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

        it('should prefer specified contact ID in parameter', function(done) {
          mockery.registerMock('../dav-client', {
            rawClient: function(options) {
              expect(options.url).to.equal('/dav/api/addressbooks/123/contacts/use_this_id.vcf');
              done();
            }
          });
          addressbook().contacts('456').get('use_this_id');
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

      describe('The search fn', function() {

        function createSearchClientMock(mock) {
          return function() {
            return {
              searchContacts: mock
            };
          };
        }

        it('should call searchClient.searchContacts with the rith parameters', function(done) {
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
          addressbook().contacts().search(searchOptions);
        });

        it('should reject error occur while searching contact', function(done) {
          mockery.registerMock('../search', createSearchClientMock(function(options, callback) {
            callback('some error');
          }));
          addressbook().contacts().search({}).then(null, function(err) {
            expect(err).to.equal('some error');
            done();
          });
        });

        it('should resolve empty results when the search list is undefined', function(done) {
          mockery.registerMock('../search', createSearchClientMock(function(options, callback) {
            callback(null, {});
          }));
          addressbook().contacts().search({}).then(function(data) {
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
          addressbook().contacts().search({}).then(function(data) {
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
              expect(options.url).to.equal('/dav/api/addressbooks/123/contacts/' + hitLists[counter]._id + '.vcf');
              counter++;
              if (counter === 3) {
                callback('some error');
              } else {
                callback(null, 'response' + counter, 'body' + counter);
              }
            }
          });

          mockery.registerMock('../search', createSearchClientMock(function(options, callback) {
            callback(null, {
              list: hitLists
            });
          }));

          addressbook().contacts().search({}).then(function(data) {
            expect(data.results).to.eql([
              { contactId: 1, response: 'response1', body: 'body1' },
              { contactId: 2, response: 'response2', body: 'body2' },
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
              expect(options.url).to.equal('/dav/api/addressbooks/123/contacts/' + hitLists[counter]._id + '.vcf');
              counter++;
              if (counter === 1) {
                setTimeout(function() {
                  callback(null, 'retard response', 'body');
                }, 200);
              } else {
                callback(null, 'response' + counter, 'body' + counter);
              }
            }
          });

          mockery.registerMock('../search', createSearchClientMock(function(options, callback) {
            callback(null, {
              list: hitLists
            });
          }));

          addressbook().contacts().search({}).then(function(data) {
            expect(data.results).to.eql([
              { contactId: 1, response: 'retard response', body: 'body' },
              { contactId: 2, response: 'response2', body: 'body2' },
              { contactId: 3, response: 'response3', body: 'body3' }
            ]);
            done();
          });

        });

      });

    });

  });

});
