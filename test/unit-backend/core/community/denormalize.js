'use strict';

var chai = require('chai');
var expect = chai.expect;

describe('The community denormalize module', function() {

  describe('The denormalize function', function() {
    it('should set the document.id and remove _id', function() {
      var community = {_id: 1};
      require('mongoose');
      this.helpers.requireBackend('core/db/mongo/models/community');
      this.helpers.requireBackend('core/db/mongo/models/community-archive');
      var document = this.helpers.requireBackend('core/community/denormalize').denormalize(community);
      expect(document.id).to.equal(community.id);
      expect(document._id).to.not.exist;
    });
  });

  describe('The getId function', function() {
    it('should return the _id', function() {
      var community = {_id: 1};
      require('mongoose');
      this.helpers.requireBackend('core/db/mongo/models/community');
      expect(this.helpers.requireBackend('core/community/denormalize').getId(community)).to.equal(community._id);
    });
  });
});
