'use strict';

var expect = require('chai').expect;

describe('The addmember invitation handler', function() {
  describe('isStillValid method', function() {
    it('should return true is the invitation creation date is less than 7 days old', function(done) {
      var addmember = this.helpers.requireBackend('core/invitation/handlers/addmember');
      var sixDays = new Date();
      sixDays.setDate(sixDays.getDate() - 6);
      var invitation = {
        timestamps: {
          created: sixDays
        }
      };
      addmember.isStillValid(invitation, function(err, valid) {
        expect(err).to.be.null;
        expect(valid).to.be.true;
        done();
      });
    });

    it('should return false is the invitation creation date is more than 7 days old', function(done) {
      var addmember = this.helpers.requireBackend('core/invitation/handlers/addmember');
      var eightDays = new Date();
      eightDays.setDate(eightDays.getDate() - 8);
      var invitation = {
        timestamps: {
          created: eightDays
        }
      };
      addmember.isStillValid(invitation, function(err, valid) {
        expect(err).to.be.null;
        expect(valid).to.be.false;
        done();
      });
    });
  });
});
