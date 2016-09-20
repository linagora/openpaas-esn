'use strict';

/* global chai, sinon, _: false */

var expect = chai.expect;

describe('The calendarUtils service', function() {
  var self;

  beforeEach(function() {
    self = this;

    angular.mock.module('esn.calendar');
    angular.mock.module('esn.ical');
    self.fcMomentMock = null;

    angular.mock.module(function($provide) {
      $provide.decorator('fcMoment', function($delegate) {
        return function() {
          return (self.fcMomentMock || $delegate).apply(this, arguments);
        };
      });
    });
  });

  beforeEach(angular.mock.inject(function(calendarUtils, fcMoment) {
    self.calendarUtils = calendarUtils;
    self.fcMoment = fcMoment;
  }));

  describe('the getDateOnCalendarSelect function', function() {
    it('should add 30 minutes to end if diff is 30 minutes and start is an hour', function() {
      var start = self.fcMoment('2013-02-08 09:00:00');
      var end = self.fcMoment('2013-02-08 09:30:00');
      var expectedStart = self.fcMoment('2013-02-08 09:00:00');
      var expectedEnd = self.fcMoment('2013-02-08 10:00:00');
      var date = self.calendarUtils.getDateOnCalendarSelect(start, end);
      expect(expectedStart.isSame(date.start)).to.be.true;
      expect(expectedEnd.isSame(date.end)).to.be.true;
    });

    it('should add 30 minutes to end if diff is 30 minutes and start is an half hour', function() {
      var start = self.fcMoment('2013-02-08 09:30:00');
      var end = self.fcMoment('2013-02-08 10:00:00');
      var expectedStart = self.fcMoment('2013-02-08 09:30:00');
      var expectedEnd = self.fcMoment('2013-02-08 10:30:00');
      var date = self.calendarUtils.getDateOnCalendarSelect(start, end);
      expect(expectedStart.isSame(date.start)).to.be.true;
      expect(expectedEnd.isSame(date.end)).to.be.true;
    });

    it('should return same start and end if the diff is not 30 minutes', function() {
      var start = self.fcMoment('2013-02-08 09:00:00');
      var end = self.fcMoment('2013-02-08 11:30:00');
      var expectedStart = self.fcMoment('2013-02-08 09:00:00');
      var expectedEnd = self.fcMoment('2013-02-08 11:30:00');
      var date = self.calendarUtils.getDateOnCalendarSelect(start, end);
      expect(expectedStart.isSame(date.start)).to.be.true;
      expect(expectedEnd.isSame(date.end)).to.be.true;
    });
  });

  describe('the getNewStartDate', function() {
    it('should return the next hour returned by getNewStartDate', function() {
      [
        {input: '10:00', output: '10:30'},
        {input: '10:01', output: '10:30'},
        {input: '11:31', output: '12:00'},
        {input: '11:59', output: '12:00'},
        {input: '12:30', output: '13:00'}
      ].map(function(obj) {
          return _.mapValues(obj, function(hour) {
            return self.fcMoment('1991-10-03 ' + hour);
          });
        }).forEach(function(obj) {
          self.fcMomentMock = sinon.stub().returns(obj.input);
          var result = self.calendarUtils.getNewStartDate();
          expect(result.isSame(obj.output, 'second')).to.be.true;
          expect(self.fcMomentMock).to.have.been.calledOnce;
        }, this);
    });
  });

  describe('the getNewEndDate', function() {
    it('should return the next hour returned by getNewStartDate', function() {
      [
        {input: '10:00', output: '11:30'},
        {input: '10:01', output: '11:30'},
        {input: '11:31', output: '13:00'},
        {input: '11:59', output: '13:00'},
        {input: '12:30', output: '14:00'}
      ].map(function(obj) {
          return _.mapValues(obj, function(hour) {
            return self.fcMoment('1991-10-03 ' + hour);
          });
        }).forEach(function(obj) {
          self.fcMomentMock = sinon.stub().returns(obj.input);
          var result = self.calendarUtils.getNewEndDate();
          expect(result.isSame(obj.output, 'second')).to.be.true;
          expect(self.fcMomentMock).to.have.been.calledOnce;
        }, this);
    });
  });

});
