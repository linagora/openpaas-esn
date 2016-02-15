'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The event-consult-form Angular module directives', function() {

  describe('the eventConsultForm directive', function() {
    beforeEach(function() {
      module('jadeTemplates');
      angular.mock.module('esn.calendar');
      this.headerServiceMock = {
        subHeader: {
          addInjection: function() {
          },
          resetInjections: function() {
          }
        }
      };
      this.eventFormControllerMock = function($scope) {
        $scope.initFormData = function() {
        };
      };

      var self = this;
      angular.mock.module(function($provide, $controllerProvider) {
        $controllerProvider.register('eventFormController', self.eventFormControllerMock);
        $provide.value('headerService', self.headerServiceMock);
      });
    });

    beforeEach(angular.mock.inject(function($compile, $rootScope, $window, fcMoment, CONSULT_FORM_TABS) {
      this.$compile = $compile;
      this.$rootScope = $rootScope;
      this.$scope = this.$rootScope.$new();
      this.fcMoment = fcMoment;
      this.$window = $window;
      this.TABS = CONSULT_FORM_TABS;

      this.$scope.event = {
        allDay: true,
        start: this.fcMoment('2013-02-08 12:30'),
        end: this.fcMoment('2013-02-08 13:30'),
        location: 'aLocation'
      };

      this.initDirective = function(scope) {
        var html = '<event-consult-form event="event"/>';
        var element = this.$compile(html)(scope);
        scope.$digest();
        return element;
      };
    }));

    it('should reset subheader injections on element $destroy', function(done) {
      this.headerServiceMock.subHeader.resetInjections = done;
      var element = this.initDirective(this.$scope);
      element.remove();
    });

    it('should call headerService to add a directive to the subheader', function(done) {
      this.headerServiceMock.subHeader.addInjection = function(directive) {
        expect(directive).to.equal('event-consult-form-subheader');
        done();
      };
      this.initDirective(this.$scope);
    });

    it('should initialize scope.selectedTab to MAIN', function() {
      var element = this.initDirective(this.$scope);
      expect(element.isolateScope().selectedTab).to.equal(this.TABS.MAIN);
    });
  });

  describe('the eventDateConsultation directive', function() {
    beforeEach(function() {
      module('jadeTemplates');
      angular.mock.module('esn.calendar');
    });

    beforeEach(angular.mock.inject(function($compile, $rootScope, fcMoment) {
      this.$compile = $compile;
      this.$rootScope = $rootScope;
      this.$scope = this.$rootScope.$new();
      this.fcMoment = fcMoment;

      this.initDirective = function(scope) {
        var html = '<event-date-consultation event="event"/>';
        var element = this.$compile(html)(scope);
        scope.$digest();
        return element.isolateScope();
      };
    }));

    describe('when scope.event.allday', function() {
      it('should set scope.start and scope.end to well formatted days of scope.event start and end (no hours nor minutes)', function() {
        this.$scope.event = {
          allDay: true,
          start: this.fcMoment('2013-02-08 12:30'),
          end: this.fcMoment('2013-02-08 13:30'),
          location: 'aLocation'
        };
        var isolateScope = this.initDirective(this.$scope);
        expect(isolateScope.start).to.equal(this.$scope.event.start.format('MMMM D'));
        expect(isolateScope.end).to.equal(this.$scope.event.end.format('MMMM D'));
      });
    });

    describe('when scope.event is not an all day event', function() {
      describe('when the event is within one day', function() {
        it('should set scope.start to formatted value of scope.event.start and scope.event to scope.event.edn hours & minutes', function() {
          this.$scope.event = {
            allDay: false,
            start: this.fcMoment('2013-02-08 12:30'),
            end: this.fcMoment('2013-02-08 13:30'),
            location: 'aLocation'
          };
          var isolateScope = this.initDirective(this.$scope);
          expect(isolateScope.start).to.equal(this.$scope.event.start.format('MMMM D hh:mma'));
          expect(isolateScope.end).to.equal(this.$scope.event.end.format('hh:mma'));
        });
      });

      describe('when the event is on more than one day', function() {
        it('should set scope.start to formatted value of scope.event.start and scope.event to scope.event.edn hours & minutes', function() {
          this.$scope.event = {
            allDay: false,
            start: this.fcMoment('2013-02-08 12:30'),
            end: this.fcMoment('2013-02-09 13:30'),
            location: 'aLocation'
          };
          var isolateScope = this.initDirective(this.$scope);
          expect(isolateScope.start).to.equal(this.$scope.event.start.format('MMMM D hh:mma'));
          expect(isolateScope.end).to.equal(this.$scope.event.end.format('MMMM D hh:mma'));
        });
      });
    });
  });

});
