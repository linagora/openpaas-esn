'use strict';

var chai = require('chai');
var expect = chai.expect;

describe('The user denormalize module', function() {

  it('should set the document.id and remove the password', function() {
    var user = {_id: 1, password: '123'};
    require('mongoose');
    this.helpers.requireBackend('core/db/mongo/models/user');
    var document = this.helpers.requireBackend('core/user/denormalize')(user);
    expect(document.id).to.equal(user.id);
    expect(document.password).to.not.exist;
  });
});
