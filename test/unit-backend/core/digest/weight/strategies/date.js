'use strict';

var expect = require('chai').expect;

describe('Date digest weight strategy', function() {

  function getMessageFromId(id, messages) {
    return messages.filter(function(message) {
      return message.id === id;
    })[0];
  }

  describe('The computeMessagesWeight fn', function() {
    it('should assign higher weight to messages without responses and most recent', function() {
      var date = new Date();

      var date2 = new Date();
      date2.setSeconds(date.getSeconds() + 10);

      var date3 = new Date();
      date3.setSeconds(date.getSeconds() + 10);

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

      var module = this.helpers.requireBackend('core/digest/weight/strategies/date');
      var result = module.computeMessagesWeight(messages);
      var m1 = getMessageFromId(1, result);
      var m2 = getMessageFromId(2, result);
      var m3 = getMessageFromId(3, result);
      expect(m3.weight > m2.weight).to.be.true;
      expect(m2.weight > m1.weight).to.be.true;
    });

    it('should assign higher weight to a message which does not have responses than to one which have', function() {
      var date = new Date();

      var date2 = new Date();
      date2.setSeconds(date.getSeconds() + 10);

      var date3 = new Date();
      date3.setSeconds(date.getSeconds() + 10);

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
          read: true,
          responses: [
            {
              read: true,
              published: date2
            },
            {
              read: false,
              published: date2
            }
          ]
        }
      ];

      var module = this.helpers.requireBackend('core/digest/weight/strategies/date');
      var result = module.computeMessagesWeight(messages);
      var m1 = getMessageFromId(1, result);
      var m2 = getMessageFromId(2, result);
      var m3 = getMessageFromId(3, result);
      expect(m2.weight > m1.weight).to.be.true;
      expect(m1.weight > m3.weight).to.be.true;
    });

    it('should assign more weight to messages without responses then to messages with responses ordered by date', function() {
      var date = new Date();

      var date2 = new Date();
      date2.setSeconds(date.getSeconds() + 10);

      var date3 = new Date();
      date3.setSeconds(date2.getSeconds() + 10);

      var date4 = new Date();
      date4.setSeconds(date2.getSeconds() + 10);

      var messages = [
        {
          id: 1,
          published: date,
          read: true,
          responses: [
            {
              read: true,
              published: date2
            },
            {
              read: false,
              published: date3
            }
          ]
        },
        {
          id: 2,
          published: date2,
          read: true,
          responses: [
            {
              read: true,
              published: date
            },
            {
              read: true,
              published: date2
            },
            {
              read: false,
              published: date2
            }
          ]
        },
        {
          id: 3,
          published: date2,
          read: false,
          responses: [
            {
              read: false,
              published: date3
            },
            {
              read: false,
              published: date4
            }
          ]
        },
        {
          id: 4,
          published: date,
          read: false,
          responses: []
        },
        {
          id: 5,
          published: date,
          read: false,
          responses: []
        },
        {
          id: 6,
          published: date2,
          read: false,
          responses: []
        }
      ];

      var module = this.helpers.requireBackend('core/digest/weight/strategies/date');
      var result = module.computeMessagesWeight(messages);
      var m1 = getMessageFromId(1, result);
      var m2 = getMessageFromId(2, result);
      var m3 = getMessageFromId(3, result);
      var m4 = getMessageFromId(4, result);
      var m5 = getMessageFromId(5, result);
      var m6 = getMessageFromId(6, result);

      console.log(result);

      expect(m6.weight > m5.weight, '1').to.be.true;
      expect(m6.weight > m4.weight, '2').to.be.true;
      expect(m4.weight > m3.weight, '3').to.be.true;
      expect(m3.weight > m1.weight, '4').to.be.true;
      expect(m1.weight > m2.weight, '5').to.be.true;
    });
  });

  it('should assign higher weight to messages without responses and most recent', function() {
    var date = new Date();

    var date2 = new Date();
    date2.setSeconds(date.getSeconds() + 10);

    var date3 = new Date();
    date3.setSeconds(date.getSeconds() + 10);

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

    var module = this.helpers.requireBackend('core/digest/weight/strategies/date');
    var result = module.computeMessagesWeight(messages);
    var m1 = getMessageFromId(1, result);
    var m2 = getMessageFromId(2, result);
    var m3 = getMessageFromId(3, result);
    expect(m3.weight > m2.weight).to.be.true;
    expect(m2.weight > m1.weight).to.be.true;
  });
});
