'use strict';

var mockery = require('mockery');
var chai = require('chai');
var expect = chai.expect;

describe('The user denormalize module', function() {

  it('should set the document.id', function() {
    var user = {_id: 1};
    var Model = function(user) {
      this.user = user;
    };
    Model.prototype.toObject = function() {
      return this.user;
    };

    mockery.registerMock('mongoose', {
      model: function() {return Model;}
    });
    var document = this.helpers.rewireBackend('core/user/denormalize')(user);
    expect(document.id).to.equal(user.id);
  });
});
