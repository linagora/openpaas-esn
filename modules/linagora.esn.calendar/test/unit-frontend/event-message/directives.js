'use strict';

/*global chai:false*/
/*global sinon:false*/
/*global _:false*/

var expect = chai.expect;

describe('The event-message Angular module directives', function() {

  var self = this;

  beforeEach(function() {
    angular.mock.module('esn.calendar', 'linagora.esn.graceperiod', 'jadeTemplates');
  });

  describe('The event message service', function() {
    beforeEach(angular.mock.inject(function(eventMessageService) {
      self.eventMessageService = eventMessageService;
    }));

    it('should not fail for empty and null attendee', function() {
      [null, [], undefined].forEach(function(nullAttendees) {
        expect(self.eventMessageService.computeAttendeeStats(nullAttendees)).to.deep.equal({
          'NEEDS-ACTION': 0,
          ACCEPTED: 0,
          TENTATIVE: 0,
          DECLINED: 0,
          OTHER: 0
        });
      }, this);
    });

    it('should count correctly the different kind of partstat', function() {
      var needAction = { partstat: 'NEEDS-ACTION' };
      var accepted = { partstat: 'ACCEPTED' };
      var tentative = { partstat: 'TENTATIVE' };
      var declined = { partstat: 'DECLINED' };
      var other1 = { partstat: 'e' };
      var other2 = { partstat: 'us' };
      var other3 = { partstat: 'eless' };

      var attendees = [needAction, other1, accepted, other2, tentative, other3, declined, accepted, tentative];
      expect(self.eventMessageService.computeAttendeeStats(attendees)).to.deep.equal({
        'NEEDS-ACTION': 1,
        ACCEPTED: 2,
        TENTATIVE: 2,
        DECLINED: 1,
        OTHER: 3
      });
    });

  });

  describe('The eventMessage directive', function() {
    beforeEach(function() {

      self.event = {
        vcalendar: 'vcalendar',
        attendees: 'attendees',
        path: 'par la, il y a des fraises',
        etag: 'ada'
      };

      self.eventAfterChangePart = {
        attendees: ['it has been changed']
      };

      self.sessionMock = {
        user: { emails: 'emails' },
        ready: {
          then: function() {}
        }
      };

      self.eventServiceMock = {
        getEvent: sinon.spy(function() {
          return $q.when(self.event);
        }),
        getInvitedAttendees: sinon.spy(function() {
          return [{ getParameter: _.constant('partstart') }];
        }),
        changeParticipation: sinon.spy(function(_path, _event, _emails, partstat) {
          self.partstat[partstat] = (self.partstat[partstat] || 0) + 1;
          return $q.when(self.eventAfterChangePart);
        })
      };

      self.partstat = {
        OTHER: 42
      };

      self.eventMessageServiceMock = {
        computeAttendeeStats: sinon.stub().returns(self.partstat)
      };

      angular.mock.module(function($provide) {
        $provide.value('eventMessageService', self.eventMessageServiceMock);
        $provide.value('eventService', self.eventServiceMock);
        $provide.value('session', self.sessionMock);
        $provide.factory('eventsProviders', function() {
          return {
            setUpSearchProviders: function() {}
          };
        });
      });
    });

    beforeEach(angular.mock.inject(function($rootScope, $compile) {
      self.$rootScope = $rootScope;
      self.$scope = self.$rootScope.$new();
      self.$compile = $compile;
      self.$scope.message = {
        eventId: 'eventId'
      };

      self.initDirective = function() {
        var html = '<event-message></event-message>';
        self.element = self.$compile(html)(self.$scope);
        self.$scope.$digest();
      };

      self.initDirective();
    }));

    it('should fetch event and his getInvitedAttendees correctly', function() {
      expect(self.eventServiceMock.getEvent).to.have.been.calledWith(self.$scope.message.eventId);
      expect(self.eventServiceMock.getInvitedAttendees).to.have.been.calledWith(self.$scope.event.vcalendar, self.sessionMock.user.emails);
    });

    it('should remove loading and set error if getEvent failed', function() {
      var statusText = 'status are made of stone';
      self.eventServiceMock.getEvent = function() {
        return $q.reject({
          statusText: statusText
        });
      };

      self.initDirective();
      expect(self.element.find('>div>.loading').hasClass('hidden')).to.be.true;
      expect(self.element.find('>div>.error').hasClass('hidden')).to.be.false;
    });

    it('should remove loading and set message if getEvent succed', function() {
      expect(self.element.find('>div>.loading').hasClass('hidden')).to.be.true;
      expect(self.element.find('>div>.message').hasClass('hidden')).to.be.false;
    });

    it('should take partstat of first attendee if not organizer', function() {
      expect(self.$scope.partstat).to.equal('partstart');
    });

    it('should take partstat of organizer if any', function() {
      var orgPartstat = 'orgPartstat';
      self.eventServiceMock.getInvitedAttendees = sinon.stub().returns([{}, { name: 'organizer', getParameter: _.constant(orgPartstat) }]);
      self.initDirective();
      expect(self.$scope.partstat).to.equal(orgPartstat);
    });

    it('should compute partstat', function() {
      expect(self.eventMessageServiceMock.computeAttendeeStats).to.have.been.calledWith(self.event.attendees);
      expect(self.$scope.attendeesPerPartstat).to.equal(self.partstat);
    });

    it('should compute hasAttendee', function() {
      expect(self.$scope.hasAttendees).to.be.true;
      self.event.attendees = null;
      self.initDirective();
      expect(self.$scope.hasAttendees).to.be.false;
    });

    describe('scope.changeParticipation ', function() {
      it('should call eventService.changeParticipation correctly', function() {
        var partstat = 'ACCEPTED';
        self.$scope.changeParticipation(partstat);
        expect(self.eventServiceMock.changeParticipation).to.have.been.calledWith(self.event.path, self.event, self.sessionMock.user.emails, partstat);
      });

      it('should update event ', function() {
        var partstat = 'ACCEPTED';
        self.$scope.changeParticipation(partstat);
        self.$rootScope.$digest();
        expect(self.$scope.event).to.equal(self.eventAfterChangePart);
      });

      it('should update attendee stats correctly', function() {
        var partstat = 'ACCEPTED';
        self.$scope.changeParticipation(partstat);
        self.$rootScope.$digest();
        expect(self.eventMessageServiceMock.computeAttendeeStats).to.have.been.calledWith(self.eventAfterChangePart.attendees);
        expect(self.$scope.attendeesPerPartstat.ACCEPTED).to.equal(1);
      });
    });
  });

  describe('The eventMessageEditionController', function() {
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

      self.eventServiceMock = {
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
        $provide.value('eventService', self.eventServiceMock);
        $provide.value('notificationFactory', self.notificationFactoryMock);
        $provide.value('calendarEventEmitter', self.calendarEventEmitterMock);
      });
    });

    beforeEach(angular.mock.inject(function($controller, $rootScope, fcMoment, EVENT_FORM, $q) {
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
      self.fcMoment = fcMoment;
      self.EVENT_FORM = EVENT_FORM; self.start = fcMoment('2015-08-17 08:00');
      self.end = fcMoment('2015-08-17 09:00');
      self.initController = function() {
        $controller('eventMessageEditionController', { $scope: self.$scope });
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

      it('should call eventService.createEvent with $scope.calendarHomeId if defined', function() {
        self.$scope.calendarHomeId = 'et';
        self.$scope.submit();
        expect(self.eventServiceMock.createEvent).to.have.been.calledWith(self.$scope.calendarHomeId);
      });

      it('should call eventService.createEvent with calendarService.calendarHomeId if $scope.calendarHomeId is not defined', function() {
        self.$scope.submit();
        expect(self.eventServiceMock.createEvent).to.have.been.calledWith(self.calendarServiceMock.calendarHomeId);
      });

      it('should give path to default calendars "/events"', function() {
        self.$scope.submit();
        expect(self.eventServiceMock.createEvent).to.have.been.calledWith(sinon.match.any, '/calendars/calendarHomeId/events');
      });

      it('should path the event and option that disable graceperiod', function() {
        self.$scope.event = { title: 'telephon maison' };
        self.$scope.submit();
        expect(self.eventServiceMock.createEvent).to.have.been.calledWith(sinon.match.any, sinon.match.any, self.$scope.event, { graceperiod: false });
      });

      it('should not call createEvent and display an error if no activity_stream.uuid', function() {
        [{ activity_stream: null }, { activity_stream: { uuid: null } }].forEach(function(activitystream) {
          self.$scope.displayError = sinon.spy();
          self.$scope.activitystream = activitystream;
          self.$scope.submit();
          expect(self.$scope.displayError).to.have.been.calledOnce;
          expect(self.eventServiceMock.createEvent).to.have.not.been.called;

        }, this);
      });

      it('should set $scope.restActive to true only meanwhile eventService.createEvent resolve', function() {
        expect(self.$scope.restActive).to.be.false;

        var defer = self.$q.defer();
        self.eventServiceMock.createEvent = _.constant(defer.promise);
        self.$scope.submit();
        expect(self.$scope.restActive).to.be.true;
        defer.resolve(null);
        self.$rootScope.$digest();
        expect(self.$scope.restActive).to.be.false;
      });

      it('should call notificationFactory.weakError if eventService.createEvent fail', function() {
        self.eventServiceMock.createEvent = function() {
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
