'use strict';

var chai = require('chai');
var expect = chai.expect;

describe('The community denormalize module', function() {

  it('should set the document.id', function() {
    var community = {_id: 1};
    require('mongoose');
    this.helpers.requireBackend('core/db/mongo/models/community');
    var document = this.helpers.requireBackend('core/community/denormalize')(community);
    expect(document.id).to.equal(community.id);
  });
});
