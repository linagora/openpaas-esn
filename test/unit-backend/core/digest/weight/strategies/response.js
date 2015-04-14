'use strict';

var expect = require('chai').expect;

describe('Simple digest weight strategy', function() {

  it('should set the weight to the number of unread responses', function() {
    var messages = [
      {
        id: 1,
        read: false,
        responses: []
      },
      {
        id: 2,
        read: false,
        responses: [{read: true}, {read: false}]
      },
      {
        id: 3,
        read: false,
        responses: [{read: true}, {read: false}, {read: false}, {read: false}, {read: true}]
      }
    ];

    var module = this.helpers.requireBackend('core/digest/weight/strategies/response');
    var result = module.computeMessagesWeight(messages);
    expect(result[0].weight).to.equal(0);
    expect(result[1].weight).to.equal(1);
    expect(result[2].weight).to.equal(3);
  });
});
