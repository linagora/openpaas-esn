'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');
var q = require('q');
var mockery = require('mockery');

describe('The profile-link middleware', function() {

  describe('The trackProfileView fn', function() {

    it('should not send an error when req.user is undefined', function(done) {
      mockery.registerMock('../../core/resource-link', {
        create: function() {
          done(new Error());
        }
      });
      var middleware = this.helpers.requireBackend('webserver/middleware/profile-link').trackProfileView({}, {}, done);
    });

    it('should not send an error if request does not content a profile uuid', function(done) {
      var spy = sinon.stub().returns(q());
      mockery.registerMock('../../core/resource-link', {
        create: spy
      });

      var req = {
        user: {},
        params: {}
      };
      var next = function() {
        expect(spy).to.have.beenCalledOnce;
        done();
      };
      this.helpers.requireBackend('webserver/middleware/profile-link').trackProfileView(req, {}, next);
    });

    it('should create a profile link between the request user and the target user', function(done) {
      var req = {
        user: {
          _id: 'foouser'
        },
        params: {
          uuid: '123'
        }
      };

      mockery.registerMock('../../core/resource-link', {
        create: function(link) {
          expect(link).to.deep.equal({
            source: {
              id: req.user._id,
              objectType: 'user'
            },
            target: {
              id: req.params.uuid,
              objectType: 'user'
            },
            type: 'profile'
          });
          return q(link);
        }
      });

      this.helpers.requireBackend('webserver/middleware/profile-link').trackProfileView(req, {}, done);
    });
  });
});
