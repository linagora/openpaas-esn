'use strict';

var expect = require('chai').expect;

describe('The daily digest helpers module', function() {

  describe('The getMostRecentMessage function', function() {
    it('should return undefined when messages is undefined', function() {
      expect(require('../../../lib/helpers').getMostRecentMessage()).to.be.undefined;
    });

    it('should return the most recent message when no responses are set', function() {
      var date = new Date();
      var date2 = new Date();
      var date3 = new Date();
      date2.setSeconds(date.getSeconds() + 10);
      date3.setSeconds(date.getSeconds() + 20);

      var messageA = {published: date};
      var messageB = {published: date2};
      var messageC = {published: date3};
      var messageD = {};

      var result = require('../../../lib/helpers').getMostRecentMessage([messageA, messageB, messageC, messageD]);
      expect(result).to.deep.equal(messageC);
    });

    it('should return the most recent response', function() {
      var date = new Date();
      var date2 = new Date();
      var date3 = new Date();
      date2.setSeconds(date.getSeconds() + 10);
      date3.setSeconds(date.getSeconds() + 20);

      var response = {_id: 1, published: date3};

      var messageA = {_id: 2, published: date};
      var messageB = {_id: 3, published: date2, responses: [response, {published: new Date()}]};
      var messageC = {_id: 4, published: date2};
      var messageD = {_id: 5};

      var result = require('../../../lib/helpers').getMostRecentMessage([messageA, messageB, messageC, messageD]);
      expect(result).to.deep.equal(response);
    });

    it('should return the most recent message', function() {
      var date = new Date();
      var date2 = new Date();
      var date3 = new Date();
      date2.setSeconds(date.getSeconds() + 10);
      date3.setSeconds(date.getSeconds() + 20);

      var messageA = {_id: 2, published: date3};
      var messageB = {_id: 3, published: date2, responses: [{published: date}, {published: date}]};
      var messageC = {_id: 4, published: date2, responses: [{published: date}]};
      var messageD = {_id: 4, published: date};

      var result = require('../../../lib/helpers').getMostRecentMessage([messageA, messageB, messageC, messageD]);
      expect(result).to.deep.equal(messageA);
    });
  });

});
