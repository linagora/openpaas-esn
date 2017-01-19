'use strict';

/* global chai */

var expect = chai.expect;

describe('the calendarExploredPeriodService service', function() {

  var self;

  function buildPeriod(start, end) {
    return {
      start: self.calMoment([2000, 1, start]).stripTime(),
      end: self.calMoment([2000, 1, end]).stripTime()
    };
  }

  function periodToComparablePeriod(period) {
    return {
      start: period.start.format('YYYY-MM-DD'),
      end: period.end.format('YYYY-MM-DD')
    };
  }

  beforeEach(function() {
    self = this;
    angular.mock.module('esn.calendar');
  });

  beforeEach(angular.mock.inject(function(calMoment, calendarExploredPeriodService) {
    self.calendarExploredPeriodService = calendarExploredPeriodService;
    self.calMoment = calMoment;
    self.aPeriod = buildPeriod(1, 15);
  }));

  describe('the reset function', function() {

    it('should remove all registeredExploredPeriod in the calendar of the given id', function() {
      self.calendarExploredPeriodService.registerExploredPeriod('calendarId', self.aPeriod);
      self.calendarExploredPeriodService.registerExploredPeriod('calendarId2', self.aPeriod);
      self.calendarExploredPeriodService.reset('calendarId');
      expect(self.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calendarId', self.aPeriod).map(periodToComparablePeriod)).to.deep.equals([self.aPeriod].map(periodToComparablePeriod));
      expect(self.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calendarId2', self.aPeriod).map(periodToComparablePeriod)).to.deep.equals([]);
    });

    it('should remove all egisteredExploredPeriod in all the calendar if no given id', function() {
      self.calendarExploredPeriodService.registerExploredPeriod('calendarId', self.aPeriod);
      self.calendarExploredPeriodService.registerExploredPeriod('calendarId2', self.aPeriod);
      self.calendarExploredPeriodService.reset();
      expect(self.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calendarId', self.aPeriod).map(periodToComparablePeriod)).to.deep.equals([self.aPeriod].map(periodToComparablePeriod));
      expect(self.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calendarId2', self.aPeriod).map(periodToComparablePeriod)).to.deep.equals([self.aPeriod].map(periodToComparablePeriod));
    });
  });

  describe('the regiserExploredPeriod', function() {

    it('should save a explored period in his calendar', function() {
      self.calendarExploredPeriodService.registerExploredPeriod('calId', self.aPeriod);
      expect(self.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calId', self.aPeriod)).to.deep.equals([]);
      expect(self.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calId2', self.aPeriod)).to.not.deep.equals();
    });

    it('should groups adjudent period', function() {
      self.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(1, 2));
      self.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(3, 4));
      self.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(5, 6));
      expect(self.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calId', buildPeriod(1, 6))).to.deep.equals([]);
    });

    it('should not groups non adjacent period', function() {
      self.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(1, 2));
      self.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(4, 5));
      expect(self.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calId', buildPeriod(1, 4))).to.not.deep.equals([]);
    });

    it('should remove periods included by a bigger one', function() {
      self.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(1, 2));
      self.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(4, 5));
      self.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(1, 5));
      expect(self.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calId', buildPeriod(1, 5))).to.deep.equals([]);
    });

    it('should remove periods included by a bigger one and groups resulting adjacent period', function() {
      self.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(1, 2));
      self.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(4, 5));
      self.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(6, 7));
      self.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(1, 5));
      expect(self.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calId', buildPeriod(1, 7))).to.deep.equals([]);
    });
  });

  describe('the getUnexploredPeriodsInPeriod', function() {
    it('should return the full period if non of it has been explored', function() {
      expect(self.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calId', self.aPeriod).map(periodToComparablePeriod)).to.deep.equals([self.aPeriod].map(periodToComparablePeriod));
    });

    it('should return nothing if the period already has been explored', function() {
      self.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(1, 4));
      expect(self.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calId', buildPeriod(2, 3))).to.deep.equals([]);
    });

    it('should return only non explored part of a period that has been partially explored', function() {
      self.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(3, 4));
      self.calendarExploredPeriodService.registerExploredPeriod('calId', buildPeriod(6, 7));

      var result = self.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calId', buildPeriod(1, 9));

      expect(result.map(periodToComparablePeriod)).to.deep.equals([buildPeriod(1, 2), buildPeriod(5, 5), buildPeriod(8, 9)].map(periodToComparablePeriod));

      result = self.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calId', buildPeriod(1, 3));
      expect(result.map(periodToComparablePeriod)).to.deep.equals([buildPeriod(1, 2)].map(periodToComparablePeriod));

      result = self.calendarExploredPeriodService.getUnexploredPeriodsInPeriod('calId', buildPeriod(6, 10));
      expect(result.map(periodToComparablePeriod)).to.deep.equals([buildPeriod(8, 10)].map(periodToComparablePeriod));
    });
  });
});
