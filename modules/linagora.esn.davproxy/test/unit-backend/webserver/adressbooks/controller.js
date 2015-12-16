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
      pubsub: {
        local: {
          topic: function() {
            return {
              publish: function() {}
            };
          }
        }
      },
      config: function() {
        return {};
      },
      contact: {
        lib: {
          client: function() {
            return {
              addressbookHome: function() {
                return {
                  addressbook: function() {
                    return {
                      vcard: function() {
                        return {
                          get: function() {
                          },
                          create: function() {
                          },
                          update: function() {
                          },
                          del: function() {
                          }
                        };
                      },
                      list: function() {
                      }
                    };
                  }
                };
              }
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

  function avatarHelper() {
    return require('../../../../backend/webserver/addressbooks/avatarHelper')(deps);
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

    it('should call contact client with right parameters', function(done) {
      req.params.bookHome = 'home';
      req.params.bookName = 'name';
      dependencies.contact.lib.client = function(options) {
        expect(options.ESNToken).to.equal(req.token.token);
        return {
          addressbookHome: function(bookHome) {
            expect(bookHome).to.equal(req.params.bookHome);
            return {
              addressbook: function(bookName) {
                expect(bookName).to.equal(req.params.bookName);
                return {
                  vcard: function() {
                  },
                  list: function(query) {
                    expect(query).to.eql(req.query);
                    done();
                    return q.resolve();
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
      dependencies.contact.lib.client = function() {
        return {
          addressbookHome: function() {
            return {
              addressbook: function() {
                return {
                  list: function() {
                    return q.reject();
                  }
                };
              }
            };
          }
        };
      };

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

      dependencies.contact.lib.client = function() {
        return {
          addressbookHome: function() {
            return {
              addressbook: function() {
                return {
                  list: function() {
                    return q.resolve({
                      response: { statusCode: statusCode },
                      body: body
                    });
                  }
                };
              }
            };
          }
        };
      };

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

      var vcard1 = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', 'abc']
        ]
      ];
      var vcard2 = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', 'xyz']
        ]
      ];
      var body = {
        _embedded: {
          'dav:item': [{ data: vcard1 }, { data: vcard2 }]
        }
      };
      req.params.bookHome = bookHome;
      var avatarUrl1 = 'http://localhost:8080/contact/api/contacts/' + bookHome + '/abc/avatar';
      var avatarUrl2 = 'http://localhost:8080/contact/api/contacts/' + bookHome + '/xyz/avatar';

      dependencies.contact.lib.client = function() {
        return {
          addressbookHome: function() {
            return {
              addressbook: function() {
                return {
                  list: function() {
                    return q.resolve({
                      response: { statusCode: statusCode },
                      body: body
                    });
                  }
                };
              }
            };
          }
        };
      };

      getController().getContactsFromDAV(req, {
        status: function() {
          return {
            json: function(json) {
              expect(JSON.stringify(json)).to.contains(avatarUrl1);
              expect(JSON.stringify(json)).to.contains(avatarUrl2);
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
      dependencies.contact.lib.client = function(options) {
        expect(options.ESNToken).to.equal(req.token.token);
        return {
          addressbookHome: function(bookHome) {
            expect(bookHome).to.equal(req.params.bookHome);
            return {
              addressbook: function(bookName) {
                expect(bookName).to.equal(req.params.bookName);
                return {
                  vcard: function(contactId) {
                    expect(contactId).to.equal(req.params.contactId);
                    return {
                      get: function() {
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

      getController().getContact(req);
    });

    it('should send back HTTP 500 if contact client reject promise', function(done) {
      dependencies.contact.lib.client = function() {
        return {
          addressbookHome: function() {
            return {
              addressbook: function() {
                return {
                  vcard: function() {
                    return {
                      get: function() {
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

    it('should send back client response status code and body', function(done) {
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
                      get: function() {
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

      getController().getContact(req, {
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
      var body = ['vcard', [
          ['version', {}, 'text', '4.0'],
          ['uid', {}, 'text', 'xyz']
        ]
      ];

      req.params.bookHome = bookHome;
      var avatarUrl = 'http://localhost:8080/contact/api/contacts/' + bookHome + '/xyz/avatar';

      dependencies.contact.lib.client = function() {
        return {
          addressbookHome: function() {
            return {
              addressbook: function() {
                return {
                  vcard: function() {
                    return {
                      get: function() {
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

      getController().getContact(req, {
        status: function() {
          return {
            json: function(json) {
              expect(JSON.stringify(json)).to.contains(avatarUrl);
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
      dependencies.contact.lib.client = function(options) {
        expect(options.ESNToken).to.equal(req.token.token);
        return {
          addressbookHome: function(bookHome) {
            expect(bookHome).to.equal(req.params.bookHome);
            return {
              addressbook: function(bookName) {
                expect(bookName).to.equal(req.params.bookName);
                return {
                  vcard: function(contactId) {
                    expect(contactId).to.equal(req.params.contactId);
                    return {
                      create: function(contact) {
                        expect(contact).to.eql(req.body);
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

    it('should publish a "contacts:contact:update" event with new contact if request is an update', function(done) {
      req.headers = {
        'if-match': 123
      };
      req.user = { _id: '111' };
      req.body = { fn: 'abc' };
      req.params.contactId = req.params.cardId;

      dependencies.pubsub.local.topic = function(name) {
        expect(name).to.equal('contacts:contact:update');
        return {
          publish: function(data) {
            expect(data).to.eql({
              contactId: req.params.cardId,
              bookId: req.params.bookHome,
              vcard: req.body,
              user: req.user
            });
            done();
          }
        };
      };

      mockery.registerMock('../proxy', function() {
        return function() {
          return {
            handle: function(options) {
              expect(options.onSuccess).to.be.a.function;
              expect(options.onError).to.be.a.function;
              expect(options.json).to.be.true;
              options.onSuccess(null, null, req, null, function() {});
              return function() {};
            }
          };
        };
      });

      getController().updateContact(req, {
        json: function() {}
      });
    });

    it('should publish a "contacts:contact:add" event if request is a creation', function(done) {
      var statusCode = 200;
      req.user = {_id: 1};
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
              bookId: req.params.bookName,
              vcard: req.body,
              user: req.user
            });
          }
        };
      };

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
                          body: req.body
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
        status: function() {
          return {
            json: function() {
              avatarHelper().injectTextAvatar(123, req.body).then(function(output) {
                expect(called).to.be.true;
                done();
              });
            }
          };
        }

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

      mockery.registerMock('../proxy/http-client', function(options, callback) {

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

    var req;
    beforeEach(function() {
      req = {
        token: {
          token: 123
        },
        davserver: 'http://dav:8080',
        url: '/foo/bar',
        params: {
          bookName: 'bookName',
          bookHome: 'bookHome',
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
              bookId: req.params.bookHome
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

    var BOOK_NAME = 'bookName456';
    var BOOK_HOME = 'bookHome123';

    function createContactClientMock(searchFn) {
      return function() {
        return {
          addressbookHome: function(bookHome) {
            expect(bookHome).to.equal(BOOK_HOME);
            return {
              addressbook: function(bookName) {
                expect(bookName).to.equal(BOOK_NAME);
                return {
                  search: searchFn
                };
              }
            };
          }
        };
      };
    }

    it('should call contact client with the right parameters', function(done) {
      var search = 'Bruce';
      var user = {_id: 123};
      var page = 1;
      var limit = 20;

      dependencies.contact = {
        lib: {
          client: createContactClientMock(function(options) {
            expect(options).to.deep.equal({
              search: search,
              userId: user._id,
              page: page,
              limit: limit
            });
            done();
            return q.reject();
          })
        }
      };

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
      var user = {_id: 123};

      dependencies.contact = {
        lib: {
          client: createContactClientMock(function() {
            return q.reject();
          })
        }
      };

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
      var user = {_id: 123};

      dependencies.contact = {
        lib: {
          client: createContactClientMock(function() {
            return q.resolve({
              total_count: 999,
              results: []
            });
          })
        }
      };

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
      var user = {_id: 123};

      dependencies.contact = {
        lib: {
          client: createContactClientMock(function() {
            return q.resolve({
              results: []
            });
          })
        }
      };

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
      var user = {_id: '123'};

      dependencies.contact = {
        lib: {
          client: createContactClientMock(function() {
            return q.resolve({
              total_count: 999,
              results: []
            });
          })
        }
      };

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
      var user = {_id: '123'};

      dependencies.contact = {
        lib: {
          client: createContactClientMock(function() {
            return q.resolve({
              current_page: 555,
              results: []
            });
          })
        }
      };

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
      var user = {_id: '123'};
      var limit = 2;
      var page = 3;

      var successContact1 = { contactId: 1, response: { statusCode: 200 }, body: 'success1' };
      var notFoundContact = { contactId: 2, response: { statusCode: 404 }, body: 'not found' };
      var notIncludedFoundContact = { contactId: 3, response: { statusCode: 199 }, body: 'not included' };
      var errorContact = { contactId: 4, err: 'some error' };
      var successContact2 = { contactId: 5, response: { statusCode: 200 }, body: 'success2' };

      dependencies.contact = {
        lib: {
          client: createContactClientMock(function() {
            return q.resolve({
              total_count: 999,
              current_page: 555,
              results: [successContact1, notFoundContact, notIncludedFoundContact, errorContact, successContact2]
            });
          })
        }
      };

      mockery.registerMock('./avatarHelper', function() {
        return {
          injectTextAvatar: function(bookId, vcard) {
            var deferred = q.defer();
            if (vcard === 'success1') {
              setTimeout(function() {
                deferred.resolve(vcard);
              }, 1);
            } else {
              deferred.resolve(vcard);
            }
            return deferred.promise;
          }
        };
      });

      var controller = getController();
      var req = {
        params: { bookHome: BOOK_HOME, bookName: BOOK_NAME },
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
                      self: [req.davserver, 'addressbooks', BOOK_HOME, BOOK_NAME, successContact1.contactId + '.vcf'].join('/')
                    },
                    data: successContact1.body
                  }, {
                    _links: {
                      self: [req.davserver, 'addressbooks', BOOK_HOME, BOOK_NAME, successContact2.contactId + '.vcf'].join('/')
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
});
