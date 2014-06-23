'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('the contacts controller', function() {
  describe('getContacts() method', function() {
    it('should return a 412 error if query.owner is not set', function() {
      mockery.registerMock('mongoose', {model: function() {}});
      var req = { query: {} };
      var res = {json: function(code, data) {
        expect(code).to.equal(412);
        expect(data.error.status).to.equal(412);
        expect(data.error.message).to.equal('parameter missing');
      }};
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      controller.getContacts(req, res);
    });
    it('should use mongoose.Types.ObjectId to check if query.owner is a valid mongodb ObjectID', function(done) {
      mockery.registerMock('mongoose', {
        model: function() {},
        Types: {
          ObjectId: function(id) {
            done();
            throw new Error('invalid object Id');
          }
        }
      });
      var req = { query: {owner: '123'} };
      var res = {json: function(code, data) {
      }};
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      controller.getContacts(req, res);
    });
    it('should return 412 if query.owner is not a valid mongodb ObjectID', function(done) {
      mockery.registerMock('mongoose', {
        model: function() {},
        Types: {
          ObjectId: function(id) {
            throw new Error('invalid object Id');
          }
        }
      });
      var req = { query: {owner: '123'} };
      var res = {json: function(code, data) {
        expect(code).to.equal(412);
        expect(data.error.status).to.equal(412);
        expect(data.error.message).to.equal('Invalid parameter');
        done();
      }};
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      controller.getContacts(req, res);
    });
    it('should use mongoose.Types.ObjectId to check if query.addressbooks is a valid mongodb ObjectID', function(done) {
      mockery.registerMock('mongoose', {
        model: function() {},
        Types: {
          ObjectId: function(id) {
            if (id === 'addressbook') {
              done();
              throw new Error('invalid object Id');
            }
          }
        }
      });
      var req = { query: {owner: '123'}, param: function() {return 'addressbook';} };
      var res = {json: function(code, data) {
      }};
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      controller.getContacts(req, res);
    });
    it('should use mongoose.Types.ObjectId to check if query.addressbooks, as array, is a valid mongodb ObjectID', function(done) {
      var counter = 0;
      var regexp = /addressbook/;
      mockery.registerMock('mongoose', {
        model: function() {},
        Types: {
          ObjectId: function(id) {
            if (regexp.test(id)) {
              counter++;
            }
            if (counter === 3) {
              done();
              throw new Error('invalid object Id');
            }
            return true;
          }
        }
      });
      var req = {
        query: {owner: '123'},
        param: function(id) {
          if (id === 'addressbooks') {
            return ['addressbook1', 'addressbook2', 'addressbook3'];
          }
        }
      };
      var res = {json: function(code, data) {
      }};
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      controller.getContacts(req, res);
    });
    it('should respond with 400 if addressbooks is not a valid mongodb ObjectID', function(done) {
      var regexp = /addressbook/;
      mockery.registerMock('mongoose', {
        model: function() {},
        Types: {
          ObjectId: function(id) {
            if (regexp.test(id)) {
              throw new Error('invalid object Id');
            }
            return true;
          }
        }
      });
      var req = {
        query: {owner: '123'},
        param: function(id) {
          if (id === 'addressbooks') {
            return ['addressbook1', 'addressbook2', 'addressbook3'];
          }
        }
      };
      var res = {json: function(code, data) {
        expect(code).to.equal(400);
        expect(data.error.status).to.equal(400);
        expect(data.error.message).to.equal('Server error');
        done();
      }};
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      controller.getContacts(req, res);
    });
    it('should call the google contact module list function with a query object', function(done) {
      mockery.registerMock('mongoose', {
        model: function() {},
        Types: {
          ObjectId: function(id) {
            return true;
          }
        }
      });
      var req = {
        query: {owner: '123'},
        param: function(id) {
          if (id === 'search') {
            return 'search string';
          } else if (id === 'limit') {
            return '14';
          } else if (id === 'offset') {
            return '42';
          } else if (id === 'addressbooks') {
            return 'addressbook1';
          }
        }
      };
      mockery.registerMock('../../core', {
        contact: {
          list: function(query) {
            expect(query.owner).to.equal('123');
            expect(query.query).to.equal('search string');
            expect(query.limit).to.equal(14);
            expect(query.offset).to.equal(42);
            expect(query.addressbooks).to.equal('addressbook1');
            done();
          }
        }
      });
      var res = {json: function(code, data) {
      }};
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      controller.getContacts(req, res);
    });

    it('should ignore offset & limit parameters that are not strings', function(done) {
      mockery.registerMock('mongoose', {
        model: function() {},
        Types: {
          ObjectId: function(id) {
            return true;
          }
        }
      });
      var req = {
        query: {owner: '123'},
        param: function(id) {
          if (id === 'limit') {
            return 'notastring';
          } else if (id === 'offset') {
            return 'stillnotastring';
          }
        }
      };
      mockery.registerMock('../../core', {
        contact: {
          list: function(query) {
            expect(query).to.not.have.property('limit');
            expect(query).to.not.have.property('offset');
            done();
          }
        }
      });
      var res = {json: function(code, data) {
      }};
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      controller.getContacts(req, res);
    });

    describe('contact module callback', function() {
      it('should return 500 if there is an error argument', function(done) {
        mockery.registerMock('mongoose', {
          model: function() {},
          Types: {
            ObjectId: function(id) {
              return true;
            }
          }
        });
        var req = {
          query: {owner: '123'},
          param: function(id) {
            if (id === 'limit') {
              return 'notastring';
            } else if (id === 'offset') {
              return 'stillnotastring';
            }
          }
        };
        mockery.registerMock('../../core', {
          contact: {
            list: function(query, callback) {
              callback(new Error('it failed'));
            }
          }
        });
        var res = {json: function(code, data) {
          expect(code).to.equal(500);
          expect(data.error.status).to.equal(500);
          expect(data.error.message).to.equal('Contacts list failed');
          done();
        }};
        var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
        controller.getContacts(req, res);
      });
      it('should return the total count in headers', function(done) {
        mockery.registerMock('mongoose', {
          model: function() {},
          Types: {
            ObjectId: function(id) {
              return true;
            }
          }
        });
        var req = {
          query: {owner: '123'},
          param: function(id) {
            if (id === 'limit') {
              return 'notastring';
            } else if (id === 'offset') {
              return 'stillnotastring';
            }
          }
        };
        mockery.registerMock('../../core', {
          contact: {
            list: function(query, callback) {
              callback(null, {count: 44, items: [1, 2, 3]});
            }
          }
        });
        var res = {
          json: function(code, data) {
          },
          header: function(name, value) {
            expect(name).to.equal('X-ESN-Items-Count');
            expect(value).to.equal(44);
            done();
          }
        };
        var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
        controller.getContacts(req, res);
      });
      it('should return the items in body', function(done) {
        mockery.registerMock('mongoose', {
          model: function() {},
          Types: {
            ObjectId: function(id) {
              return true;
            }
          }
        });
        var req = {
          query: {owner: '123'},
          param: function(id) {
            if (id === 'limit') {
              return 'notastring';
            } else if (id === 'offset') {
              return 'stillnotastring';
            }
          }
        };
        mockery.registerMock('../../core', {
          contact: {
            list: function(query, callback) {
              callback(null, {count: 44, items: [1, 2, 3]});
            }
          }
        });
        var res = {
          json: function(code, data) {
            expect(code).to.equal(200);
            expect(data).to.deep.equal([1, 2, 3]);
            done();
          },
          header: function(name, value) {
          }
        };
        var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
        controller.getContacts(req, res);
      });
    });
  });

  describe('sendInvitation method', function() {
    it('should return HTTP 400 if domain_id is not set', function(done) {
      var mongooseMock = {
        model: function() {
          return {};
        }
      };
      mockery.registerMock('mongoose', mongooseMock);

      var contacts = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      var req = {
        body: {}
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      contacts.sendInvitation(req, res);
    });

    it('should return HTTP 400 if req.contact is not set', function(done) {
      var mongooseMock = {
        model: function() {
          return {};
        }
      };
      mockery.registerMock('mongoose', mongooseMock);

      var contacts = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      var req = {
        body: {
          domain: 123
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      contacts.sendInvitation(req, res);
    });

    it('should return HTTP 400 if req.contact.emails is not set', function(done) {
      var mongooseMock = {
        model: function() {
          return {};
        }
      };
      mockery.registerMock('mongoose', mongooseMock);

      var contacts = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      var req = {
        body: {
          domain: 123
        },
        contact: {}
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      contacts.sendInvitation(req, res);
    });

    it('should return HTTP 400 if req.contact.emails is empty', function(done) {
      var mongooseMock = {
        model: function() {
          return {};
        }
      };
      mockery.registerMock('mongoose', mongooseMock);

      var contacts = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      var req = {
        body: {
          domain: 123
        },
        contact: {
          emails: []
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      contacts.sendInvitation(req, res);
    });
  });

  describe('getContactInvitations method', function() {
    it('should return HTTP 400 if contact is not set', function(done) {
      var mongooseMock = {
        model: function() {
          return {
            find: function(query, callback) {
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongooseMock);

      var contacts = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      var req = {
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      contacts.getContactInvitations(req, res);
    });

    it('should return HTTP 500 if Invitation.find send back error', function(done) {
      var mongooseMock = {
        model: function() {
          return {
            find: function(query, callback) {
              return callback(new Error());
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongooseMock);

      var contacts = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      var req = {
        contact: {
          _id: 123
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };
      contacts.getContactInvitations(req, res);
    });

    it('should return HTTP 200 if Invitation.find does not send back invitations', function(done) {
      var mongooseMock = {
        model: function() {
          return {
            find: function(query, callback) {
              return callback();
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongooseMock);

      var contacts = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      var req = {
        contact: {
          _id: 123
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(200);
          done();
        }
      };
      contacts.getContactInvitations(req, res);
    });

    it('should return HTTP 200 if Invitation.find does send back invitations', function(done) {
      var mongooseMock = {
        model: function() {
          return {
            find: function(query, callback) {
              return callback(null, []);
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongooseMock);

      var contacts = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      var req = {
        contact: {
          _id: 123
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(200);
          done();
        }
      };
      contacts.getContactInvitations(req, res);
    });
  });

  describe('getInvitations method', function() {
    it('should return HTTP 400 if req.query is not set', function(done) {
      var mongooseMock = {
        model: function() {
          return {
            find: function(query, callback) {
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongooseMock);

      var contacts = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      var req = {
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      contacts.getInvitations(req, res);
    });

    it('should return HTTP 400 if req.query.ids is not set', function(done) {
      var mongooseMock = {
        model: function() {
          return {
            find: function(query, callback) {
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongooseMock);

      var contacts = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      var req = {
        query: {}
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      contacts.getInvitations(req, res);
    });

    it('should return HTTP 500 if Invitation.find send back error', function(done) {
      var mongooseMock = {
        model: function() {
          return {
            find: function(query) {
              return {
                exec: function(callback) {
                  return callback(new Error());
                }
              };
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongooseMock);

      var contacts = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      var req = {
        query: {
          ids: []
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };
      contacts.getInvitations(req, res);
    });

    it('should return HTTP 200', function(done) {
      var mongooseMock = {
        model: function() {
          return {
            find: function(query) {
              return {
                exec: function(callback) {
                  return callback(null, []);
                }
              };
            }
          };
        }
      };
      mockery.registerMock('mongoose', mongooseMock);

      var contacts = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      var req = {
        query: {
          ids: []
        }
      };
      var res = {
        json: function(code) {
          expect(code).to.equal(200);
          done();
        }
      };
      contacts.getInvitations(req, res);
    });
  });

  describe('load method', function() {
    it('should call next with error when contact.get sends back error', function(done) {
      var mongooseMock = {
        model: function() {}
      };
      mockery.registerMock('mongoose', mongooseMock);

      var core = {
        contact: {
          get: function(id, callback) {
            return callback(new Error());
          }
        }
      };
      mockery.registerMock('../../core', core);

      var contacts = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      var req = {
        params: {
          id: 123
        }
      };
      var res = {
      };
      var next = function(err) {
        expect(err).to.exist;
        done();
      };
      contacts.load(req, res, next);
    });

    it('should return HTTP 404 when contact is not found', function(done) {
      var mongooseMock = {
        model: function() {}
      };
      mockery.registerMock('mongoose', mongooseMock);

      var core = {
        contact: {
          get: function(id, callback) {
            return callback();
          }
        }
      };
      mockery.registerMock('../../core', core);

      var contacts = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      var req = {
        params: {
          id: 123
        }
      };
      var res = {
        send: function(code) {
          expect(code).to.equal(404);
          done();
        }
      };
      var next = function() {};
      contacts.load(req, res, next);
    });

    it('should call next when contact is found', function(done) {
      var mongooseMock = {
        model: function() {}
      };
      mockery.registerMock('mongoose', mongooseMock);

      var contact = {
        _id: 123
      };
      var core = {
        contact: {
          get: function(id, callback) {
            return callback(null, contact);
          }
        }
      };
      mockery.registerMock('../../core', core);

      var contacts = require(this.testEnv.basePath + '/backend/webserver/controllers/contacts');
      var req = {
        params: {
          id: 123
        }
      };
      var res = {
      };
      var next = function() {
        expect(req.contact).to.exist;
        expect(req.contact).to.deep.equal(contact);
        done();
      };
      contacts.load(req, res, next);
    });
  });
});
