'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The event-date-edition component', function() {

  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('esn.calendar');

    this.getNewStartDate = sinon.spy();
    this.getNewEndDate = sinon.spy();

    var self = this;
    angular.mock.module(function($provide) {
      $provide.value('calendarUtils', {
        getNewStartDate: self.getNewStartDate,
        getNewEndDate: self.getNewEndDate
      });
    });
  });

  describe('eventDateEdition directive', function() {
    beforeEach(angular.mock.inject(function($rootScope, $compile, moment) {
      this.$rootScope = $rootScope;
      this.$scope = this.$rootScope.$new();
      this.moment = moment;
      this.$compile = $compile;

      this.initDirective = function(scope) {
        var html = '<event-date-edition event="event"/>';
        var element = this.$compile(html)(scope);
        scope.$digest();
        this.eleScope = element.isolateScope();
        return element;
      };
    }));

    it('should compute diff of start date and end date onload', function() {
      this.$scope.event = {
        start: this.moment('2013-02-08 09:30'),
        end: this.moment('2013-02-08 10:30')
      };
      this.initDirective(this.$scope);
      expect(this.$scope.event.diff).to.deep.equal(3600000);
    });

    describe('scope.resetToDefaultDate', function() {
      it('should reset date if scope.event.allDay is true on load', function() {
        this.$scope.event = {
          start: this.moment('2013-02-08 09:30'),
          end: this.moment('2013-02-08 10:30'),
          allDay: true
        };
        this.initDirective(this.$scope);
        this.eleScope.resetToDefaultDate();
        expect(this.getNewStartDate).to.have.been.called;
        expect(this.getNewEndDate).to.have.been.called;
      });

      it('should not reset date if scope.event.allDay is false on load', function() {
        this.$scope.event = {
          start: this.moment('2013-02-08 09:30'),
          end: this.moment('2013-02-08 10:30'),
          allDay: false
        };
        this.initDirective(this.$scope);
        this.eleScope.resetToDefaultDate();
        expect(this.getNewStartDate).to.have.not.been.called;
        expect(this.getNewEndDate).to.have.not.been.called;
      });

      it('should reset date only once', function() {
        this.$scope.event = {
          start: this.moment('2013-02-08 09:30'),
          end: this.moment('2013-02-08 10:30'),
          allDay: true
        };
        this.initDirective(this.$scope);
        this.eleScope.resetToDefaultDate();
        this.eleScope.resetToDefaultDate();
        expect(this.getNewStartDate).to.have.been.calledOnce;
        expect(this.getNewEndDate).to.have.been.calledOnce;
      });
    });

    describe('scope.getMinDate', function() {
      it('should return null if start is undefined', function() {
        this.$scope.event = {};
        this.initDirective(this.$scope);
        expect(this.eleScope.getMinDate()).to.be.null;
      });

      it('should return start minus 1 day', function() {
        this.$scope.event = {
          start: this.moment('2013-02-08 09:30'),
          end: this.moment('2013-02-08 10:30')
        };
        this.initDirective(this.$scope);
        this.$scope.$digest();
        var isSame = this.moment('2013-02-07 09:30').isSame(this.eleScope.getMinDate());
        expect(isSame).to.be.true;
      });
    });

    describe('scope.getMinTime', function() {
      it('should return null if start is undefined', function() {
        this.$scope.event = {};
        this.initDirective(this.$scope);
        expect(this.eleScope.getMinTime()).to.be.null;
      });

      it('should return null if start is not same day than end', function() {
        this.$scope.event = {
          start: this.moment('2013-02-08 09:30'),
          end: this.moment('2013-02-09 10:30')
        };
        this.initDirective(this.$scope);
        expect(this.eleScope.getMinTime()).to.be.null;
      });

      it('should return start', function() {
        this.$scope.event = {
          start: this.moment('2013-02-08 09:30'),
          end: this.moment('2013-02-08 10:30')
        };
        this.initDirective(this.$scope);
        var isSame = this.moment('2013-02-08 09:30').isSame(this.eleScope.getMinTime());
        expect(isSame).to.be.true;
      });
    });

    describe('scope.onStartDateChange', function() {
      it('should set end to start plus the previous stored diff', function() {
        this.$scope.event = {
          start: this.moment('2013-02-08 09:30'),
          end: this.moment('2013-02-08 10:30')
        };
        this.initDirective(this.$scope);
        this.$scope.event.diff = 3600 * 1000 * 2; // 2 hours
        this.eleScope.onStartDateChange();
        var isSame = this.moment('2013-02-08 11:30').isSame(this.$scope.event.end);
        expect(isSame).to.be.true;
      });
    });

    describe('scope.onEndDateChange', function() {
      it('should compute diff between start and end', function() {
        this.$scope.event = {
          start: this.moment('2013-02-08 09:30'),
          end: this.moment('2013-02-08 13:30')
        };
        this.initDirective(this.$scope);
        this.eleScope.onEndDateChange();
        expect(this.$scope.event.diff).to.equal(3600 * 1000 * 4);
      });

      it('should set end to start plus 1 hour if end is before start', function() {
        this.$scope.event = {
          start: this.moment('2013-02-08 09:30'),
          end: this.moment('2013-02-07 13:30')
        };
        this.initDirective(this.$scope);
        this.eleScope.onEndDateChange();
        var isSame = this.moment('2013-02-08 10:30').isSame(this.$scope.event.end);
        expect(isSame).to.be.true;
      });
    });
  });

  describe('The friendlifyEndDate directive', function() {

    beforeEach(inject(['$compile', '$rootScope', 'moment', function($c, $r, moment) {
      this.$compile = $c;
      this.$rootScope = $r;
      this.$scope = this.$rootScope.$new();
      this.moment = moment;

      this.initDirective = function(scope) {
        var html = '<input ng-model="event.end" friendlify-end-date/>';
        var element = this.$compile(html)(scope);
        scope.$digest();
        return element;
      };
    }]));

    it('should have a first formatters that output the date -1 day if event is a allday', function() {
      this.$scope.event = {
        allDay: true,
        end: this.moment('2015-07-03')
      };
      var element = this.initDirective(this.$scope);
      var controller = element.controller('ngModel');
      expect(controller.$viewValue).to.deep.equal('2015/07/02');
    });

    it('should have a first formatters that do nothing if event is not allday', function() {
      this.$scope.event = {
        allDay: false
      };
      var element = this.initDirective(this.$scope);
      var formatter = element.controller('ngModel').$formatters[0];
      expect(formatter('2015/07/03')).to.deep.equal('2015/07/03');
    });

    it('should have a first formatters that do nothing if event is allday and event.start is same day than event.end', function() {
      this.$scope.event = {
        allDay: true,
        start: this.moment('2015-07-03'),
        end: this.moment('2015-07-03')
      };
      var element = this.initDirective(this.$scope);
      var formatter = element.controller('ngModel').$formatters[0];
      expect(formatter('2015/07/03')).to.deep.equal('2015/07/03');
    });

    it('should have a last parsers that add 1 day if event is allday', function() {
      this.$scope.event = {
        allDay: true
      };
      var element = this.initDirective(this.$scope);
      var parser = element.controller('ngModel').$parsers[0];
      expect(parser(this.moment('2015/07/03')).format('YYYY/MM/DD')).to.deep.equal(this.moment('2015/07/04').format('YYYY/MM/DD'));
    });

    it('should have a last parsers that do nothing if event is not allday', function() {
      this.$scope.event = {
        allDay: false
      };
      var element = this.initDirective(this.$scope);
      var parser = element.controller('ngModel').$parsers[0];
      expect(parser(this.moment('2015/07/03')).format('YYYY/MM/DD')).to.deep.equal(this.moment('2015/07/03').format('YYYY/MM/DD'));
    });
  });

});
