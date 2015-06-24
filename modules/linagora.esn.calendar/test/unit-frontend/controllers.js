'use strict';

/* global chai: false */

var expect = chai.expect;

describe('The Calendar Angular module', function() {

  var newDate = 'newDate';
  var newEndDate = 'newEndDate';

  beforeEach(function() {

    var calendarUtilsMock = {
      getNewDate: function() {
        return newDate;
      },
      getNewEndDate: function() {
        return newEndDate;
      }
    };

    angular.mock.module('esn.calendar');
    angular.mock.module(function($provide) {
      $provide.value('calendarUtils', calendarUtilsMock);
    });
  });

  beforeEach(angular.mock.inject(function($controller, $rootScope) {
    this.rootScope = $rootScope;
    this.scope = $rootScope.$new();
    this.controller = $controller;
  }));

  describe('The eventFormController controller', function() {

    beforeEach(function() {
      this.eventFormController = this.controller('eventFormController', {
        $rootScope: this.rootScope,
        $scope: this.scope
      });
    });

    describe('initFormData function', function() {
      it('should initialize the scope with a default event if $scope.event does not exist', function() {
        this.eventFormController.initFormData();
        var expected = {
          startDate: newDate,
          endDate: newEndDate,
          allDay: false
        };
        expect(this.scope.editedEvent).to.deep.equal(expected);
        expect(this.scope.event).to.deep.equal(expected);
        expect(this.scope.modifyEventAction).to.be.false;
      });

      it('should initialize the scope with $scope.event if it exists', function() {
        this.scope.event = {
          _id: '123456',
          startDate: new Date(),
          endDate: new Date(),
          allDay: false,
          otherProperty: 'aString'
        };
        this.eventFormController.initFormData();
        expect(this.scope.editedEvent).to.deep.equal(this.scope.event);
        expect(this.scope.modifyEventAction).to.be.true;
      });
    });

    describe('modifyEvent function', function() {
      it('should display an error if the edited event has no title', function(done) {
        var $alertMock = function(alertObject) {
          expect(alertObject.show).to.be.true;
          expect(alertObject.content).to.equal('You must define an event title');
          done();
        };
        this.eventFormController = this.controller('eventFormController', {
          $rootScope: this.rootScope,
          $scope: this.scope,
          $alert: $alertMock
        });

        this.scope.editedEvent = {};
        this.eventFormController.modifyEvent();
      });

      it('should not send modify request if no change', function(done) {
        this.scope.createModal = {
          hide: function() {
            done();
          }
        };
        this.eventFormController = this.controller('eventFormController', {
          $rootScope: this.rootScope,
          $scope: this.scope
        });

        this.scope.event = {
          startDate: new Date(),
          endDate: new Date(),
          allDay: false,
          title: 'title'
        };
        this.scope.editedEvent = this.scope.event;
        this.eventFormController.modifyEvent();
      });
    });

    describe('addNewEvent function', function() {
      it('should display an error if the edited event has no title', function(done) {
        var $alertMock = function(alertObject) {
          expect(alertObject.show).to.be.true;
          expect(alertObject.content).to.equal('You must define an event title');
          done();
        };
        this.eventFormController = this.controller('eventFormController', {
          $rootScope: this.rootScope,
          $scope: this.scope,
          $alert: $alertMock
        });

        this.scope.editedEvent = {};
        this.eventFormController.addNewEvent();
      });
    });

  });
});
