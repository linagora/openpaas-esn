'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The event-date-edition component', function() {
  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('esn.calMoment');
    angular.mock.module('esn.calendar');
  });

  describe('eventDateEdition directive', function() {
    beforeEach(angular.mock.inject(function($rootScope, $compile, calMoment) {
      this.$rootScope = $rootScope;
      this.$scope = this.$rootScope.$new();
      this.calMoment = calMoment;
      this.$compile = $compile;

      this.initDirective = function(scope) {
        var html = '<event-date-edition event="event"></event-date-edition>';
        var element = this.$compile(html)(scope);

        scope.$digest();
        this.eleScope = element.isolateScope();

        return element;
      };
    }));

    it('should compute diff of start date and end date onload', function() {
      this.$scope.event = {
        start: this.calMoment('2013-02-08 09:30'),
        end: this.calMoment('2013-02-08 10:30')
      };
      this.initDirective(this.$scope);
      expect(this.eleScope.vm.diff).to.deep.equal(3600000);
    });

    it('should clone event start and end on input blur', function() {
      this.$scope.event = {
        start: this.calMoment('2016-02-16 17:30'),
        end: this.calMoment('2016-02-16 18:30')
      };
      var element = this.initDirective(this.$scope);
      var startBeforeBlur = this.$scope.event.start;
      var endBeforeBlur = this.$scope.event.end;
      var input = element.find('input');

      input.blur();
      expect(this.$scope.event.start).to.not.equal(startBeforeBlur);
      expect(this.$scope.event.end).to.not.equal(endBeforeBlur);
      expect(this.$scope.event.start.isSame(startBeforeBlur)).to.be.true;
      expect(this.$scope.event.end.isSame(endBeforeBlur)).to.be.true;
    });

    describe('scope.setEventDates', function() {
      it('should stripTime scope.event.allDay is true and add a day', function() {
        this.$scope.event = {
          start: this.calMoment('2013-02-08 09:30'),
          end: this.calMoment('2013-02-08 10:30'),
          allDay: true
        };
        this.initDirective(this.$scope);
        this.eleScope.vm.setEventDates();

        expect(this.$scope.event.start.format('YYYY-MM-DD')).to.equal('2013-02-08');
        expect(this.$scope.event.start.hasTime()).to.be.false;

        expect(this.$scope.event.end.format('YYYY-MM-DD')).to.equal('2013-02-09');
        expect(this.$scope.event.end.hasTime()).to.be.false;
      });

      it('should set the time of start and end to next hour and set back utc flag to false', function() {
        this.$scope.event = {
          start: this.calMoment('2013-02-08 09:30').stripTime(),
          end: this.calMoment('2013-02-09 10:30').stripTime(),
          allDay: false
        };
        this.initDirective(this.$scope);
        this.eleScope.vm.setEventDates();

        expect(this.$scope.event.start.hasTime()).to.be.true;
        expect(this.$scope.event.end.hasTime()).to.be.true;
        expect(this.$scope.event.start._isUTC).to.be.false;
        expect(this.$scope.event.end._isUTC).to.be.false;

        var nextHour = this.calMoment().startOf('hour').add(1, 'hour');
        var nextHourEnd = nextHour.clone().add(1, 'hour');
        var fmt = 'HH:mm:ss.SSS';

        expect(this.$scope.event.start.format(fmt)).to.equal(nextHour.format(fmt));
        expect(this.$scope.event.end.format(fmt)).to.equal(nextHourEnd.format(fmt));
      });

      it('should set the time of start to next hour and end to next hour+1 if same day', function() {
        this.$scope.event = {
          start: this.calMoment('2013-02-08 09:30'),
          end: this.calMoment('2013-02-08 10:30'),
          allDay: false
        };
        this.initDirective(this.$scope);
        this.eleScope.vm.setEventDates();
        var nextHour = this.calMoment().endOf('hour').add(1, 'seconds');

        expect(this.$scope.event.start.time().seconds())
          .to.deep.equal(nextHour.time().seconds());
        expect(this.$scope.event.end.time().seconds())
          .to.deep.equal(nextHour.add(1, 'hour').time().seconds());
      });

      it('should remember the time when switching to and from allday', function() {
        var HOUR = 60 * 60 * 1000;
        var origStart = this.calMoment('2013-02-08 09:30');
        var origEnd = this.calMoment('2013-02-08 10:30');

        this.$scope.event = {
          start: origStart.clone(),
          end: origEnd.clone(),
          allDay: false
        };
        this.initDirective(this.$scope);
        this.$scope.$digest();

        expect(this.$scope.event.start.format('YYYY-MM-DD HH:mm:ss')).to.equal('2013-02-08 09:30:00');
        expect(this.$scope.event.start.hasTime()).to.be.true;
        expect(this.$scope.event.end.format('YYYY-MM-DD HH:mm:ss')).to.equal('2013-02-08 10:30:00');
        expect(this.$scope.event.end.hasTime()).to.be.true;
        expect(this.eleScope.vm.diff).to.equal(1 * HOUR);

        this.eleScope.vm.allDay = true;
        this.$scope.$digest();
        this.eleScope.vm.setEventDates();

        expect(this.$scope.event.start.format('YYYY-MM-DD')).to.equal('2013-02-08');
        expect(this.$scope.event.start.hasTime()).to.be.false;
        expect(this.$scope.event.end.format('YYYY-MM-DD')).to.equal('2013-02-09');
        expect(this.$scope.event.end.hasTime()).to.be.false;
        expect(this.eleScope.vm.diff).to.equal(24 * HOUR);

        this.eleScope.vm.allDay = false;
        this.$scope.$digest();
        this.eleScope.vm.setEventDates();

        expect(this.$scope.event.start.format('YYYY-MM-DD HH:mm:ss')).to.equal('2013-02-08 09:30:00');
        expect(this.$scope.event.start.hasTime()).to.be.true;
        expect(this.$scope.event.end.format('YYYY-MM-DD HH:mm:ss')).to.equal('2013-02-08 10:30:00');
        expect(this.$scope.event.end.hasTime()).to.be.true;
        expect(this.eleScope.vm.diff).to.equal(1 * HOUR);
      });
    });

    describe('scope.getMinDate', function() {
      it('should return null if start is undefined', function() {
        this.$scope.event = {};
        this.initDirective(this.$scope);
        expect(this.eleScope.vm.getMinDate()).to.be.null;
      });

      it('should return start minus 1 day', function() {
        this.$scope.event = {
          start: this.calMoment('2013-02-08 09:30'),
          end: this.calMoment('2013-02-08 10:30'),
          allDay: true
        };
        this.initDirective(this.$scope);
        this.$scope.$digest();
        expect(this.eleScope.vm.getMinDate()).to.equal('2013-02-07');
      });
    });

    describe('scope.onStartDateChange', function() {
      it('should set end to start plus the previous stored diff', function() {
        this.$scope.event = {
          start: this.calMoment('2013-02-08 09:30'),
          end: this.calMoment('2013-02-08 10:30')
        };
        this.initDirective(this.$scope);
        this.eleScope.vm.diff = 3600 * 1000 * 2; // 2 hours
        this.eleScope.vm.onStartDateChange();
        var isSame = this.calMoment('2013-02-08 11:30').isSame(this.$scope.event.end);

        expect(isSame).to.be.true;
      });

      describe('comportment for null date and invalid date', function() {
        /* global moment: false */

        beforeEach(function() {
          moment.suppressDeprecationWarnings = true;
        });

        it('should ignore null date and invalid date', function() {
          var end = this.calMoment('2013-02-08 13:30');

          this.$scope.event = {
            start: this.calMoment('2013-02-08 09:30'),
            end: end.clone()
          };
          this.initDirective(this.$scope);
          [null, this.calMoment('invalid date')].forEach(function(date) {
            this.$scope.event.start = date;
            this.eleScope.vm.onStartDateChange();
            var isSame = end.isSame(this.$scope.event.end);

            expect(isSame).to.be.true;
          }, this);
        });

        afterEach(function() {
          moment.suppressDeprecationWarnings = false;
        });
      });
    });

    describe('scope.onEndDateChange', function() {
      it('should compute diff between start and end', function() {
        this.$scope.event = {
          start: this.calMoment('2013-02-08 09:30'),
          end: this.calMoment('2013-02-08 13:30')
        };
        this.initDirective(this.$scope);
        this.eleScope.vm.onEndDateChange();
        expect(this.eleScope.vm.diff).to.equal(3600 * 1000 * 4);
      });

      it('should set end to start plus 1 hour if end is before start', function() {
        this.$scope.event = {
          start: this.calMoment('2013-02-08 09:30'),
          end: this.calMoment('2013-02-07 13:30')
        };
        this.initDirective(this.$scope);
        this.eleScope.vm.onEndDateChange();
        var isSame = this.calMoment('2013-02-08 10:30').isSame(this.$scope.event.end);

        expect(isSame).to.be.true;
      });

      it('should ignore null date and invalid date', function() {
        var start = this.calMoment('2013-02-07 13:30');

        this.$scope.event = {
          end: this.calMoment('2013-02-08 09:30'),
          start: start.clone()
        };
        this.initDirective(this.$scope);
        [null, this.calMoment('invalid date')].forEach(function(date) {
          this.$scope.event.end = date;
          this.eleScope.vm.onEndDateChange();
          var isSame = start.isSame(this.$scope.event.start);

          expect(isSame).to.be.true;
        }, this);
      });
    });
  });

  describe('The calDateToMoment directive', function() {

    beforeEach(inject(['$compile', '$rootScope', 'calMoment', function($c, $r, calMoment) {
      this.$compile = $c;
      this.$rootScope = $r;
      this.$scope = this.$rootScope.$new();
      this.calMoment = calMoment;

      this.initDirective = function(scope) {
        var html = '<input ng-model="event.end" data-is-all-day="event.allDay" cal-date-to-moment/>';
        var element = this.$compile(html)(scope);

        scope.$digest();

        return element;
      };
    }]));

    it('should return a calMoment Date if event is allday', function() {
      this.$scope.event = {
        allDay: true
      };
      var element = this.initDirective(this.$scope);
      var parser = element.controller('ngModel').$parsers[0];

      expect(parser('2015-07-03 10:30').hasTime()).to.be.false;
    });

    it('should return a calMoment DateTime if event is not allday', function() {
      this.$scope.event = {
        allDay: false
      };
      var element = this.initDirective(this.$scope);
      var parser = element.controller('ngModel').$parsers[0];

      expect(parser('2015-07-03 10:30').hasTime()).to.be.true;
    });

    describe('comportment for invalid date', function() {
      /* global moment: false */

      beforeEach(function() {
        moment.suppressDeprecationWarnings = true;
      });

      it('should return undefined for invalid date', function() {
        this.$scope.event = {
          allDay: false
        };
        var element = this.initDirective(this.$scope);
        var parser = element.controller('ngModel').$parsers[0];

        expect(parser('this is a bad date')).to.be.undefined;
      });

      afterEach(function() {
        moment.suppressDeprecationWarnings = false;
      });
    });
  });

});
