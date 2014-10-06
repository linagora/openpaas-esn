'use strict';

var expect = require('chai').expect;

describe('The community helpers module', function() {

  describe('the filterMemberShipRequestsByUser fn', function() {

    it('should return null if the community is null', function() {
      var communityHelper = require(this.testEnv.basePath + '/backend/helpers/community');
      var community = communityHelper.filterMemberShipRequestsByUser(null, {});
      expect(community).to.be.null;
    });

    it('should return the community if it has no membership requests', function() {
      var c = {_id: '123'};
      var communityHelper = require(this.testEnv.basePath + '/backend/helpers/community');
      var community = communityHelper.filterMemberShipRequestsByUser(c, {});
      expect(community).to.deep.equal(c);
    });

    it('should return the community if user is null', function() {
      var c = {_id: '123'};
      var communityHelper = require(this.testEnv.basePath + '/backend/helpers/community');
      var community = communityHelper.filterMemberShipRequestsByUser(c, null);
      expect(community).to.deep.equal(c);
    });

    it('should return the community with its membershipRequests array filtered', function() {
      var filteredUserID = '789';
      var c = {
        _id: '123',
        membershipRequests: [
          {user: this.helpers.objectIdMock('456')},
          {user: this.helpers.objectIdMock(filteredUserID)}
        ]
      };

      var communityHelper = require(this.testEnv.basePath + '/backend/helpers/community');
      var community = communityHelper.filterMemberShipRequestsByUser(c, {_id: this.helpers.objectIdMock(filteredUserID)});
      expect(community.membershipRequests).to.exist;
      expect(community.membershipRequests).to.have.length(1);
      expect(community.membershipRequests[0].user.value()).to.equal(filteredUserID);
    });

  });

});
