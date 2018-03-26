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
        error: function() {},
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

  function getAvatarUrl(bookId, bookName, cardId) {
    return ['http://localhost:8080/contact/api/contacts', bookId, bookName, cardId, 'avatar'].join('/');
  }

  describe('The getContactsFromDAV function', function() {

    var req;
    beforeEach(function() {
      req = {
        params: {},
        token: {
          token: 123
        },
        davserver: 'http://dav:8080',
        url: '/foo/bar',
        query: { q: 'some query' }
      };
    });

    function createListFnMock(listFn) {
      dependencies.contact.lib.client = function() {
        return {
          addressbookHome: function() {
            return {
              addressbook: function() {
                return {
                  vcard: function() {
                    return {
                      list: listFn
                    };
                  }
                };
              }
            };
          }
        };
      };
    }

    it('should call contact client with right parameters', function(done) {
      req.params.bookHome = 'home';
      req.params.bookName = 'name';
      contactVcardMock = {
        list: function(query) {
          expect(query).to.eql(req.query);
          done();
          return q.resolve();
        }
      };
      dependencies.contact.lib.client = function(options) {
        expect(options).to.deep.equal({
          ESNToken: req.token.token,
          davserver: req.davserver
        });

        return {
          addressbookHome: function(bookHome) {
            expect(bookHome).to.equal(req.params.bookHome);

            return {
              addressbook: function(bookName) {
                expect(bookName).to.equal(req.params.bookName);

                return {
                  vcard: function() {
                    return contactVcardMock;
                  }

                };
              }
            };
          }
        };
      };

      getController().getContactsFromDAV(req);
    });

    it('should send back HTTP 500 if contact client reject promise', function(done) {
      createListFnMock(function() {
        return q.reject();
      });

      getController().getContactsFromDAV(req, {
        status: function(code) {
          expect(code).to.equal(500);
          return {
            json: function(data) {
              expect(data.error.details).to.match(/Error while getting contacts from DAV server/);
              done();
            }
          };
        }
      });
    });

    it('should send back client response status code and body', function(done) {
      var statusCode = 200;
      var body = {foo: 'bar'};

      createListFnMock(function() {
        return q.resolve({
          response: { statusCode: statusCode },
          body: body
        });
      });

      getController().getContactsFromDAV(req, {
        status: function(code) {
          expect(code).to.equal(statusCode);
          return {
            json: function(json) {
              expect(json).to.deep.equal(body);
              done();
            }
          };
        }

      });
    });

    it('should have body with text avatar injected', function(done) {
      var statusCode = 200;
      var bookHome = 'book123';
      var bookName = 'contacts';
      var card1 = 'abc';
      var card2 = 'xyz';

      var vcard1 = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', card1]
        ]
      ];
      var vcard2 = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', card2]
        ]
      ];
      var body = {
        _embedded: {
          'dav:item': [{ data: vcard1 }, { data: vcard2 }]
        }
      };
      req.params.bookHome = bookHome;
      req.params.bookName = bookName;

      createListFnMock(function() {
        return q.resolve({
          response: { statusCode: statusCode },
          body: body
        });
      });

      getController().getContactsFromDAV(req, {
        status: function() {
          return {
            json: function(json) {
              expect(JSON.stringify(json)).to.contains(getAvatarUrl(bookHome, bookName, card1));
              expect(JSON.stringify(json)).to.contains(getAvatarUrl(bookHome, bookName, card2));
              done();
            }
          };
        }
      });
    });

  });

  describe('The getContact function', function() {

    var req;
    beforeEach(function() {
      req = {
        params: {},
        token: {
          token: 123
        },
        davserver: 'http://dav:8080',
        url: '/foo/bar'
      };
    });

    it('should call contact client with right parameters', function(done) {
      req.params.bookHome = 'home';
      req.params.bookName = 'name';
      req.params.contactId = '456';
      contactVcardMock = {
        get: function() {
          done();
          return q.resolve();
        }
      };
      dependencies.contact.lib.client = function(options) {
        expect(options).to.deep.equal({
          ESNToken: req.token.token,
          davserver: req.davserver
        });

        return {
          addressbookHome: function(bookHome) {
            expect(bookHome).to.equal(req.params.bookHome);

            return {
              addressbook: function(bookName) {
                expect(bookName).to.equal(req.params.bookName);

                return {
                  vcard: function(contactId) {
                    expect(contactId).to.equal(req.params.contactId);

                    return contactVcardMock;
                  }
                };
              }
            };
          }
        };
      };

      getController().getContact(req);
    });

    it('should send back HTTP 500 if contact client reject promise', function(done) {
      contactVcardMock = {
        get: function() {
          return q.reject();
        }
      };
      dependencies.contact.lib.client = function() {
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
      };

      getController().getContact(req, {
        status: function(code) {
          expect(code).to.equal(500);
          return {
            json: function(json) {
              expect(json.error.details).to.match(/Error while getting contact from DAV server/);
              done();
            }
          };
        }

      });
    });

    it('should send back client response etag header, status code and body', function(done) {
      var statusCode = 200;
      var etag = '12345';
      var body = {foo: 'bar'};

      contactVcardMock = {
        get: function() {
          return q.resolve({
            response: {statusCode: statusCode, headers: { etag: etag }},
            body: body
          });
        }
      };
      dependencies.contact.lib.client = function() {
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
      };

      getController().getContact(req, {
        set: function(name, value) {
          expect(name).to.equal('ETag');
          expect(value).to.equal(etag);
        },
        status: function(code) {
          expect(code).to.equal(statusCode);
          return {
            json: function(json) {
              expect(json).to.deep.equal(body);
              done();
            }
          };
        }
      });
    });

    it('should have body with text avatar injected', function(done) {
      var statusCode = 200;
      var bookHome = 'bookHome123';
      var bookName = 'bookName123';
      var cardId = 'xyz';

      var body = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', cardId]
        ]
      ];

      req.params.bookHome = bookHome;
      req.params.bookName = bookName;

      contactVcardMock = {
        get: function() {
          return q.resolve({
            response: {statusCode: statusCode, headers: { etag: 'etag' }},
            body: body
          });
        }
      };
      dependencies.contact.lib.client = function() {
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
      };

      getController().getContact(req, {
        set: function() {},
        status: function() {
          return {
            json: function(json) {
              expect(JSON.stringify(json)).to.contains(getAvatarUrl(bookHome, bookName, cardId));
              done();
            }
          };
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
          bookHome: 'bookHome',
          bookName: 'book123',
          cardId: 'card123'
        },
        body: 'body'
      };
    });

    it('should call contact client with right parameters on creation', function(done) {
      contactVcardMock = {
        create: function(contact) {
          expect(contact).to.eql(req.body);
          done();
          return q.resolve();
        }
      };
      dependencies.contact.lib.client = function(options) {
        expect(options).to.deep.equal({
          ESNToken: req.token.token,
          davserver: req.davserver
        });

        return {
          addressbookHome: function(bookHome) {
            expect(bookHome).to.equal(req.params.bookHome);

            return {
              addressbook: function(bookName) {
                expect(bookName).to.equal(req.params.bookName);

                return {
                  vcard: function(contactId) {
                    expect(contactId).to.equal(req.params.contactId);

                    return contactVcardMock;
                  }
                };
              }
            };
          }
        };
      };

      getController().updateContact(req);
    });

    it('should send back HTTP 500 if http client rejects promise on creation', function(done) {
      dependencies.contact.lib.client = function() {
        return {
          addressbookHome: function() {
            return {
              addressbook: function() {
                return {
                  vcard: function() {
                    return {
                      create: function() {
                        return q.reject();
                      }
                    };
                  }
                };
              }
            };
          }
        };
      };

      getController().updateContact(req, {
        status: function(code) {
          expect(code).to.equal(500);
          return {
            json: function(json) {
              expect(json.error.details).to.match(/Error while creating contact on DAV server/);
              done();
            }
          };
        }

      });
    });

    it('should send back client response status code and body on creation', function(done) {
      var statusCode = 200;
      var body = {foo: 'bar'};

      dependencies.contact.lib.client = function() {
        return {
          addressbookHome: function() {
            return {
              addressbook: function() {
                return {
                  vcard: function() {
                    return {
                      create: function() {
                        return q.resolve({
                          response: {statusCode: statusCode},
                          body: body
                        });
                      }
                    };
                  }
                };
              }
            };
          }
        };
      };
      getController().updateContact(req, {
        status: function(code) {
          expect(code).to.equal(statusCode);
          return {
            json: function(json) {
              expect(json).to.deep.equal(body);
              done();
            }
          };
        }
      });
    });

    it('should not remove if-match header when updating contact', function(done) {
      req.headers = {
        'if-match': 123
      };
      req.user = { _id: '111' };
      req.body = { fn: 'abc' };
      req.params.contactId = req.params.cardId;

      mockery.registerMock('../proxy', function() {
        return function() {
          return {
            handle: function(options) {
              options.onSuccess(null, null, req, null, function() {
                expect(req.headers['if-match']).to.equal(123);
                done();
              });
              return function() {};
            }
          };
        };
      });

      getController().updateContact(req, {
        json: function() {}
      });
    });

    it('should remove text avatar url from req.body before sending request to DAV', function(done) {
      var avatarUrl = 'http://localhost:8080/contact/api/contacts/123/xyz/avatar';
      req.body = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', 'xyz'],
          ['photo', {}, 'uri', avatarUrl]
        ]
      ];

      mockery.registerMock('../proxy/http-client', function() {
      });

      dependencies.contact.lib.client = function() {
        return {
          addressbookHome: function() {
            return {
              addressbook: function() {
                return {
                  vcard: function() {
                    return {
                      create: function(contact) {
                        expect(JSON.stringify(contact)).to.not.contains(avatarUrl);
                        done();
                        return q.resolve();
                      }
                    };
                  }
                };
              }
            };
          }
        };
      };

      getController().updateContact(req);
    });

  });

  describe('The deleteContact function', function() {
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

    var BOOK_NAME = 'bookName456';
    var BOOK_HOME = 'bookHome123';

    function createSearchFnMock(searchBookHomeFn, searchBookFn) {
      dependencies.contact = {
        lib: {
          client: function() {
            return {
              addressbookHome: function(bookHome) {
                expect(bookHome).to.equal(BOOK_HOME);
                return {
                  addressbook: function(bookName) {
                    expect(bookName).to.equal(BOOK_NAME);
                    return {
                      vcard: function() {
                        return {
                          search: searchBookFn
                        };
                      }
                    };
                  },
                  search: searchBookHomeFn
                };
              }
            };
          }
        }
      };
    }

    describe('The search resource select', function() {

      var search = 'Bruce';
      var user = { id: BOOK_HOME };
      var page = 1;
      var limit = 20;

      var called = function(done) {
        return function(options) {
          expect(options).to.deep.equal({
            search: search,
            userId: user.id,
            page: page,
            limit: limit,
            bookNames: [BOOK_NAME]
          });
          return {
            then: function() {
              done();
            }
          };
        };
      };

      var testSearch = function(params, query) {
        getController().searchContacts({
          query: query,
          user: user,
          params: params
        });
      };

      it('should search on bookName if bookName is specified in request param', function(done) {
        createSearchFnMock(called(done));
        testSearch({ bookHome: BOOK_HOME, bookName: BOOK_NAME }, {
          search: search,
          page: page,
          limit: limit
        });
      });

      it('should search on available bookNames in bookHome if bookNames are specified in request query', function(done) {
        createSearchFnMock(called(done));
        testSearch({ bookHome: BOOK_HOME }, {
          search: search,
          page: page,
          limit: limit,
          bookNames: [BOOK_NAME]
        });
      });
    });

    it('should call contact client with the right parameters', function(done) {
      var search = 'Bruce';
      var user = { id: BOOK_HOME };
      var page = 1;
      var limit = 20;

      createSearchFnMock(function(options) {
        expect(options).to.deep.equal({
          search: search,
          userId: user.id,
          page: page,
          limit: limit,
          bookNames: [BOOK_NAME]
        });
        done();
        return q.reject();
      });

      var controller = getController();
      controller.searchContacts({
        query: {
          search: search,
          page: page,
          limit: limit
        },
        user: user,
        params: { bookHome: BOOK_HOME, bookName: BOOK_NAME }
      });
    });

    it('should send back HTTP 500 when contact client search rejects', function(done) {
      var search = 'Bruce';
      var user = { id: BOOK_HOME };

      createSearchFnMock(function() {
        return q.reject();
      });

      var controller = getController();
      controller.searchContacts({
        query: { search: search },
        user: user,
        params: { bookHome: BOOK_HOME, bookName: BOOK_NAME }
      }, {
        status: function(code) {
          expect(code).to.equal(500);
          done();
        }
      });
    });

    it('should have header with total count on success', function(done) {
      var search = 'Bruce';
      var user = { id: BOOK_HOME };

      createSearchFnMock(function() {
        return q.resolve({
          total_count: 999,
          results: []
        });
      });

      var controller = getController();
      controller.searchContacts({
        query: { search: search },
        user: user,
        params: { bookHome: BOOK_HOME, bookName: BOOK_NAME }
      }, {
        header: function(key, value) {
          expect(key).to.equal('X-ESN-Items-Count');
          expect(value).to.equal(999);
          done();
        }
      });
    });

    it('should send back HTTP 200 JSON response when contact client resolves', function(done) {
      var search = 'Bruce';
      var user = { id: BOOK_HOME };

      createSearchFnMock(function() {
        return q.resolve({
          results: []
        });
      });

      var controller = getController();
      controller.searchContacts({
        query: {search: search},
        user: user,
        params: { bookHome: BOOK_HOME, bookName: BOOK_NAME }
      }, {
        header: function() {},
        status: function(code) {
          expect(code).to.equal(200);
          return {
            json: function() {
              done();
            }
          };
        }
      });
    });

    it('should send the total numbers of hits in the response', function(done) {
      var search = 'Bruce';
      var user = { id: BOOK_HOME };

      createSearchFnMock(function() {
        return q.resolve({
          total_count: 999,
          results: []
        });
      });

      var controller = getController();
      controller.searchContacts({
        params: { bookHome: BOOK_HOME, bookName: BOOK_NAME },
        query: {search: search},
        user: user
      }, {
        header: function() {},
        status: function() {
          return {
            json: function(data) {
              expect(data._total_hits).to.equal(999);
              done();
            }
          };
        }
      });
    });

    it('should send the current page in the response', function(done) {
      var search = 'Bruce';
      var user = { id: BOOK_HOME };

      createSearchFnMock(function() {
        return q.resolve({
          current_page: 555,
          results: []
        });
      });

      var controller = getController();
      controller.searchContacts({
        params: { bookHome: BOOK_HOME, bookName: BOOK_NAME },
        query: {search: search},
        user: user
      }, {
        header: function() {},
        status: function() {
          return {
            json: function(data) {
              expect(data._current_page).to.equal(555);
              done();
            }
          };
        }
      });
    });

    it('should send the response page in the correct order', function(done) {
      var search = 'Bruce';
      var user = { id: BOOK_HOME };
      var limit = 2;
      var page = 3;
      var bookId = BOOK_HOME;
      var bookName = BOOK_NAME;

      var successContact1 = { contactId: 1, bookId: bookId, bookName: bookName, response: { statusCode: 200 }, body: 'success1' };
      var notFoundContact = { contactId: 2, bookId: bookId, bookName: bookName, response: { statusCode: 404 }, body: 'not found' };
      var notIncludedFoundContact = { contactId: 3, bookId: bookId, bookName: bookName, response: { statusCode: 199 }, body: 'not included' };
      var errorContact = { contactId: 4, bookId: bookId, bookName: bookName, err: 'some error' };
      var successContact2 = { contactId: 5, bookId: bookId, bookName: bookName, response: { statusCode: 200 }, body: 'success2' };

      createSearchFnMock(function() {
        return q.resolve({
          total_count: 999,
          current_page: 555,
          results: [successContact1, notFoundContact, notIncludedFoundContact, errorContact, successContact2]
        });
      });

      mockery.registerMock('./avatarHelper', function() {
        return {
          injectTextAvatar: function(user, _bookId, _bookName, _vcard) {
            expect(_bookId).to.equal(bookId);
            expect(_bookName).to.equal(bookName);
            var deferred = q.defer();
            if (_vcard === 'success1') {
              setTimeout(function() {
                deferred.resolve(_vcard);
              }, 1);
            } else {
              deferred.resolve(_vcard);
            }
            return deferred.promise;
          }
        };
      });

      var controller = getController();
      var req = {
        params: { bookHome: bookId, bookName: bookName },
        query: {
          search: search,
          page: page,
          limit: limit
        },
        user: user,
        originalUrl: 'http://abc.com',
        davserver: 'http://davserver.com'
      };
      controller.searchContacts(req, {
        header: function() {},
        status: function() {
          return {
            json: function(data) {
              expect(data).to.eql({
                _links: {
                  self: {
                    href: req.originalUrl
                  }
                },
                _total_hits: 999,
                _current_page: 555,
                _embedded: {
                  'dav:item': [{
                    _links: {
                      self: {
                        href: [req.davserver, 'addressbooks', bookId, bookName, successContact1.contactId + '.vcf'].join('/')
                      }
                    },
                    data: successContact1.body
                  }, {
                    _links: {
                      self: {
                        href: [req.davserver, 'addressbooks', bookId, bookName, successContact2.contactId + '.vcf'].join('/')
                      }
                    },
                    data: successContact2.body
                  }]
                }
              });
              done();
            }
          };
        }
      });
    });
  });

  describe('The getAddressbooks fn', function() {

    var BOOK_HOME = 'book12345';

    function createContactClientMock(listFn, searchFn) {
      dependencies.contact = {
        lib: {
          client: function() {
            return {
              addressbookHome: function(bookHome) {
                expect(bookHome).to.equal(BOOK_HOME);
                return {
                  addressbook: function() {
                    return {
                      list: listFn
                    };
                  },
                  search: searchFn
                };
              }
            };
          }
        }
      };
    }

    it('should return 200 response on success', function(done) {
      var data = {
        response: 'response',
        body: 'body'
      };
      createContactClientMock(function() {
        return q.resolve(data);
      });
      var controller = getController();
      var req = {
        params: { bookHome: BOOK_HOME },
        originalUrl: 'http://abc.com',
        davserver: 'http://davserver.com',
        query: {}
      };
      controller.getAddressbooks(req, {
        status: function(code) {
          expect(code).to.equal(200);
          return {
            json: function(body) {
              expect(body).to.eql(data.body);
              done();
            }
          };
        }
      });
    });

    it('should return 500 response on error', function(done) {
      createContactClientMock(function() {
        return q.reject();
      });
      var controller = getController();
      var req = {
        params: { bookHome: BOOK_HOME },
        originalUrl: 'http://abc.com',
        davserver: 'http://davserver.com',
        query: {}
      };
      controller.getAddressbooks(req, {
        status: function(code) {
          expect(code).to.equal(500);
          return {
            json: function(json) {
              expect(json).to.eql({
                error: {
                  code: 500,
                  message: 'Server Error',
                  details: 'Error while getting addressbook list'
                }
              });
              done();
            }
          };
        }
      });
    });

    it('should search in addressbooks when req.query.search is defined', function(done) {
      createContactClientMock(null, function() {
        return {
          then: function() {
            done();
          }
        };
      });

      var controller = getController();
      var req = {
        user: { id: BOOK_HOME },
        params: {bookHome: BOOK_HOME},
        query: {
          search: 'me'
        }
      };
      controller.getAddressbooks(req);
    });
  });

  describe('The getAddressbook fn', function() {

    var BOOK_HOME = 'book12345';
    var BOOK_NAME = 'bookName';

    function createGetFnMock(getFn) {
      dependencies.contact = {
        lib: {
          client: function() {
            return {
              addressbookHome: function(bookHome) {
                expect(bookHome).to.equal(BOOK_HOME);
                return {
                  addressbook: function(bookName) {
                    expect(bookName).to.equal(BOOK_NAME);
                    return {
                      get: getFn
                    };
                  }
                };
              }
            };
          }
        }
      };
    }

    it('should return 200 response on success', function(done) {
      var data = {
        response: 'response',
        body: 'body'
      };
      createGetFnMock(function() {
        return q.resolve(data);
      });
      var controller = getController();
      var req = {
        params: { bookHome: BOOK_HOME, bookName: BOOK_NAME },
        originalUrl: 'http://abc.com',
        davserver: 'http://davserver.com'
      };
      controller.getAddressbook(req, {
        status: function(code) {
          expect(code).to.equal(200);
          return {
            json: function(body) {
              expect(body).to.eql(data.body);
              done();
            }
          };
        }
      });
    });

    it('should return 500 response on errror', function(done) {
      createGetFnMock(function() {
        return q.reject();
      });
      var controller = getController();
      var req = {
        params: { bookHome: BOOK_HOME, bookName: BOOK_NAME },
        originalUrl: 'http://abc.com',
        davserver: 'http://davserver.com'
      };
      controller.getAddressbook(req, {
        status: function(code) {
          expect(code).to.equal(500);
          return {
            json: function(json) {
              expect(json).to.eql({
                error: {
                  code: 500,
                  message: 'Server Error',
                  details: 'Error while getting an addressbook'
                }
              });
              done();
            }
          };
        }
      });
    });

  });

  describe('The moveContact function', function() {
    let req;

    beforeEach(function() {
      req = {
        token: {
          token: 123
        },
        davserver: 'http://dav:8080',
        url: '/foo/bar',
        params: {
          bookHome: 'bookHome',
          bookName: 'book123',
          cardId: 'card123'
        },
        query: {}
      };
    });

    it('should forward a "contacts:contact:update" event if success to move contact', function(done) {
      const statusCode = 201;
      const addressbookTarget = 'addressbook-target';

      req.user = { _id: 1 };
      req.headers = { destination: addressbookTarget };

      const moveFn = sinon.stub().returns(q({
        response: { statusCode }
      }));

      dependencies.contact.lib.client = () => ({
        addressbookHome: () => ({
          addressbook: () => ({
            vcard: () => ({ move: moveFn })
          })
        })
      });

      const res = {
        status(code) {
          return {
            json() {
              expect(moveFn).to.have.been.calledWith(addressbookTarget);
              expect(code).to.equal(statusCode);
              done();
            }
          };
        }
      };

      getController().moveContact(req, res);
    });
  });
});
