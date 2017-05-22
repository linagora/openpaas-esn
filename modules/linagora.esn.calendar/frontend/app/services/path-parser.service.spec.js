'use strict';

/* global chai : false */

var expect = chai.expect;

describe('The calPathParser service', function() {
  var calPathParser;

  beforeEach(function() {
    angular.mock.module('esn.calendar');
  });

  beforeEach(angular.mock.inject(function(_calPathParser_) {
    calPathParser = _calPathParser_;
  }));

  describe('The parseCalendarPath fn', function() {
    var calendarHomeId, calendarId;

    beforeEach(function() {
      calendarHomeId = '123';
      calendarId = '456';
    });

    it('should return valid object', function() {
      expect(calPathParser.parseCalendarPath(calendarHomeId + '/' + calendarId)).to.deep.equal({
        calendarHomeId: calendarHomeId,
        calendarId: calendarId
      });
    });

    it('should return calendarHomeId when no other information is available', function() {
      expect(calPathParser.parseCalendarPath(calendarHomeId)).to.deep.equal({
        calendarHomeId: calendarHomeId,
        calendarId: ''
      });
    });

    it('should strip trailing /', function() {
      expect(calPathParser.parseCalendarPath('/' + calendarHomeId + '/' + calendarId)).to.deep.equal({
        calendarHomeId: calendarHomeId,
        calendarId: calendarId
      });
    });
  });

  describe('The parseEventPath fn', function() {
    var calendarHomeId, calendarId;

    beforeEach(function() {
      calendarHomeId = '123';
      calendarId = '456';
    });

    it('should return valid object', function() {
      expect(calPathParser.parseEventPath('/a/path/calendars/' + calendarHomeId + '/' + calendarId + '/event.ics')).to.deep.equal({
        calendarHomeId: calendarHomeId,
        calendarId: calendarId
      });
    });

    it('should strip trailing /', function() {
      expect(calPathParser.parseEventPath('/' + calendarHomeId + '/' + calendarId + '/event.ics')).to.deep.equal({
        calendarHomeId: calendarHomeId,
        calendarId: calendarId
      });
    });
  });
});
