'use strict';

/* global chai: false */
/* global sinon: false */

var expect = chai.expect;

describe('The event-quick-form Angular module directives', function() {
  beforeEach(function() {
    module('jadeTemplates');
    angular.mock.module('esn.calendar');
    this.eventUtilsMock = {};
    this.eventFormControllerMock = function($scope) {
      $scope.initFormData = function() {};
    };
    var self = this;

    angular.mock.module(function($provide, $controllerProvider) {
      $controllerProvider.register('eventFormController', self.eventFormControllerMock);
      $provide.value('eventUtils', self.eventUtilsMock);
    });
  });

  beforeEach(angular.mock.inject(function($timeout, $compile, $rootScope, fcMoment) {
    this.$timeout = $timeout;
    this.$compile = $compile;
    this.$rootScope = $rootScope;
    this.$scope = this.$rootScope.$new();
    this.fcMoment = fcMoment;

    this.$scope.editedEvent = {
      allDay: true,
      start: this.fcMoment('2013-02-08 12:30'),
      end: this.fcMoment('2013-02-08 13:30'),
      location: 'aLocation'
    };

    this.initDirective = function(scope) {
      var html = '<event-quick-form/>';
      var element = this.$compile(html)(scope);

      scope.$digest();

      return element;
    };
  }));

  it('should reset eventUtils events by calling resetStoredEvents on element $destroy', function(done) {
    this.eventUtilsMock.resetStoredEvents = function() {
      done();
    };
    var element = this.initDirective(this.$scope);

    element.remove();
  });

  it('should prevent default back behavior when modal is shown', function() {
    this.$scope.$hide = sinon.spy();
    this.initDirective(this.$scope);
    this.$scope.$isShown = true;
    var event = this.$scope.$broadcast('$locationChangeStart');

    expect(event.defaultPrevented).to.be.true;
    expect(this.$scope.$hide).to.have.been.calledOnce;
  });

  it('should not prevent default back behavior when modal is not shown', function() {
    this.initDirective(this.$scope);
    this.$scope.$isShown = false;
    var event = this.$scope.$broadcast('$locationChangeStart');

    expect(event.defaultPrevented).to.be.false;
  });

  it('should not prevent default back behavior when modal is undefined', function() {
    this.initDirective(this.$scope);
    var event = this.$scope.$broadcast('$locationChangeStart');

    expect(event.defaultPrevented).to.be.false;
  });

  it('should focus title on load', function(done) {
    var element = this.initDirective(this.$scope);

    element.find('.title')[0].focus = function() {
      done();
    };
    this.$timeout.flush();
  });
});
