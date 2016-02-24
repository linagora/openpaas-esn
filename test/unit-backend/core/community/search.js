'use strict';

var mockery = require('mockery');
var chai = require('chai');
var expect = chai.expect;

describe('The community search module', function() {

  describe('The denormalize function', function() {

    beforeEach(function() {
      mockery.registerMock('./utils', {});
      mockery.registerMock('../elasticsearch', {});
    });

    it('should set the document.id', function() {
      var community = {_id: 1};
      mockery.registerMock('../../helpers/mongoose', {
        communityToJSON: function(community) {
          return community;
        }
      });
      var document = this.helpers.requireBackend('core/community/search').denormalize(community);
      expect(document.id).to.equal(community.id);
    });
  });
});
