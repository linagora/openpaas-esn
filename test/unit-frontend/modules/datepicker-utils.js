'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The datepicker utils module', function() {
  var self;

  beforeEach(function() {
    self = this;
    angular.mock.module('esn.datepickerUtils');
  });

  describe('the module config', function() {

    beforeEach(function() {
      this.bsDatepickerMobileWrapperMock = sinon.spy();
      angular.mock.module(function($provide) {
        $provide.value('bsDatepickerMobileWrapper', self.bsDatepickerMobileWrapperMock);
      });
    });

    beforeEach(inject(function(bsDatepickerDirective, clockpickerDefaultOptions) {
      self.bsDatepickerDirective = bsDatepickerDirective;
      self.clockpickerDefaultOptions = clockpickerDefaultOptions;
    }));

    it('should decorate clockpickerDefaultOptions to add nativeOnMobile', function() {
      expect(this.clockpickerDefaultOptions.nativeOnMobile).to.be.true;
    });

    it('should decorate bsDatepicker directive', function() {
      expect(this.bsDatepickerMobileWrapperMock).to.have.been.calledWith(this.bsDatepickerDirective[0]);
    });
  });

  describe('bsDatepickerMobileWrapper factory', function() {
    beforeEach(function() {
      this.mobile = true;

      this.detectUtilsMock = {
        isMobile: sinon.spy(function() {
          return self.mobile;
        })
      };

      this.rawDirective = {
        require: 'ngModel',
        link: sinon.spy()
      };

      this.scope = {};

      this.element = {
        attr: sinon.spy()
      };

      this.attr = {
        $observe: sinon.spy()
      };

      this.ngModelControllerMock = {
        $formatters: [42],
        $parsers: [42]
      };

      angular.mock.module(function($provide) {
        $provide.value('detectUtils', self.detectUtilsMock);
      });

      this.wrapDirective = function() {
        this.bsDatepickerMobileWrapper(this.rawDirective);
        this.link = this.rawDirective.compile();
        this.link(this.scope, this.element, this.attr, this.ngModelControllerMock);
      };
    });

    beforeEach(inject(function(bsDatepickerMobileWrapper, moment) {
      self.bsDatepickerMobileWrapper = bsDatepickerMobileWrapper;
      self.wrapDirective();
      self.moment = moment;
    }));

    it('should call original link if not on mobile phone', function() {
      this.mobile = false;
      this.wrapDirective();
      expect(this.detectUtilsMock.isMobile).to.have.beenCalledTwice;
      expect(this.rawDirective.link).to.have.been.calledWith(this.scope, this.element, this.attr, this.ngModelControllerMock);
    });

    it('should not call original link if on mobile phone', function() {
      expect(this.detectUtilsMock.isMobile).to.have.beenCalledOnce;
      expect(this.rawDirective.link).to.have.not.been.called;
    });

    it('should set element type to date only on mobile', function() {
      expect(this.element.attr).to.have.been.calledWith('type', 'date');
      this.mobile = false;
      this.element.attr.reset();
      this.wrapDirective();
      expect(this.element.attr).to.have.not.been.calledWith('type', 'date');
    });

    it('should push a correct formatter in ngModel', function() {
      expect(this.ngModelControllerMock.$formatters).to.shallowDeepEqual({
        length: 2,
        0: 42
      });

      var formatter = this.ngModelControllerMock.$formatters[1];
      expect(formatter(this.moment('1991-10-03').toDate())).to.equal('1991-10-03');
    });

    it('should unshift a correct parser in ngModel', function() {
      expect(this.ngModelControllerMock.$parsers).to.shallowDeepEqual({
        length: 2,
        1: 42
      });
    });

    describe('unshift parser', function() {
      beforeEach(function() {
        this.parser = this.ngModelControllerMock.$parsers[0];
      });

      it('should parse a date correctly', function() {
        var strDate = '1991-10-03';
        var date = this.parser(strDate);
        expect(this.moment(date).format('YYYY-MM-DD')).to.equal(strDate);
      });

      it('should return a raw js date object', function() {
        expect(this.parser('1991-10-03') instanceof Date).to.be.true;
      });

      it('should keep hour of previous date if any', function() {
        this.ngModelControllerMock.$modelValue = this.moment('1941-09-15 12:42');
        var date = this.parser('2016-01-28');
        expect(this.moment(date).format('YYYY-MM-DD HH:mm')).to.equal('2016-01-28 12:42');
      });
    });

    it('should observe properly minDate an maxDate and transfer them to min and max', function() {
      [{
        sourceField: 'minDate',
        destField: 'min'
      }, {
        sourceField: 'maxDate',
        destField: 'max'
      }].forEach(function(o) {
        expect(this.attr.$observe).to.have.been.calledWith(o.sourceField, sinon.match(function(fn) {
          fn('');
          expect(self.element.attr).to.have.not.been.calledWith(o.destField);
          fn('1991-10-03 10:32');
          expect(self.element.attr).to.have.been.calledWith(o.destField, '1991-10-03');
          return true;
        }));
      }, this);
    });

    it('should work even if require contain other controller than ngModel', function() {
      this.rawDirective.require = ['sncfController', 'ngModel'];
      this.ngModelControllerMock = [null, this.ngModelControllerMock];
      this.wrapDirective();
      expect(this.ngModelControllerMock[1].$formatters.length).to.equal(3);
    });
  });
});
