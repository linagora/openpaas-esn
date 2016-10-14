'use strict';

/*global chai:false*/
/*global sinon:false*/
/*global _:false*/

var expect = chai.expect;

describe('The cal-event-message Angular module directives', function() {

  var self = this;

  beforeEach(function() {
    angular.mock.module('esn.calendar', 'linagora.esn.graceperiod', 'jadeTemplates');
  });

  describe('The calEventMessageEditionController', function() {
    beforeEach(function() {
      angular.mock.module('esn.calendar', 'linagora.esn.graceperiod');
      self.CalendarShellMock = {
        fromIncompleteShell: sinon.spy(_.identity)
      };

      self.calendarUtilsMock = {
        getNewStartDate: sinon.spy(function() {
          return self.start;
        }),
        getNewEndDate: sinon.spy(function() {
          return self.end;
        })
      };

      self.calendarServiceMock = {
        calendarHomeId: 'calendarHomeId'
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
        $provide.value('calendarService', self.calendarServiceMock);
        $provide.value('calEventService', self.calEventServiceMock);
        $provide.value('notificationFactory', self.notificationFactoryMock);
        $provide.value('calendarEventEmitter', self.calendarEventEmitterMock);
      });
    });

    beforeEach(angular.mock.inject(function($controller, $rootScope, calMoment, EVENT_FORM, $q) {
      self.activitystream = {
        activity_stream: {
          uuid: 'uuid'
        }
      };

      self.$rootScope = $rootScope;
      self.$parentScope = $rootScope.$new();

      self.$parentScope.activitystream = self.activitystream;
      self.$parentScope.show = angular.noop;
      self.$scope = self.$parentScope.$new();
      self.calMoment = calMoment;
      self.EVENT_FORM = EVENT_FORM; self.start = calMoment('2015-08-17 08:00');
      self.end = calMoment('2015-08-17 09:00');
      self.initController = function() {
        $controller('calEventMessageEditionController', { $scope: self.$scope });
      };
      self.$q = $q;
    }));

    afterEach(function() {
      self.$rootScope.$destroy();
    });

    it('should init an empty event with CalendarShell', function() {
      var calendarShell = 'kitten';

      self.CalendarShellMock.fromIncompleteShell = sinon.stub().returns(calendarShell);
      self.initController();

      expect(self.calendarUtilsMock.getNewStartDate).to.have.been.calledOnce;
      expect(self.calendarUtilsMock.getNewEndDate).to.have.been.calledOnce;

      expect(self.CalendarShellMock.fromIncompleteShell).to.have.been.calledWith({
        start: self.start,
        end: self.end
      });

      expect(self.$scope.event).to.equal(calendarShell);
    });

    describe('$scope.submit', function() {
      beforeEach(function() {
        self.initController();
      });

      it('should replace empty title by default title', function() {
        ['', undefined, null, '     '].forEach(function(title) {
          self.$scope.event.title = title;
          self.$scope.submit();
          expect(self.$scope.event.title).to.equal(self.EVENT_FORM.title.default);
        }, this);
      });

      it('should not replace non title by default title', function() {
        var title = ' a title';

        self.$scope.event.title = title;
        self.$scope.submit();
        expect(self.$scope.event.title).to.equal(title);
      });

      it('should call calEventService.createEvent with $scope.calendarHomeId if defined', function() {
        self.$scope.calendarHomeId = 'et';
        self.$scope.submit();
        expect(self.calEventServiceMock.createEvent).to.have.been.calledWith(self.$scope.calendarHomeId);
      });

      it('should call calEventService.createEvent with calendarService.calendarHomeId if $scope.calendarHomeId is not defined', function() {
        self.$scope.submit();
        expect(self.calEventServiceMock.createEvent).to.have.been.calledWith(self.calendarServiceMock.calendarHomeId);
      });

      it('should give path to default calendars "/events"', function() {
        self.$scope.submit();
        expect(self.calEventServiceMock.createEvent).to.have.been.calledWith(sinon.match.any, '/calendars/calendarHomeId/events');
      });

      it('should path the event and option that disable graceperiod', function() {
        self.$scope.event = { title: 'telephon maison' };
        self.$scope.submit();
        expect(self.calEventServiceMock.createEvent).to.have.been.calledWith(sinon.match.any, sinon.match.any, self.$scope.event, { graceperiod: false });
      });

      it('should not call createEvent and display an error if no activity_stream.uuid', function() {
        [{ activity_stream: null }, { activity_stream: { uuid: null } }].forEach(function(activitystream) {
          self.$scope.displayError = sinon.spy();
          self.$scope.activitystream = activitystream;
          self.$scope.submit();
          expect(self.$scope.displayError).to.have.been.calledOnce;
          expect(self.calEventServiceMock.createEvent).to.have.not.been.called;

        }, this);
      });

      it('should set $scope.restActive to true only meanwhile calEventService.createEvent resolve', function() {
        expect(self.$scope.restActive).to.be.false;

        var defer = self.$q.defer();

        self.calEventServiceMock.createEvent = _.constant(defer.promise);
        self.$scope.submit();
        expect(self.$scope.restActive).to.be.true;
        defer.resolve(null);
        self.$rootScope.$digest();
        expect(self.$scope.restActive).to.be.false;
      });

      it('should call notificationFactory.weakError if calEventService.createEvent fail', function() {
        self.calEventServiceMock.createEvent = function() {
          return self.$q.reject({});
        };
        self.$scope.submit();
        self.$rootScope.$digest();
        expect(self.notificationFactoryMock.weakError).to.have.been.called;
      });

      it('should call $parent.show if creating the event success', function() {
        self.$parentScope.show = sinon.spy();
        self.$scope.submit();
        self.$rootScope.$digest();
        expect(self.$parentScope.show).to.have.been.calledWith('whatsup');
      });

      it('should reset event if creating the event success', function() {
        self.$scope.event = { title: 'it will disapear' };
        self.$scope.submit();
        self.$rootScope.$digest();
        expect(self.$scope.event).to.deep.equal({
          start: self.start,
          end: self.end,
          diff: 1
        });

        expect(self.$scope.rows).to.equal(1);
      });

      it('should call calendarEventEmitterMock if creating the event success', function() {
        self.$scope.submit();
        self.$rootScope.$digest();
        expect(self.calendarEventEmitterMock.activitystream.emitPostedMessage).to.have.been.calledWith(self.responseHeaders, self.activitystream.activity_stream.uuid);
      });
    });

  });
});
