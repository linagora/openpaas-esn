'use strict';

var mockery = require('mockery');
var chai = require('chai');
var expect = chai.expect;

describe('The user search module', function() {

  describe('The denormalize function', function() {

    beforeEach(function() {
      mockery.registerMock('./utils', {});
    });

    it('should set the document.id', function() {
      var user = {_id: 1};
      mockery.registerMock('../../helpers/mongoose', {
        userToJSON: function(user) {
          return user;
        }
      });
      var document = this.helpers.rewireBackend('core/user/search').denormalize(user);
      expect(document.id).to.equal(user.id);
    });
  });
});
