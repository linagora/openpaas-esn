'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The datepicker utils module', function() {
  var self = this;

  beforeEach(function() {
    angular.mock.module('esn.datepickerUtils');
  });

  describe('the module config', function() {

    beforeEach(function() {
      self.bsDatepickerMobileWrapperMock = sinon.spy();
      angular.mock.module(function($provide) {
        $provide.value('bsDatepickerMobileWrapper', self.bsDatepickerMobileWrapperMock);
      });
    });

    beforeEach(inject(function(bsDatepickerDirective, clockpickerDefaultOptions) {
      self.bsDatepickerDirective = bsDatepickerDirective;
      self.clockpickerDefaultOptions = clockpickerDefaultOptions;
    }));

    it('should decorate clockpickerDefaultOptions to add nativeOnMobile', function() {
      expect(self.clockpickerDefaultOptions.nativeOnMobile).to.be.true;
    });

    it('should decorate bsDatepicker directive', function() {
      expect(self.bsDatepickerMobileWrapperMock).to.have.been.calledWith(self.bsDatepickerDirective[0]);
    });
  });

  describe('getRequiredController', function() {

    beforeEach(inject(function(getRequiredController) {
      self.getRequiredController = getRequiredController;
    }));

    it('should fail if require is not a array but is not the expected controller', function() {
      expect(self.getRequiredController.bind(null, 'controllerName', {}, {require: 'badRequire'})).to.throw(Error);
    });

    it('should fail if require is a array that does not contains the expected controller', function() {
      expect(self.getRequiredController.bind(null, 'controllerName', [{}], {require: ['badRequire']})).to.throw(Error);
    });

    it('should return given controller if require is a string and correct', function() {
      var controller = {};
      expect(self.getRequiredController('controllerName', controller, {require: 'controllerName' })).to.equal(controller);
    });

    it('should return given controller if require and controller are array that contain expected require', function() {
      var controller = {};
      var controllers = [{}, controller, {}];
      var directive = {require: ['toto', 'controllerName', '']};
      expect(self.getRequiredController('controllerName', controllers, directive)).to.equal(controller);
    });

  });

  describe('bsDatepickerMobileWrapper factory', function() {
    beforeEach(function() {
      self.mobile = true;

      self.detectUtilsMock = {
        isMobile: sinon.spy(function() {
          return self.mobile;
        })
      };

      var link = sinon.spy();

      self.rawDirective = {
        require: 'ngModel',
        link: link,
        compile: sinon.stub().returns(link)
      };

      self.scope = {};

      self.element = {
        attr: sinon.spy()
      };

      self.attr = {
        $observe: sinon.spy()
      };

      self.ngModelControllerMock = {
        $formatters: [42],
        $parsers: [42]
      };

      self.getRequiredControllerMock = sinon.stub().returns(self.ngModelControllerMock);

      angular.mock.module(function($provide) {
        $provide.value('detectUtils', self.detectUtilsMock);
        $provide.value('getRequiredController', self.getRequiredControllerMock);
      });

      self.wrapDirective = function() {
        self.bsDatepickerMobileWrapper(self.rawDirective);
        self.link = self.rawDirective.compile();
        self.link(self.scope, self.element, self.attr, self.ngModelControllerMock);
      };
    });

    beforeEach(inject(function(bsDatepickerMobileWrapper, moment) {
      self.bsDatepickerMobileWrapper = bsDatepickerMobileWrapper;
      self.wrapDirective();
      self.moment = moment;
    }));

    it('should call getRequiredController to get the ngModelController', function() {
      self.wrapDirective();
      expect(self.getRequiredControllerMock).to.have.been.calledWith('ngModel', self.ngModelControllerMock, self.rawDirective);
    });

    it('should call original link if not on mobile phone', function() {
      self.mobile = false;
      self.wrapDirective();
      expect(self.detectUtilsMock.isMobile).to.have.beenCalledTwice;
      expect(self.rawDirective.link).to.have.been.calledWith(self.scope, self.element, self.attr, self.ngModelControllerMock);
    });

    it('should set a min and max value on mobile to avoid lag on chrome in android 5', function() {
      expect(self.element.attr).to.have.been.calledWith('min', '1800-01-01');
      expect(self.element.attr).to.have.been.calledWith('max', '3000-01-01');
    });

    it('should not set a min and max value on desktop', function() {
      self.mobile = false;
      self.element.attr.reset();
      self.wrapDirective();
      expect(self.element.attr).to.not.have.been.calledWith('min', '1800-01-01');
      expect(self.element.attr).to.not.have.been.calledWith('max', '3000-01-01');
    });

    it('should not call original link if on mobile phone', function() {
      expect(self.detectUtilsMock.isMobile).to.have.beenCalledOnce;
      expect(self.rawDirective.link).to.have.not.been.called;
    });

    it('should set element type to date only on mobile', function() {
      expect(self.element.attr).to.have.been.calledWith('type', 'date');
      self.mobile = false;
      self.element.attr.reset();
      self.wrapDirective();
      expect(self.element.attr).to.have.not.been.calledWith('type', 'date');
    });

    it('should push a correct formatter in ngModel', function() {
      expect(self.ngModelControllerMock.$formatters).to.shallowDeepEqual({
        length: 2,
        0: 42
      });

      var formatter = self.ngModelControllerMock.$formatters[1];
      expect(formatter(self.moment('1991-10-03').toDate())).to.equal('1991-10-03');
    });

    it('should unshift a correct parser in ngModel', function() {
      expect(self.ngModelControllerMock.$parsers).to.shallowDeepEqual({
        length: 2,
        1: 42
      });
    });

    describe('unshift parser', function() {
      beforeEach(function() {
        self.parser = self.ngModelControllerMock.$parsers[0];
      });

      it('should parse a date correctly', function() {
        var strDate = '1991-10-03';
        var date = self.parser(strDate);
        expect(self.moment(date).format('YYYY-MM-DD')).to.equal(strDate);
      });

      it('should return a raw js date object', function() {
        expect(self.parser('1991-10-03') instanceof Date).to.be.true;
      });

      it('should keep hour of previous date if any', function() {
        self.ngModelControllerMock.$modelValue = self.moment('1941-09-15 12:42');
        var date = self.parser('2016-01-28');
        expect(self.moment(date).format('YYYY-MM-DD HH:mm')).to.equal('2016-01-28 12:42');
      });
    });

    it('should observe properly minDate an maxDate and transfer them to min and max', function() {
      self.element.attr.reset();
      [{
        sourceField: 'minDate',
        destField: 'min'
      }, {
        sourceField: 'maxDate',
        destField: 'max'
      }].forEach(function(o) {
        expect(self.attr.$observe).to.have.been.calledWith(o.sourceField, sinon.match(function(fn) {
          fn('');
          expect(self.element.attr).to.have.not.been.calledWith(o.destField);
          fn('1991-10-03 10:32');
          expect(self.element.attr).to.have.been.calledWith(o.destField, '1991-10-03');
          return true;
        }));
      }, this);
    });
  });
});
