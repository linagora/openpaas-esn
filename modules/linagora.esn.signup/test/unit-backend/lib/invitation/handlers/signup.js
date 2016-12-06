'use strict';

var expect = require('chai').expect;

describe('The signup invitation handler', function() {

  var signup,
      dependencies = {
        email: {
          system: {
            signupConfirmation: {}
          }
        },
        logger: {}
      },
      deps = function(name) {
        return dependencies[name];
      };

  beforeEach(function() {
    signup = require('../../../../../backend/lib/invitation/handlers/signup')(deps);
  });

  describe('isStillValid method', function() {
    it('should return true is the invitation creation date is less than 7 days old', function(done) {
      var sixDays = new Date();
      sixDays.setDate(sixDays.getDate() - 6);
      var invitation = {
        timestamps: {
          created: sixDays
        }
      };
      signup.isStillValid(invitation, function(err, valid) {
        expect(err).to.be.null;
        expect(valid).to.be.true;
        done();
      });
    });

    it('should return false is the invitation creation date is more than 7 days old', function(done) {
      var eightDays = new Date();
      eightDays.setDate(eightDays.getDate() - 8);
      var invitation = {
        timestamps: {
          created: eightDays
        }
      };
      signup.isStillValid(invitation, function(err, valid) {
        expect(err).to.be.null;
        expect(valid).to.be.false;
        done();
      });
    });
  });
});
