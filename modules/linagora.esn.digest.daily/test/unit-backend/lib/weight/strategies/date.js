'use strict';

var expect = require('chai').expect;

describe('Date digest weight strategy', function() {

  var deps = {};
  var dependencies = function(name) {
    return deps[name];
  };
  var helpers = {
    array: require('../../../../../../../backend/helpers/array')
  };

  function initDependencies() {
    deps = {
      helpers: helpers
    };
  }

  beforeEach(function() {
    initDependencies();
  });

  function getMessageFromId(id, messages) {
    return messages.filter(function(message) {
      return message.id === id;
    })[0];
  }

  describe('The computeMessagesWeight fn', function() {
    it('should assign higher weight to most recent message', function() {
      var date = new Date(1000);
      var date2 = new Date(2000);
      var date3 = new Date(3000);

      var messages = [
        {
          id: 1,
          published: date,
          read: false,
          responses: []
        },
        {
          id: 2,
          published: date2,
          read: false,
          responses: []
        },
        {
          id: 3,
          published: date3,
          read: false,
          responses: []
        }
      ];

      var module = require('../../../../../lib/weight/strategies/date')(dependencies);
      var result = module.computeMessagesWeight(messages);
      var m1 = getMessageFromId(1, result);
      var m2 = getMessageFromId(2, result);
      var m3 = getMessageFromId(3, result);
      expect(m3.weight > m2.weight).to.be.true;
      expect(m2.weight > m1.weight).to.be.true;
    });

    it('should assign higher weight to a message which is not read', function() {
      var date = new Date(1000);
      var date2 = new Date(2000);
      var date3 = new Date(3000);
      var date4 = new Date(4000);
      var date5 = new Date(5000);

      var messages = [
        {
          id: 1,
          published: date,
          read: false,
          responses: []
        },
        {
          id: 2,
          published: date2,
          read: false,
          responses: [
            {
              read: false,
              published: date4
            }
          ]
        },
        {
          id: 3,
          published: date3,
          read: true,
          responses: [
            {
              read: true,
              published: date4
            },
            {
              read: false,
              published: date5
            }
          ]
        }
      ];

      var module = require('../../../../../lib/weight/strategies/date')(dependencies);
      var result = module.computeMessagesWeight(messages);
      var m1 = getMessageFromId(1, result);
      var m2 = getMessageFromId(2, result);
      var m3 = getMessageFromId(3, result);
      expect(m2.weight > m1.weight).to.be.true;
      expect(m1.weight > m3.weight).to.be.true;
    });

    it('should assign more weight to messages with more recent response', function() {
      var date = new Date(1000);
      var date2 = new Date(2000);
      var date3 = new Date(3000);
      var date4 = new Date(4000);

      var messages = [
        {
          id: 1,
          published: date,
          read: false,
          responses: []
        },
        {
          id: 2,
          published: date2,
          read: false,
          responses: [
            {
              read: false,
              published: date4
            }
          ]
        },
        {
          id: 3,
          published: date3,
          read: false,
          responses: []
        }
      ];

      var module = require('../../../../../lib/weight/strategies/date')(dependencies);
      var result = module.computeMessagesWeight(messages);
      var m1 = getMessageFromId(1, result);
      var m2 = getMessageFromId(2, result);
      var m3 = getMessageFromId(3, result);
      expect(m2.weight > m3.weight).to.be.true;
      expect(m2.weight > m1.weight).to.be.true;
    });
  });
});
