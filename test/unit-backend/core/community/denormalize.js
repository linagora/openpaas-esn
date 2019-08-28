const chai = require('chai');
const expect = chai.expect;

describe('The community denormalize module', function() {
  describe('The denormalize function', function() {
    it('should set the document.id and remove _id', function() {
      this.helpers.requireBackend('core/db/mongo/models/community-archive');

      const community = new this.helpers.requireBackend('core/db/mongo/models/community')();
      const denormalized = this.helpers.requireBackend('core/community/denormalize').denormalize(community);

      expect(denormalized.id.toString()).to.equal(community._id.toString());
      expect(denormalized._id).to.not.exist;
    });
  });

  describe('The getId function', function() {
    it('should return the _id', function() {
      const community = {_id: 1};

      this.helpers.requireBackend('core/db/mongo/models/community');
      expect(this.helpers.requireBackend('core/community/denormalize').getId(community)).to.equal(community._id);
    });
  });
});
