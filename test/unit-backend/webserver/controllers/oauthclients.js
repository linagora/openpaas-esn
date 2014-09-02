'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');

describe('The oauthclients controller', function() {

  describe('list method', function() {
    it('should return 500 if the oautclient listing fails', function(done) {
      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };
      mockery.registerMock('mongoose', {
        model: function() {
          return {
            find: function() {
              return {
                sort: function() {
                  return {
                    exec: function(callback) {
                      return callback(new Error());
                    }
                  };
                }
              };
            }
          };
        }
      });

      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/oauthclients');
      controller.list({}, res);
    });

    it('should return 200 if the oautclient listing succeeds', function(done) {
      var oauthclients = [
        {
          _id: '123',
          name: 'aName'
        },
        {
          _id: '456',
          name: 'anotherName'
        }
      ];
      var res = {
        json: function(code, data) {
          expect(code).to.equal(200);
          expect(data).to.exist;
          expect(data.length).to.equal(2);
          expect(data).to.deep.equal(oauthclients);
          done();
        }
      };
      mockery.registerMock('mongoose', {
        model: function() {
          return {
            find: function() {
              return {
                sort: function() {
                  return {
                    exec: function(callback) {
                      return callback(null, oauthclients);
                    }
                  };
                }
              };
            }
          };
        }
      });

      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/oauthclients');
      controller.list({}, res);
    });
  });

  describe('create method', function() {
    var validReq;
    before(function() {
      validReq = {
        user: {
          emails: ['aEmail'],
          _id: 123
        },
        body: {
          name: 'aName'
        }
      };
    });

    it('should return 400 if the user is not set in the request', function(done) {
      var res = {
        json: function(code) {
          expect(code).to.equal(400);
          done();
        }
      };
      mockery.registerMock('mongoose', {
        model: function() {}
      });

      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/oauthclients');
      controller.create({}, res);
    });

    it('should return 500 if the creation of the OAuthclient fails', function(done) {
      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };
      var mongooseMocked = {
        model: function(model) {
          function OAuthClient(data) {}
          OAuthClient.prototype.save = function(callback) {
            return callback(new Error('There was an error !'));
          };
          return OAuthClient;
        }
      };
      mockery.registerMock('mongoose', mongooseMocked);

      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/oauthclients');
      controller.create(validReq, res);
    });

    it('should return 201 if the creation of the OAuthclient succeeds', function(done) {
      var testId = '123';
      var res = {
        json: function(code, data) {
          expect(code).to.equal(201);
          expect(code).to.exist;
          expect(data._id).to.equal(testId);
          done();
        }
      };
      var mongooseMocked = {
        model: function(model) {
          function OAuthClient(data) {}
          OAuthClient.prototype.save = function(callback) {
            return callback(null, {_id: testId});
          };
          return OAuthClient;
        }
      };
      mockery.registerMock('mongoose', mongooseMocked);

      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/oauthclients');
      controller.create(validReq, res);
    });
  });

  describe('get method', function() {
    var validReq;
    before(function() {
      validReq = {
        params: {
          id: 123
        }
      };
    });

    it('should return 500 if the search fails', function(done) {
      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };
      mockery.registerMock('mongoose', {
        model: function() {
          return {
            findById: function(id, callback) {
              expect(id).to.equal(validReq.params.id);
              return callback(new Error());
            }
          };
        }
      });
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/oauthclients');
      controller.get(validReq, res);
    });

    it('should return 404 if the search returns nothing', function(done) {
      var res = {
        json: function(code) {
          expect(code).to.equal(404);
          done();
        }
      };
      mockery.registerMock('mongoose', {
        model: function() {
          return {
            findById: function(id, callback) {
              expect(id).to.equal(validReq.params.id);
              return callback(null, null);
            }
          };
        }
      });
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/oauthclients');
      controller.get(validReq, res);
    });

    it('should return 200 if the search returns a client', function(done) {
      var client = {
        _id: '123',
        name: 'aName'
      };
      var res = {
        json: function(code, data) {
          expect(code).to.equal(200);
          expect(data).to.deep.equal(client);
          done();
        }
      };
      mockery.registerMock('mongoose', {
        model: function() {
          return {
            findById: function(id, callback) {
              expect(id).to.equal(validReq.params.id);
              return callback(null, client);
            }
          };
        }
      });
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/oauthclients');
      controller.get(validReq, res);
    });
  });


  describe('get method', function() {
    var validReq;
    before(function() {
      validReq = {
        params: {
          id: 123
        }
      };
    });

    it('should return 500 if the find and remove fails', function(done) {
      var res = {
        json: function(code) {
          expect(code).to.equal(500);
          done();
        }
      };
      mockery.registerMock('mongoose', {
        model: function() {
          return {
            findByIdAndRemove: function(id, callback) {
              expect(id).to.equal(validReq.params.id);
              return callback(new Error());
            }
          };
        }
      });
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/oauthclients');
      controller.remove(validReq, res);
    });

    it('should return 404 if the oauthclient is not found', function(done) {
      var res = {
        json: function(code) {
          expect(code).to.equal(404);
          done();
        }
      };
      mockery.registerMock('mongoose', {
        model: function() {
          return {
            findByIdAndRemove: function(id, callback) {
              expect(id).to.equal(validReq.params.id);
              return callback(null, null);
            }
          };
        }
      });
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/oauthclients');
      controller.remove(validReq, res);
    });

    it('should return 200 if the oauthclient is found an deleted properly', function(done) {
      var client = {
        _id: '123',
        name: 'aName'
      };
      var res = {
        json: function(code, data) {
          expect(code).to.equal(200);
          expect(data).to.deep.equal(client);
          done();
        }
      };
      mockery.registerMock('mongoose', {
        model: function() {
          return {
            findByIdAndRemove: function(id, callback) {
              expect(id).to.equal(validReq.params.id);
              return callback(null, client);
            }
          };
        }
      });
      var controller = require(this.testEnv.basePath + '/backend/webserver/controllers/oauthclients');
      controller.remove(validReq, res);
    });
  });

});
