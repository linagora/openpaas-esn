'use strict';

/*global chai:false*/
/*global sinon:false*/
/*global _:false*/

var expect = chai.expect;

describe('The CalEventMessageEditionController controller', function() {
  var self = this;

  beforeEach(function() {
    angular.mock.module('esn.calendar', 'linagora.esn.graceperiod', 'jadeTemplates');
    self.CalendarShellMock = {
      fromIncompleteShell: sinon.spy(_.identity)
    };

    self.calendarHomeId = 'MyCalendarHomeId';

    self.calendarUtilsMock = {
      getNewStartDate: sinon.spy(function() {
        return self.start;
      }),
      getNewEndDate: sinon.spy(function() {
        return self.end;
      })
    };

    self.calEventServiceMock = {
      createEvent: sinon.spy(function() {
        return self.$q.when({
          headers: function() {
            return self.responseHeaders;
          }
        });
      })
    };

    self.notificationFactoryMock = {
      weakError: sinon.spy()
    };

    self.calendarEventEmitterMock = {
      activitystream: {
        emitPostedMessage: sinon.spy()
      }
    };

    angular.mock.module(function($provide) {
      $provide.value('CalendarShell', self.CalendarShellMock);
      $provide.value('calendarUtils', self.calendarUtilsMock);
      $provide.value('calEventService', self.calEventServiceMock);
      $provide.value('notificationFactory', self.notificationFactoryMock);
      $provide.value('calendarEventEmitter', self.calendarEventEmitterMock);
      $provide.value('Cache', function() {});
    });
  });

  beforeEach(angular.mock.inject(function($controller, $rootScope, calMoment, CAL_EVENT_FORM, $q) {
    self.activitystream = {
      activity_stream: {
        uuid: 'uuid'
      }
    };

    self.$rootScope = $rootScope;
    self.$parentScope = $rootScope.$new();
    self.$parentScope.show = angular.noop;
    self.$scope = self.$parentScope.$new();
    self.calMoment = calMoment;
    self.CAL_EVENT_FORM = CAL_EVENT_FORM; self.start = calMoment('2015-08-17 08:00');
    self.end = calMoment('2015-08-17 09:00');
    self.initController = function() {
      return $controller('CalEventMessageEditionController', {
        $scope: self.$scope
      },
      {
        calendarHomeId: self.calendarHomeId,
        activitystream: self.activitystream
      });
    };
    self.$q = $q;
  }));

  afterEach(function() {
    self.$rootScope.$destroy();
  });

  describe('The $onInit function', function() {
    it('should init an empty event with CalendarShell', function() {
      var calendarShell = 'kitten';

      self.CalendarShellMock.fromIncompleteShell = sinon.stub().returns(calendarShell);

      var controller = self.initController();

      controller.$onInit();

      expect(self.calendarUtilsMock.getNewStartDate).to.have.been.calledOnce;
      expect(self.calendarUtilsMock.getNewEndDate).to.have.been.calledOnce;
      expect(self.CalendarShellMock.fromIncompleteShell).to.have.been.calledWith({
        start: self.start,
        end: self.end
      });

      expect(controller.event).to.equal(calendarShell);
    });
  });

  describe('The submit function', function() {
    var controller;

    beforeEach(function() {
      controller = self.initController();
      controller.$onInit();
    });

    it('should replace empty title by default title', function() {
      ['', undefined, null, '     '].forEach(function(title) {
        controller.event.title = title;
        controller.submit();

        expect(controller.event.title).to.equal(self.CAL_EVENT_FORM.title.default);
      }, this);
    });

    it('should not replace non title by default title', function() {
      var title = ' a title';

      controller.event.title = title;
      controller.submit();

      expect(controller.event.title).to.equal(title);
    });

    it('should call calEventService.createEvent with calendarHomeId', function() {
      controller.submit();

      expect(self.calEventServiceMock.createEvent).to.have.been.calledWith(self.calendarHomeId);
    });

    it('should give path to default calendars "/events"', function() {
      controller.submit();

      expect(self.calEventServiceMock.createEvent).to.have.been.calledWith(sinon.match.any, '/calendars/' + self.calendarHomeId + '/events');
    });

    it('should path the event and option that disable graceperiod', function() {
      controller.event = { title: 'telephon maison' };
      controller.submit();

      expect(self.calEventServiceMock.createEvent).to.have.been.calledWith(sinon.match.any, sinon.match.any, controller.event, { graceperiod: false });
    });

    it('should not call createEvent and display an error if no activity_stream.uuid', function() {
      [{ activity_stream: null }, { activity_stream: { uuid: null } }].forEach(function(activitystream) {
        self.$scope.displayError = sinon.spy();
        controller.activitystream = activitystream;
        controller.submit();

        expect(self.$scope.displayError).to.have.been.calledOnce;
        expect(self.calEventServiceMock.createEvent).to.have.not.been.called;
      }, this);
    });

    it('should set restActive to true only meanwhile calEventService.createEvent resolve', function() {
      expect(controller.restActive).to.be.false;

      var defer = self.$q.defer();

      self.calEventServiceMock.createEvent = _.constant(defer.promise);
      controller.submit();

      expect(controller.restActive).to.be.true;

      defer.resolve(null);
      self.$rootScope.$digest();

      expect(controller.restActive).to.be.false;
    });

    it('should call notificationFactory.weakError if calEventService.createEvent fail', function() {
      self.calEventServiceMock.createEvent = function() {
        return self.$q.reject({});
      };
      controller.submit();
      self.$rootScope.$digest();

      expect(self.notificationFactoryMock.weakError).to.have.been.called;
    });

    it('should call $parent.show if creating the event success', function() {
      self.$parentScope.show = sinon.spy();
      controller.submit();
      self.$rootScope.$digest();

      expect(self.$parentScope.show).to.have.been.calledWith('whatsup');
    });

    it('should reset event if creating the event success', function() {
      controller.event = { title: 'it will disapear' };
      controller.submit();
      self.$rootScope.$digest();

      expect(controller.event).to.deep.equal({
        start: self.start,
        end: self.end,
        diff: 1
      });
      expect(controller.rows).to.equal(1);
    });

    it('should call calendarEventEmitterMock if creating the event success', function() {
      controller.submit();
      self.$rootScope.$digest();

      expect(self.calendarEventEmitterMock.activitystream.emitPostedMessage).to.have.been.calledWith(self.responseHeaders, self.activitystream.activity_stream.uuid);
    });
  });

});
