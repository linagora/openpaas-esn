'use strict';

var mockery = require('mockery');
var chai = require('chai');
var expect = chai.expect;

describe('The community denormalize module', function() {

  it('should set the document.id', function() {
    var community = {_id: 1};
    var Model = function(community) {
      this.community = community;
    };
    Model.prototype.toObject = function() {
      return this.community;
    };

    mockery.registerMock('mongoose', {
      model: function() {return Model;}
    });
    var document = this.helpers.rewireBackend('core/community/denormalize')(community);
    expect(document.id).to.equal(community.id);
  });
});
