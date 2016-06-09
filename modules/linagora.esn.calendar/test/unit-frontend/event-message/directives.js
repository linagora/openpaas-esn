'use strict';

/*global chai:false*/
/*global sinon:false*/
/*global _:false*/

var expect = chai.expect;

describe('The event-message Angular module directives', function() {

  var self;
  beforeEach(function() {
    angular.mock.module('esn.calendar', 'linagora.esn.graceperiod', 'jadeTemplates');
    self = this;
  });

  describe('The event message service', function() {
    beforeEach(angular.mock.inject(function(eventMessageService) {
      this.eventMessageService = eventMessageService;
    }));

    it('should not fail for empty and null attendee', function() {
      [null, [], undefined].forEach(function(nullAttendees) {
        expect(this.eventMessageService.computeAttendeeStats(nullAttendees)).to.deep.equal({
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
      expect(this.eventMessageService.computeAttendeeStats(attendees)).to.deep.equal({
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

      this.event = {
        vcalendar: 'vcalendar',
        attendees: 'attendees',
        path: 'par la, il y a des fraises',
        etag: 'ada'
      };

      this.eventAfterChangePart = {
        attendees:['it has been changed']
      };

      this.sessionMock = {
        user: { emails: 'emails' }
      };

      this.eventServiceMock = {
        getEvent: sinon.spy(function() {
          return $q.when(self.event);
        }),
        getInvitedAttendees: sinon.spy(function() {
          return [{ getParameter:_.constant('partstart') }];
        }),
        changeParticipation: sinon.spy(function(_path, _event, _emails, partstat) {
          self.partstat[partstat] = (self.partstat[partstat] || 0) + 1;
          return $q.when(self.eventAfterChangePart);
        })
      };

      this.partstat = {
        OTHER: 42
      };

      this.eventMessageServiceMock = {
        computeAttendeeStats: sinon.stub().returns(this.partstat)
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
      this.$rootScope = $rootScope;
      this.$scope = this.$rootScope.$new();
      this.$compile = $compile;
      this.$scope.message = {
        eventId: 'eventId'
      };

      this.initDirective = function() {
        var html = '<event-message></event-message>';
        this.element = this.$compile(html)(self.$scope);
        this.$scope.$digest();
      };

      this.initDirective();
    }));

    it('should fetch event and his getInvitedAttendees correctly', function() {
      expect(this.eventServiceMock.getEvent).to.have.been.calledWith(this.$scope.message.eventId);
      expect(this.eventServiceMock.getInvitedAttendees).to.have.been.calledWith(this.$scope.event.vcalendar, this.sessionMock.user.emails);
    });

    it('should remove loading and set error if getEvent failed', function() {
      var statusText = 'status are made of stone';
      this.eventServiceMock.getEvent = function() {
        return $q.reject({
          statusText: statusText
        });
      };

      this.initDirective();
      expect(this.element.find('>div>.loading').hasClass('hidden')).to.be.true;
      expect(this.element.find('>div>.error').hasClass('hidden')).to.be.false;
    });

    it('should remove loading and set message if getEvent succed', function() {
      expect(this.element.find('>div>.loading').hasClass('hidden')).to.be.true;
      expect(this.element.find('>div>.message').hasClass('hidden')).to.be.false;
    });

    it('should take partstat of first attendee if not organizer', function() {
      expect(this.$scope.partstat).to.equal('partstart');
    });

    it('should take partstat of organizer if any', function() {
      var orgPartstat = 'orgPartstat';
      this.eventServiceMock.getInvitedAttendees = sinon.stub().returns([{}, { name: 'organizer', getParameter: _.constant(orgPartstat) }]);
      this.initDirective();
      expect(this.$scope.partstat).to.equal(orgPartstat);
    });

    it('should compute partstat', function() {
      expect(this.eventMessageServiceMock.computeAttendeeStats).to.have.been.calledWith(this.event.attendees);
      expect(this.$scope.attendeesPerPartstat).to.equal(this.partstat);
    });

    it('should compute hasAttendee', function() {
      expect(this.$scope.hasAttendees).to.be.true;
      this.event.attendees = null;
      this.initDirective();
      expect(this.$scope.hasAttendees).to.be.false;
    });

    describe('scope.changeParticipation ', function() {
      it('should call eventService.changeParticipation correctly', function() {
        var partstat = 'ACCEPTED';
        this.$scope.changeParticipation(partstat);
        expect(this.eventServiceMock.changeParticipation).to.have.been.calledWith(this.event.path, this.event, this.sessionMock.user.emails, partstat);
      });

      it('should update event ', function() {
        var partstat = 'ACCEPTED';
        this.$scope.changeParticipation(partstat);
        this.$rootScope.$digest();
        expect(this.$scope.event).to.equal(this.eventAfterChangePart);
      });

      it('should update attendee stats correctly', function() {
        var partstat = 'ACCEPTED';
        this.$scope.changeParticipation(partstat);
        this.$rootScope.$digest();
        expect(this.eventMessageServiceMock.computeAttendeeStats).to.have.been.calledWith(this.eventAfterChangePart.attendees);
        expect(this.$scope.attendeesPerPartstat.ACCEPTED).to.equal(1);
      });
    });
  });

  describe('The eventMessageEditionController', function() {
    beforeEach(function() {
      angular.mock.module('esn.calendar', 'linagora.esn.graceperiod');
      this.CalendarShellMock = {
        fromIncompleteShell: sinon.spy(_.identity)
      };

      this.calendarUtilsMock = {
        getNewStartDate: sinon.spy(function() {
          return self.start;
        }),
        getNewEndDate: sinon.spy(function() {
          return self.end;
        })
      };

      this.calendarServiceMock = {
        calendarHomeId: 'calendarHomeId'
      };

      this.eventServiceMock = {
        createEvent: sinon.spy(function() {
          return self.$q.when({
            headers: function() {
              return self.responseHeaders;
            }
          });
        })
      };

      this.notificationFactoryMock = {
        weakError: sinon.spy()
      };

      this.calendarEventEmitterMock = {
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
      this.$rootScope.$destroy();
    });

    it('should init an empty event with CalendarShell', function() {
      var calendarShell = 'kitten';
      this.CalendarShellMock.fromIncompleteShell = sinon.stub().returns(calendarShell);
      this.initController();

      expect(this.calendarUtilsMock.getNewStartDate).to.have.been.calledOnce;
      expect(this.calendarUtilsMock.getNewEndDate).to.have.been.calledOnce;

      expect(this.CalendarShellMock.fromIncompleteShell).to.have.been.calledWith({
        start: this.start,
        end: this.end
      });

      expect(this.$scope.event).to.equal(calendarShell);
    });

    describe('$scope.submit', function() {
      beforeEach(function() {
        this.initController();
      });

      it('should replace empty title by default title', function() {
        ['', undefined, null, '     '].forEach(function(title) {
          this.$scope.event.title = title;
          this.$scope.submit();
          expect(this.$scope.event.title).to.equal(this.EVENT_FORM.title.default);
        }, this);
      });

      it('should not replace non title by default title', function() {
        var title = ' a title';
        this.$scope.event.title = title;
        this.$scope.submit();
        expect(this.$scope.event.title).to.equal(title);
      });

      it('should call eventService.createEvent with $scope.calendarHomeId if defined', function() {
        this.$scope.calendarHomeId = 'et';
        this.$scope.submit();
        expect(this.eventServiceMock.createEvent).to.have.been.calledWith(this.$scope.calendarHomeId);
      });

      it('should call eventService.createEvent with calendarService.calendarHomeId if $scope.calendarHomeId is not defined', function() {
        this.$scope.submit();
        expect(this.eventServiceMock.createEvent).to.have.been.calledWith(this.calendarServiceMock.calendarHomeId);
      });

      it('should give path to default calendars "/events"', function() {
        this.$scope.submit();
        expect(this.eventServiceMock.createEvent).to.have.been.calledWith(sinon.match.any, '/calendars/calendarHomeId/events');
      });

      it('should path the event and option that disable graceperiod', function() {
        this.$scope.event = 'telephon maison';
        this.$scope.submit();
        expect(this.eventServiceMock.createEvent).to.have.been.calledWith(sinon.match.any, sinon.match.any, this.$scope.event, { graceperiod: false });
      });

      it('should not call createEvent and display an error if no activity_stream.uuid', function() {
        [{ activity_stream: null }, { activity_stream: { uuid: null } }].forEach(function(activitystream) {
          this.$scope.displayError = sinon.spy();
          this.$scope.activitystream = activitystream;
          this.$scope.submit();
          expect(this.$scope.displayError).to.have.been.calledOnce;
          expect(this.eventServiceMock.createEvent).to.have.not.been.called;

        }, this);
      });

      it('should set $scope.restActive to true only meanwhile eventService.createEvent resolve', function() {
        expect(this.$scope.restActive).to.be.false;

        var defer = this.$q.defer();
        this.eventServiceMock.createEvent = _.constant(defer.promise);
        this.$scope.submit();
        expect(this.$scope.restActive).to.be.true;
        defer.resolve(null);
        this.$rootScope.$digest();
        expect(this.$scope.restActive).to.be.false;
      });

      it('should call notificationFactory.weakError if eventService.createEvent fail', function() {
        this.eventServiceMock.createEvent = function() {
          return self.$q.reject({});
        };
        this.$scope.submit();
        this.$rootScope.$digest();
        expect(this.notificationFactoryMock.weakError).to.have.been.called;
      });

      it('should call $parent.show if creating the event success', function() {
        this.$parentScope.show = sinon.spy();
        this.$scope.submit();
        this.$rootScope.$digest();
        expect(this.$parentScope.show).to.have.been.calledWith('whatsup');
      });

      it('should reset event if creating the event success', function() {
        this.$scope.event = 'it will disapear';
        this.$scope.submit();
        this.$rootScope.$digest();
        expect(this.$scope.event).to.deep.equal({
          start: this.start,
          end: this.end,
          diff: 1
        });

        expect(this.$scope.rows).to.equal(1);
      });

      it('should call calendarEventEmitterMock if creating the event success', function() {
        this.$scope.submit();
        this.$rootScope.$digest();
        expect(this.calendarEventEmitterMock.activitystream.emitPostedMessage).to.have.been.calledWith(this.responseHeaders, this.activitystream.activity_stream.uuid);
      });
    });

  });
});
