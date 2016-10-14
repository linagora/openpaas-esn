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
          then: angular.noop
        }
      };

      self.calEventServiceMock = {
        getEvent: sinon.spy(function() {
          return $q.when(self.event);
        }),
        getInvitedAttendees: sinon.spy(function() {
          return [{ getParameter: _.constant('partstart') }];
        }),
        changeParticipation: sinon.spy(function(_path, _event, _emails, partstat) { // eslint-disable-line
          self.partstat[partstat] = (self.partstat[partstat] || 0) + 1;

          return $q.when(self.eventAfterChangePart);
        })
      };

      self.partstat = {
        OTHER: 42
      };

      self.calEventMessageServiceMock = {
        computeAttendeeStats: sinon.stub().returns(self.partstat)
      };

      angular.mock.module(function($provide) {
        $provide.value('calEventMessageService', self.calEventMessageServiceMock);
        $provide.value('calEventService', self.calEventServiceMock);
        $provide.value('session', self.sessionMock);
        $provide.factory('calEventsProviders', function() {
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
        var html = '<cal-event-message message="message"></cal-event-message>';

        self.element = self.$compile(html)(self.$scope);
        self.$scope.$digest();
        self.eleScope = self.element.isolateScope();
      };

      self.initDirective();
    }));

    it('should fetch event and his getInvitedAttendees correctly', function() {
      expect(self.calEventServiceMock.getEvent).to.have.been.calledWith(self.$scope.message.eventId);
      expect(self.calEventServiceMock.getInvitedAttendees).to.have.been.calledWith(self.eleScope.vm.event.vcalendar, self.sessionMock.user.emails);
    });

    it('should remove loading and set error if getEvent failed', function() {
      var statusText = 'status are made of stone';

      self.calEventServiceMock.getEvent = function() {
        return $q.reject({
          statusText: statusText
        });
      };

      self.initDirective();
      expect(self.eleScope.vm.isLoadFailed).to.be.true;
    });

    it('should remove loading and set message if getEvent succed', function() {
      expect(self.eleScope.vm.isEventLoaded).to.be.true;
    });

    it('should take partstat of first attendee if not organizer', function() {
      expect(self.eleScope.vm.partstat).to.equal('partstart');
    });

    it('should take partstat of organizer if any', function() {
      var orgPartstat = 'orgPartstat';

      self.calEventServiceMock.getInvitedAttendees = sinon.stub().returns([{}, { name: 'organizer', getParameter: _.constant(orgPartstat) }]);
      self.initDirective();
      expect(self.eleScope.vm.partstat).to.equal(orgPartstat);
    });

    it('should compute partstat', function() {
      expect(self.calEventMessageServiceMock.computeAttendeeStats).to.have.been.calledWith(self.event.attendees);
      expect(self.eleScope.vm.attendeesPerPartstat).to.equal(self.partstat);
    });

    it('should compute hasAttendee', function() {
      expect(self.eleScope.vm.hasAttendees).to.be.true;
      self.event.attendees = null;
      self.initDirective();
      expect(self.eleScope.vm.hasAttendees).to.be.false;
    });

    describe('scope.changeParticipation ', function() {
      it('should call calEventService.changeParticipation correctly', function() {
        var partstat = 'ACCEPTED';

        self.eleScope.vm.changeParticipation(partstat);
        expect(self.calEventServiceMock.changeParticipation).to.have.been.calledWith(self.event.path, self.event, self.sessionMock.user.emails, partstat);
      });

      it('should update event ', function() {
        var partstat = 'ACCEPTED';

        self.eleScope.vm.changeParticipation(partstat);
        self.$rootScope.$digest();
        expect(self.eleScope.vm.event).to.equal(self.eventAfterChangePart);
      });

      it('should update attendee stats correctly', function() {
        var partstat = 'ACCEPTED';

        self.eleScope.vm.changeParticipation(partstat);
        self.$rootScope.$digest();
        expect(self.calEventMessageServiceMock.computeAttendeeStats).to.have.been.calledWith(self.eventAfterChangePart.attendees);
        expect(self.eleScope.vm.attendeesPerPartstat.ACCEPTED).to.equal(1);
      });
    });
  });
});
