'use strict';

/* global chai: false */
var expect = chai.expect;

describe('CalendarShell factory', function() {
  var CalendarShell, fcMoment;

  beforeEach(function() {
    this.uuid4 = {
      // This is a valid uuid4. Change this if you need other uuids generated.
      _uuid: '00000000-0000-4000-a000-000000000000',
      generate: function() {
        return this._uuid;
      }
    };

    this.jstz = {
      determine: function() {
        return {
        name: function() {
          return 'Europe/Paris';
        }};
      }
    };

    var self = this;
    angular.mock.module('esn.calendar');
    angular.mock.module(function($provide) {
      $provide.value('jstz', self.jstz);
      $provide.value('uuid4', self.uuid4);
    });
  });

  beforeEach(function() {
    angular.mock.inject(function(_CalendarShell_, _fcMoment_) {
      CalendarShell = _CalendarShell_;
      fcMoment = _fcMoment_;
    });
  });

  describe('for reccurent events', function() {

    function getIcalWithRrule(rrule) {
      return [
        'vcalendar',
        [],
        [
          [
            'vevent',
            [
              [
                'uid',
                {},
                'text',
                '00000000-0000-4000-a000-000000000000'
              ],
              [
                'transp',
                {},
                'text',
                'OPAQUE'
              ],
              [
                'dtstart',
                {
                  tzid: 'Europe\/Paris'
                },
                'date-time',
                '2014-12-29T18:00:00'
              ],
              [
                'dtend',
                {
                  tzid: 'Europe\/Paris'
                },
                'date-time',
                '2014-12-29T19:00:00'
              ],
              [
                'summary',
                {},
                'text',
                'non-allday event'
              ],
              rrule
            ],
            []
          ]
        ]
      ];
    }

    it('should correctly create a recurrent event : daily + interval + count', function() {
      var shell = {
        start: fcMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: fcMoment(new Date(2014, 11, 29, 19, 0, 0)),
        title: 'non-allday event',
        rrule: {
          freq: 'DAILY',
          interval: 2,
          count: 3
        }
      };
      var rrule = [
        'rrule',
        {},
        'recur',
        {
          freq: 'DAILY',
          count: 3,
          interval: 2
        }
      ];

      shell = CalendarShell.fromIncompleteShell(shell);
      expect(shell.vcalendar.toJSON()).to.deep.equal(getIcalWithRrule(rrule));
    });

    it('should correctly create a recurrent event : weekly + byday', function() {
      var shell = {
        start: fcMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: fcMoment(new Date(2014, 11, 29, 19, 0, 0)),
        title: 'non-allday event',
        rrule: {
          freq: 'WEEKLY',
          byday: ['MO', 'WE', 'FR']
        }
      };

      var rrule = [
        'rrule',
        {},
        'recur',
        {
          freq: 'WEEKLY',
          byday: ['MO', 'WE', 'FR']
        }
      ];

      shell = CalendarShell.fromIncompleteShell(shell);
      expect(shell.vcalendar.toJSON()).to.deep.equal(getIcalWithRrule(rrule));
    });

    it('should correctly create a recurrent event : monthly', function() {
      var shell = {
        start: fcMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: fcMoment(new Date(2014, 11, 29, 19, 0, 0)),
        title: 'non-allday event',
        rrule: {
          freq: 'MONTHLY'
        }
      };

      var rrule = [
        'rrule',
        {},
        'recur',
        {
          freq: 'MONTHLY'
        }
      ];

      shell = CalendarShell.fromIncompleteShell(shell);
      expect(shell.vcalendar.toJSON()).to.deep.equal(getIcalWithRrule(rrule));
    });

    it('should correctly create a recurrent event : yearly + until', function() {
      var shell = {
        start: fcMoment(new Date(2014, 11, 29, 18, 0, 0)),
        end: fcMoment(new Date(2014, 11, 29, 19, 0, 0)),
        title: 'non-allday event',
        rrule: {
          freq: 'YEARLY',
          until: new Date(2024, 11, 29, 0, 0, 0)
        }
      };

      var rrule = [
        'rrule',
        {},
        'recur',
        {
          freq: 'YEARLY',
          until: '2024-12-29T00:00:00'
        }
      ];

      shell = CalendarShell.fromIncompleteShell(shell);
      expect(shell.vcalendar.toJSON()).to.deep.equal(getIcalWithRrule(rrule));
    });
  });

});
