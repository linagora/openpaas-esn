'use strict';

/* global chai: false */
/* global sinon: false */
/* global _: false */

var expect = chai.expect;

describe('The esn.clockpicker module', function() {

  var self;

  beforeEach(function() {
    angular.mock.module('esn.clockpicker');
    self = this;
  });

  describe('clockpicker-wrapper directive', function() {

    beforeEach(function() {
      this.directiveElement = {};
      this.isMobile = false;

      angular.mock.module(function($provide) {
        $provide.value('detectUtils', {
          isMobile: function() {
            return self.isMobile;
          }
        });

        $provide.decorator('clockpickerWrapperDirective', function($delegate) {
          var directive = $delegate[0];
          directive.compile = function() {
            return function() {
              self.directiveElement = arguments[1] = angular.extend(Object.create(arguments[1]), self.directiveElement, arguments[1]);
              return directive.link.apply(this, arguments);
            };
          };

          return $delegate;
        });
      });
    });

    beforeEach(angular.mock.inject(function($compile, $rootScope, moment, clockpickerDefaultOptions, clockpickerService) {
      this.$compile = $compile;
      this.$rootScope = $rootScope;
      this.$scope = this.$rootScope.$new();
      this.$scope.date = moment('1935-10-31 00:00');
      this.clockpickerDefaultOptions = clockpickerDefaultOptions;
      this.options = {};
      this.moment = moment;
      this.directiveElement.clockpicker = sinon.spy();
      this.clockpickerService = clockpickerService;

      this.initDirective = function() {
        var html = '<form name="form"><input ng-model="date" name="date" clockpicker-wrapper clockpicker-options=\'' + JSON.stringify(this.options) + '\'/></form>';
        this.formElement = this.$compile(html)(this.$scope);
        this.$scope.$digest();
        this.dateNgModel = this.$scope.form.date;
      };

      this.initDirective();
    }));

    it('should not make field read-only one non mobile device', function() {
      this.directiveElement.addClass = sinon.spy();
      this.directiveElement.attr = sinon.spy();
      this.initDirective();
      expect(this.directiveElement.addClass).to.not.have.been.called;
      expect(this.directiveElement.attr).to.not.have.been.called;
    });

    it('should make field read-only one mobile device', function() {
      this.isMobile = true;
      this.directiveElement.addClass = sinon.spy();
      this.directiveElement.attr = sinon.spy();
      this.initDirective();
      expect(this.directiveElement.addClass).to.have.been.calledWith('ignore-readonly');
      expect(this.directiveElement.attr).to.have.been.calledWith('readonly');
    });

    it('should not set css ignore-readonly one mobile phone if already readonly', function() {
      this.isMobile = true;
      this.directiveElement.addClass = sinon.spy();
      this.directiveElement.attr = sinon.spy();
      this.directiveElement.is = sinon.stub().returns(true);
      this.initDirective();
      expect(this.directiveElement.addClass).to.not.have.been.called;
      expect(this.directiveElement.attr).to.not.have.been.called;
      expect(this.directiveElement.is).to.have.been.calledWith('[readonly]');
    });

    it('should call clockpicker with default options if any are provided', function() {
      expect(this.directiveElement.clockpicker).to.have.been.calledWith(this.clockpickerDefaultOptions);
    });

    it('should merge given options with default options', function() {
      this.options = {
        twelvehour: false,
        autoclose: true
      };

      this.initDirective();
      expect(this.directiveElement.clockpicker).to.have.been.calledWith({
        twelvehour: false,
        autoclose: true,
        donetext: 'ok' });
    });

    it('should call clockpickerService.parseTime to set hour of model', function() {
      this.options = {
        twelvehour: 'true of false that is the question'
      };

      this.clockpickerService.parseTime = sinon.stub().returns({hour: 12, minute: 13});

      this.initDirective();

      var input = 'a user input';
      this.dateNgModel.$setViewValue(input);

      expect(this.clockpickerService.parseTime).to.have.been.calledWith(this.options.twelvehour, input);
      expect(this.$scope.date.format('HH:mm')).to.equal('12:13');
    });

    it('should call clockpickerService.parseTime to ensure validity of input', function() {
      this.options = {
        twelvehour: 'true of false that is the question'
      };

      this.clockpickerService.parseTime = sinon.stub().returns({hour: 12, minute: 13});

      this.initDirective();

      var input = 'valid input';
      this.dateNgModel.$setValidity = sinon.spy();
      this.dateNgModel.$setViewValue(input);

      expect(this.clockpickerService.parseTime).to.have.been.calledWith(this.options.twelvehour, input);
      expect(this.dateNgModel.$setValidity).to.have.been.calledWith('badFormat', true);

      input = 'invalid input';
      this.clockpickerService.parseTime.returns(undefined);
      this.dateNgModel.$setViewValue(input);
      expect(this.clockpickerService.parseTime).to.have.been.calledWith(this.options.twelvehour, input);
      expect(this.dateNgModel.$setValidity).to.have.been.calledWith('badFormat', false);
    });

    it('should not change date of ng-model input', function() {
      ['bad input', '12:00 PM'].forEach(function(input) {
        this.dateNgModel.$setViewValue(input);
        expect(this.$scope.date.format('YYYY-MM-DD')).to.equal('1935-10-31');
      }, this);
    });

    describe('the formatting of time', function() {
      it('should format time correctly in twelvehour mode', function() {
        var date = this.moment('1935-10-31 12:30');
        var formatedTime = 'time for british';

        var formatSpy = sinon.stub().returns(formatedTime);

        date.clone = _.wrap(date.clone, function(func) {
          var cloneDate = func.apply(date);
          cloneDate.local = _.wrap(cloneDate.local, function(func) {
            var formatDate = func.apply(cloneDate);
            formatDate.format = formatSpy;
            return formatDate;
          });
          return cloneDate;
        });

        this.$scope.$apply(function() {
          self.$scope.date = date;
        });

        expect(formatSpy).to.have.been.calledWith('hh:mm A');
        expect(this.dateNgModel.$viewValue).to.equal(formatedTime);
      });

      it('should format time correctly in 24 hour mode', function() {
        this.options = {
          twelvehour: false
        };

        this.initDirective();

        var date = this.moment('1935-10-31 12:30');
        var formatedTime = 'time for frenchies';
        var formatSpy = sinon.stub().returns(formatedTime);

        date.clone = _.wrap(date.clone, function(func) {
          var cloneDate = func.apply(date);
          cloneDate.local = _.wrap(cloneDate.local, function(func) {
            var localDate = func.apply(cloneDate);
            localDate.format = formatSpy;
            return localDate;
          });
          return cloneDate;
        });

        this.$scope.$apply(function() {
          self.$scope.date = date;
        });

        expect(formatSpy).to.have.been.calledWith('HH:mm');
        expect(this.dateNgModel.$viewValue).to.equal(formatedTime);
      });

      describe('formatters providden to ng-model', function() {
        it('should not reformat time while input is focused if time is the same', function() {
          var isSpy = this.directiveElement.is = sinon.stub().returns(true);
          var userTime = '1:1pm';
          this.dateNgModel.$setViewValue(userTime);
          expect(this.dateNgModel.$formatters[1](this.dateNgModel.$modelValue)).to.equal(userTime);
          expect(isSpy).to.have.been.calledWith(':focus');
        });

        it('should not reformat time while input is focused if value is not valid', function() {
          var isSpy = this.directiveElement.is = sinon.stub().returns(true);
          var userTime = 'invalid';
          this.dateNgModel.$setViewValue(userTime);
          expect(this.dateNgModel.$formatters[1](this.dateNgModel.$modelValue)).to.equal(userTime);
          expect(isSpy).to.have.been.calledWith(':focus');
        });

        it('should replace and format time while input is focused if time is not the same', function() {
          var isSpy = this.directiveElement.is = sinon.stub().returns(true);
          var userTime = '1:2pm';
          this.dateNgModel.$setViewValue(userTime);
          expect(this.dateNgModel.$formatters[1](this.moment('1935-10-31 13:01'))).to.equal('01:01 PM');
          expect(isSpy).to.have.been.calledWith(':focus');
        });

        it('should reformat time if input is not focused', function() {
          var isSpy = this.directiveElement.is = sinon.stub().returns(false);
          var userTime = '1:1pm';
          this.dateNgModel.$setViewValue(userTime);
          expect(this.dateNgModel.$formatters[1](this.dateNgModel.$modelValue)).to.equal('01:01 PM');
          expect(isSpy).to.have.been.calledWith(':focus');
        });
      });

      it('should reformat time properly on blur', function() {
        this.directiveElement.val('1:1pm');
        this.dateNgModel.$setViewValue('1:1pm');

        this.directiveElement.val = sinon.spy();
        this.directiveElement.blur();
        expect(this.directiveElement.val).to.have.been.calledWith('01:01 PM');
      });
    });

    it('should return a utc datetime if given initially a utc datetime', function() {
      this.$scope.date = this.moment.utc('2012-12-21 12:00');
      this.initDirective();
      var localDatePlusOne = this.$scope.date.clone().local();
      localDatePlusOne.hour(localDatePlusOne.hour() + 1);
      this.dateNgModel.$setViewValue(localDatePlusOne.format('hh:mm A'));
      expect(this.$scope.date.isUTC()).to.be.true;
      expect(this.$scope.date.format('HH:mm')).to.be.equal('13:00');
    });

    it('should return a local datetime if given initially a local datetime', function() {
      this.$scope.date = this.moment('2012-12-21 12:00');
      this.initDirective();
      this.dateNgModel.$setViewValue('4:00 PM');
      expect(this.$scope.date.isUTC()).to.be.false;
    });

  });

  describe('clockpickerService service', function() {

    beforeEach(angular.mock.inject(function(clockpickerService) {
      this.clockpickerService = clockpickerService;
    }));

    it('should correctly parse 12 hour format hours', function() {
      [{
        input: '12:00 AM',
        output: {
          minute: 0,
          hour: 0
        }
      }, {
        input: '12:42 PM',
        output: {
          minute: 42,
          hour: 12
        }
      }, {
        input: '1:42 AM',
        output: {
          minute: 42,
          hour: 1
        }
      }, {
        input: '10:05  PM',
        output: {
          hour: 22,
          minute: 5
        }
      }, {
        input: '1:4Am',
        output: {
          hour: 1,
          minute: 4
        }
      }, {
        input: '1:4pM',
        output: {
          hour: 13,
          minute: 4
        }
      }].forEach(function(obj) {
        expect(this.clockpickerService.parseTime(true, obj.input)).to.deep.equals(obj.output);
      }, this);
    });

    it('should not parse valid 24 hour format time when asking to parse twelve hour time', function() {
      ['00:00', '01:00', '23:00', '12:30'].forEach(function(date24) {
        expect(this.clockpickerService.parseTime(true, date24)).to.be.undefined;
      }, this);
    });

    it('should not parse invalid twelve hour time', function() {
      ['01:90 AM', '00:00 AM', '00:00 PM', '13:00 PM', '01:00 MM', '12:30', ':00', '00:', 'everybody as something to hide'].forEach(function(invalidDate) {
        expect(this.clockpickerService.parseTime(true, invalidDate)).to.be.undefined;
      }, this);
    });

    it('should not parse invalid 24 hour time', function() {
      ['00:00 AM', '25:00', '01:00 PM', '12:60', ':00', '00:', 'expect me and my monkey'].forEach(function(invalidDate) {
        expect(this.clockpickerService.parseTime(false, invalidDate)).to.be.undefined;
      }, this);
    });

    it('should correctly parse 24 hour format hours', function() {
      [{
        input: '00:00',
        output: {
          minute: 0,
          hour: 0
        }
      }, {
        input: '0:42',
        output: {
          minute: 42,
          hour: 0
        }
      }, {
        input: '22:05',
        output: {
          hour: 22,
          minute: 5
        }
      }, {
        input: '1:4',
        output: {
          hour: 1,
          minute: 4
        }
      }].forEach(function(obj) {
        expect(this.clockpickerService.parseTime(false, obj.input)).to.deep.equals(obj.output);
      }, this);
    });
  });
});
