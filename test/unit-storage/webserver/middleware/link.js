'use strict';

var expect = require('chai').expect,
    mockery = require('mockery');

describe('The link middleware', function() {

  describe('The trackProfileView fn', function() {

    it('should not send an error if request does not content a user', function(done) {
      var mongooseMock = {
        model: function() {
          return function Link(object) {};
        }
      };
      mockery.registerMock('mongoose', mongooseMock);
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/link').trackProfileView;
      var req = {};
      var res = {};
      var next = function() {
        done();
      };
      middleware(req, res, next);
    });

    it('should not send an error if request does not content a profile uuid', function(done) {
      var mongooseMock = {
        model: function() {
          return function Link(object) {};
        }
      };
      mockery.registerMock('mongoose', mongooseMock);
      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/link').trackProfileView;
      var req = {
        user: {},
        params: {}
      };
      var res = {};
      var next = function() {
        done();
      };
      middleware(req, res, next);
    });

    it('should create a profile link between the request user and the target user', function(done) {
      var link = {};

      var mongooseMock = {
        model: function(model) {
          return function Link(object) {
            link = {
              user: object.user,
              target: object.target,
              type: object.type
            };
            this.save = function(callback) {
              callback();
            };
          };
        },
        Types: {
          ObjectId: function (target) {
            return target;
          }
        }
      };
      mockery.registerMock('mongoose', mongooseMock);

      var middleware = require(this.testEnv.basePath + '/backend/webserver/middleware/link').trackProfileView;

      var req = {
        user: 'foouser',
        params: {
          uuid: '123'
        }
      };
      var res = {
        json: function() {
          done(new Error('Should not be called'));
        }
      };
      var next = function() {
        expect(link).to.deep.equal({
          user: 'foouser',
          target: {
            resource: '123',
            type: 'User'
          },
          type: 'profile'
        });
        done();
      };

      middleware(req, res, next);
    });
  });
});
