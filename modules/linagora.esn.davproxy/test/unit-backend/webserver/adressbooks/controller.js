'use strict';

var chai = require('chai');
var expect = chai.expect;
var mockery = require('mockery');
var q = require('q');

describe('The addressbooks module', function() {

  var deps, dependencies;
  var endpoint = 'http://devhost:98298';

  beforeEach(function() {
    dependencies = {
        'esn-config': function() {
        return {
          get: function(callback) {
            return callback(null, {backend: {url: endpoint}});
          }
        };
      },
      logger: {
        error: function() {},
        debug: function() {},
        warn: function() {}
      },
      pubsub: {
        local: {
          topic: function() {
            return {
              publish: function() {}
            };
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

  describe('The getContact function', function() {

    var req;
    beforeEach(function() {
      req = {
        token: {
          token: 123
        },
        davserver: 'http://dav:8080',
        url: '/foo/bar'
      };
    });

    it('should set right parameters', function(done) {
      mockery.registerMock('../proxy/http-client', function(options) {
        expect(options.headers.ESNToken).to.equal(req.token.token);
        expect(options.json).to.be.true;
        done();
      });

      getController().getContact(req);
    });

    it('should send back HTTP 500 if http client call fails', function(done) {
      mockery.registerMock('../proxy/http-client', function(options, callback) {
        return callback(new Error('You failed'));
      });

      getController().getContact(req, {
        json: function(code, json) {
          expect(code).to.equal(500);
          expect(json.error.details).to.match(/Error while getting contact from DAV server/);
          done();
        }
      });
    });

    it('should send back client response status code and body', function(done) {
      var statusCode = 200;
      var body = {foo: 'bar'};

      mockery.registerMock('../proxy/http-client', function(options, callback) {
        return callback(null, {statusCode: statusCode}, body);
      });

      getController().getContact(req, {
        json: function(code, json) {
          expect(code).to.equal(statusCode);
          expect(json).to.deep.equal(body);
          done();
        }
      });
    });
  });

  describe('The updateContact function', function() {

    var req;
    beforeEach(function() {
      req = {
        token: {
          token: 123
        },
        davserver: 'http://dav:8080',
        url: '/foo/bar',
        params: {
          bookId: 'book123',
          cardId: 'card123'
        }
      };
    });

    it('should set right parameters', function(done) {
      mockery.registerMock('../proxy/http-client', function(options) {
        expect(options.headers.ESNToken).to.equal(req.token.token);
        expect(options.json).to.be.true;
        expect(options.method).to.equal('PUT');
        done();
      });

      getController().updateContact(req);
    });

    it('should send back HTTP 500 if http client call fails', function(done) {
      mockery.registerMock('../proxy/http-client', function(options, callback) {
        return callback(new Error('You failed'));
      });

      getController().updateContact(req, {
        json: function(code, json) {
          expect(code).to.equal(500);
          expect(json.error.details).to.match(/Error while updating contact on DAV server/);
          done();
        }
      });
    });

    it('should send back client response status code and body', function(done) {
      var statusCode = 200;
      var body = {foo: 'bar'};

      mockery.registerMock('../proxy/http-client', function(options, callback) {
        return callback(null, {statusCode: statusCode}, body);
      });

      getController().updateContact(req, {
        json: function(code, json) {
          expect(code).to.equal(statusCode);
          expect(json).to.deep.equal(body);
          done();
        }
      });
    });

    it('should publish a "contacts:contact:update" event if request is an update', function(done) {
      var statusCode = 200;
      req.body = {foo: 'bar'};
      req.headers = {
        'if-match': 123
      };
      var called = false;

      dependencies.pubsub.local.topic = function(name) {
        expect(name).to.equal('contacts:contact:update');
        return {
          publish: function(data) {
            called = true;
            expect(data).to.deep.equal({
              contactId: req.params.contactId,
              bookId: req.params.bookId,
              vcard: req.body
            });
          }
        };
      };

      mockery.registerMock('../proxy/http-client', function(options, callback) {
        return callback(null, {statusCode: statusCode}, {});
      });

      getController().updateContact(req, {
        json: function() {
          expect(called).to.be.true;
          done();
        }
      });
    });

    it('should publish a "contacts:contact:add" event if request is a creation', function(done) {
      var statusCode = 200;
      req.body = {foo: 'bar'};
      req.headers = {
      };
      var called = false;

      dependencies.pubsub.local.topic = function(name) {
        expect(name).to.equal('contacts:contact:add');
        return {
          publish: function(data) {
            called = true;
            expect(data).to.deep.equal({
              contactId: req.params.contactId,
              bookId: req.params.bookId,
              vcard: req.body
            });
          }
        };
      };

      mockery.registerMock('../proxy/http-client', function(options, callback) {
        return callback(null, {statusCode: statusCode}, {});
      });

      getController().updateContact(req, {
        json: function() {
          expect(called).to.be.true;
          done();
        }
      });
    });
  });

  describe('The deleteContact function', function() {

    var req;
    beforeEach(function() {
      req = {
        token: {
          token: 123
        },
        davserver: 'http://dav:8080',
        url: '/foo/bar',
        params: {
          bookId: 'book123',
          cardId: 'card123'
        }
      };
    });

    it('should call the proxy module', function(done) {
      mockery.registerMock('../proxy', function() {
        return function() {
          return {
            handle: function(options) {
              expect(options.onSuccess).to.be.a.function;
              expect(options.onError).to.be.a.function;
              return function() {
                done();
              };
            }
          };
        };
      });
      getController().deleteContact();
    });

    it('should publish a "contacts:contact:delete" event if request is a delete and is successful', function(done) {
      var called = false;
      dependencies.pubsub.local.topic = function(name) {
        expect(name).to.equal('contacts:contact:delete');
        return {
          publish: function(data) {
            called = true;
            expect(data).to.deep.equal({
              contactId: req.params.contactId,
              bookId: req.params.bookId
            });
            expect(data.vcard).to.not.exist;
          }
        };
      };

      mockery.registerMock('../proxy', function() {
        return function() {
          return {
            handle: function(options) {
              return function(req, res) {
                options.onSuccess({}, {}, req, res, function() {
                  done();
                });
              };
            }
          };
        };
      });
      getController().deleteContact(req);

    });
  });

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

  describe('The searchContacts function', function() {
    it('should call contact.searchContacts', function(done) {
      var search = 'Bruce';
      var user = {_id: 123};

      dependencies.contact = {
        lib: {
          search: {
            searchContacts: function(options) {
              expect(options).to.deep.equal({search: search, user: user._id});
              done();
            }
          }
        }
      };

      var controller = getController();
      controller.searchContacts({query: {search: search}, user: user});
    });

    it('should send back HTTP 500 when contact.searchContacts fails', function(done) {
      var search = 'Bruce';
      var user = {_id: 123};

      dependencies.contact = {
        lib: {
          search: {
            searchContacts: function(options, callback) {
              return callback(new Error());
            }
          }
        }
      };

      var controller = getController();
      controller.searchContacts({query: {search: search}, user: user}, {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      });
    });

    it('should send back HTTP 200 when contact.searchContacts returns empty object', function(done) {
      var search = 'Bruce';
      var user = {_id: 123};

      dependencies.contact = {
        lib: {
          search: {
            searchContacts: function(options, callback) {
              return callback(null, {});
            }
          }
        }
      };

      var controller = getController();
      controller.searchContacts({query: {search: search}, user: user}, {
        header: function(name, value) {
          expect(value).to.equal(0);
        },
        json: function(code, data) {
          expect(code).to.equal(200);
          expect(data._embedded['dav:item']).to.deep.equal([]);
          done();
        }
      });
    });

    it('should send back HTTP 200 when contact.searchContacts returns empty list', function(done) {
      var search = 'Bruce';
      var user = {_id: 123};

      dependencies.contact = {
        lib: {
          search: {
            searchContacts: function(options, callback) {
              return callback(null, {list: []});
            }
          }
        }
      };

      var controller = getController();
      controller.searchContacts({query: {search: search}, user: user}, {
        header: function(name, value) {
          expect(value).to.equal(0);

        },
        json: function(code, data) {
          expect(code).to.equal(200);
          expect(data._embedded['dav:item']).to.deep.equal([]);
          done();
        }
      });
    });

    it('should build the response by calling the dav server for each contact found', function(done) {
      var search = 'Bruce';
      var user = {_id: '123'};
      var bookId = '456';
      var called = 0;
      var cards = [{_id: 'A'}, {_id: 'B'}, {_id: 'C'}];

      dependencies.contact = {
        lib: {
          search: {
            searchContacts: function(options, callback) {
              return callback(null, {list: [{_id: '1'}, {_id: '2'}, {_id: '3'}], total_count: cards.length});
            }
          },
          client: {
            get: function() {
              called++;
              return q(cards[called - 1]);
            }
          }
        }
      };

      var controller = getController();
      controller.searchContacts({params: {bookId: bookId}, query: {search: search}, user: user}, {
        header: function(name, value) {
          expect(value).to.equal(3);
        },
        json: function(code, data) {
          expect(code).to.equal(200);
          expect(data._embedded['dav:item'].length).to.equal(3);
          done();
        }
      });
    });

    it('should not fail when can not get some contact details after successful search', function(done) {
      var search = 'Bruce';
      var user = {_id: '123'};
      var bookId = '456';
      var call = 0;
      var result = [{_id: '1'}, {_id: '2'}, {_id: '3'}];

      dependencies.contact = {
        lib: {
          search: {
            searchContacts: function(options, callback) {
              return callback(null, {list: result, total_count: result.length});
            }
          },
          client: {
            get: function() {
              call++;
              if (call === 3) {
                return q.reject(new Error());
              }

              return q(result[call]);
            }
          }
        }
      };

      var controller = getController();
      controller.searchContacts({params: {bookId: bookId}, query: {search: search}, user: user}, {
        header: function(name, value) {
          expect(value).to.equal(result.length);
        },
        json: function(code, data) {
          expect(code).to.equal(200);
          expect(data._embedded['dav:item'].length).to.equal(2);
          done();
        }
      });
    });
  });
});
