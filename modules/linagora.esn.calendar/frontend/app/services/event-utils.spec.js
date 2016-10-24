'use strict';

/* global sinon, chai: false */

var expect = chai.expect;

describe('The calEventUtils service', function() {
  var element, fcTitle, fcTimeSpan, fcTime, fcContent, event, calendarService, view, self;

  function Element() {
    this.innerElements = {};
    this.class = [];
    this.attributes = {};
    this.htmlContent = 'aContent';
  }

  Element.prototype.addClass = function(aClass) {
    this.class.push(aClass);
  };

  Element.prototype.attr = function(name, content) {
    this.attributes[name] = content;
  };

  Element.prototype.html = function(content) {
    if (content) {
      this.htmlContent = content;
    }

    return this.htmlContent;
  };

  Element.prototype.find = function(aClass) {
    return this.innerElements[aClass];
  };

  Element.prototype.append = function() {
  };

  Element.prototype.prepend = function() {
  };

  var userEmail = 'aAttendee@open-paas.org';

  beforeEach(function() {
    self = this;
    var emailMap = {};

    emailMap[userEmail] = true;

    var asSession = {
      user: {
        _id: '123456',
        emails: [userEmail],
        emailMap: emailMap
      },
      domain: {
        company_name: 'test'
      }
    };

    calendarService = {};

    angular.mock.module('esn.calendar');
    angular.mock.module('esn.ical');
    angular.mock.module(function($provide) {
      $provide.factory('session', function($q) {
        asSession.ready = $q.when(asSession);

        return asSession;
      });
      $provide.value('calendarService', calendarService);
    });

    var vcalendar = {};

    vcalendar.hasOwnProperty = null;
    event = {
      title: 'myTitle',
      description: 'description',
      vcalendar: vcalendar,
      attendees: [],
      isInstance: function() { return false; }
    };

    element = new Element();
    fcContent = new Element();
    fcTitle = new Element();
    fcTimeSpan = new Element();
    fcTime = new Element();
    view = {};
    element.innerElements['.fc-content'] = fcContent;
    element.innerElements['.fc-title'] = fcTitle;
    element.innerElements['.fc-time span'] = fcTimeSpan;
    element.innerElements['.fc-time'] = fcTime;

    this.escapeHTMLMockResult = {};
    this.escapeHTMLMock = {
      escapeHTML: sinon.stub().returns(this.escapeHTMLMockResult)
    };

    angular.mock.module(function($provide) {
      $provide.value('escapeHtmlUtils', self.escapeHTMLMock);
    });
  });

  beforeEach(angular.mock.inject(function(calEventUtils, $rootScope, calMoment, CalendarShell, CALENDAR_MAX_DURATION_OF_SMALL_EVENT) {
    this.calEventUtils = calEventUtils;
    this.$rootScope = $rootScope;
    this.calMoment = calMoment;
    this.CalendarShell = CalendarShell;
    event.start = calMoment('2016-10-06 09:00:00');
    event.end = event.start.add(CALENDAR_MAX_DURATION_OF_SMALL_EVENT, 'minutes');
  }));

  describe('applyReply', function() {
    it('should update reply\'s attendee participation without modifying other', function() {
      var origEvent = this.CalendarShell.fromIncompleteShell({title: 'second world war'});

      origEvent.attendees = [{
        email: 'winston.churchill@demo.open-paas.org',
        partstat: 'ACCEPTED'
      }, {
        email: 'philippe.petain@demo.open-paas.org',
        partstat: 'NEEDS-ACTION'
      }];

      var reply = this.CalendarShell.fromIncompleteShell({title: 'second world war'});

      reply.attendees = [{
        email: 'philippe.petain@demo.open-paas.org',
        partstat: 'DECLINED'
      }];

      this.calEventUtils.applyReply(origEvent, reply);

      expect(origEvent.attendees).to.shallowDeepEqual({
        0: {
          email: 'winston.churchill@demo.open-paas.org',
          partstat: 'ACCEPTED'
        },
        1: {
          email: 'philippe.petain@demo.open-paas.org',
          partstat: 'DECLINED'
        },
        length: 2
      });
    });
  });

  describe('render function', function() {
    it('should add a title attribute if description is defined', function() {
      event.description = 'aDescription';
      this.calEventUtils.render(event, element, view);
      expect(this.escapeHTMLMock.escapeHTML).to.have.been.calledWith(event.description);
      expect(element.attributes.title).to.equal(this.escapeHTMLMockResult);
    });

    it('should add event-needs-action class if current user is found in the DECLINED attendees', function() {
      event.attendees.push({
        email: userEmail,
        partstat: 'DECLINED'
      });
      this.calEventUtils.render(event, element, view);
      expect(element.class).to.deep.equal(['event-declined']);
    });

    it('should add event-needs-action class if current user is found in the ACCEPTED attendees', function() {
      event.attendees.push({
        email: userEmail,
        partstat: 'ACCEPTED'
      });
      this.calEventUtils.render(event, element, view);
      expect(element.class).to.deep.equal(['event-accepted']);
    });

    it('should add event-needs-action class if current user is found in the NEEDS-ACTION attendees', function() {
      event.attendees.push({
        email: userEmail,
        partstat: 'NEEDS-ACTION'
      });
      this.calEventUtils.render(event, element, view);
      expect(element.class).to.deep.equal(['event-needs-action']);
    });

    it('should add event-tentative class if current user is found in the TENTATIVE attendees and event card with the time part', function() {
      event.attendees.push({
        email: userEmail,
        partstat: 'TENTATIVE'
      });
      this.calEventUtils.render(event, element, view);

      expect(element.class).to.deep.equal(['event-tentative']);
    });

    it('should add event-tentative class if current user is found in the TENTATIVE attendees and  event card without the time part', function() {
      event.attendees.push({
        email: userEmail,
        partstat: 'TENTATIVE'
      });
      fcTitle.prepend = sinon.spy();
      this.calEventUtils.render(event, element, view);

      expect(element.class).to.deep.equal(['event-tentative']);
      expect(fcTitle.prepend).to.have.been.calledOnce;
    });

    it('should add the event-is-instance class for instances', function() {
      delete element.innerElements['.fc-time span'];
      event.isInstance = function() { return true; };
      this.calEventUtils.render(event, element, view);
      expect(element.class).to.include('event-is-instance');
    });

    it('should display event title instead of time if the event duration under the max duration of a small event', angular.mock.inject(function(calMoment) {
      element.innerElements['.fc-time'].length = 1;
      fcTime.attr = sinon.spy();
      this.calEventUtils.render(event, element, view);

      expect(fcTime.attr).to.have.been.calledWith('data-start', event.title);
    }));

    it('should keep startEditable and durationEditable to undefined if the user is the organizer', function() {
      event.organizer = {
        email: userEmail
      };
      this.calEventUtils.render(event, element, view);
      expect(event.startEditable).to.not.exist;
      expect(event.durationEditable).to.not.exist;
    });

    it('should set startEditable and durationEditable to false if the user is an attendee of the event but not the organizer', function() {
      event.organizer = {
        email: 'organizerEmail'
      };
      event.attendees.push({
        email: userEmail
      });
      this.calEventUtils.render(event, element, view);
      expect(event.startEditable).to.be.false;
      expect(event.durationEditable).to.be.false;
    });

    it('should hide the time div in mobile on three days view', function() {
      view.name = 'agendaThreeDays';
      this.calEventUtils.render(event, element, view);
      expect(fcTimeSpan.class).to.include('fc-time-hide');
    });

    it('should hide the time div in mobile on week view', function() {
      view.name = 'agendaWeek';
      this.calEventUtils.render(event, element, view);
      expect(fcTimeSpan.class).to.include('fc-time-hide');
    });

    it('should hide the time div in mobile on day view', function() {
      view.name = 'agendaDay';
      this.calEventUtils.render(event, element, view);
      expect(fcTimeSpan.class).to.include('fc-time-hide');
    });
  });

  describe('isOrganizer function', function() {
    it('should return true when the event organizer is the current user', function() {
      var event = {
        organizer: {
          email: 'aAttendee@open-paas.org'
        }
      };

      expect(this.calEventUtils.isOrganizer(event)).to.be.true;
    });

    it('should return false when the event organizer is not the current user', function() {
      var event = {
        organizer: {
          email: 'not-organizer@bar.com'
        }
      };

      expect(this.calEventUtils.isOrganizer(event)).to.be.false;
    });

    it('should return true when the event is undefined', function() {
      expect(this.calEventUtils.isOrganizer(null)).to.be.true;
    });

    it('should return true when the event organizer is undefined', function() {
      var event = {
        organizer: null
      };

      expect(this.calEventUtils.isOrganizer(event)).to.be.true;
    });
  });

  describe('hasSignificantChange function', function() {
    it('should return true when the events do not have the same start date', function() {
      var newEvent = this.CalendarShell.fromIncompleteShell({
        start: this.calMoment('2015-01-01 09:00:00'),
        end: this.calMoment('2015-01-01 10:00:00')
      });
      var oldEvent = this.CalendarShell.fromIncompleteShell({
        start: this.calMoment('2015-01-01 08:00:00'),
        end: this.calMoment('2015-01-01 10:00:00')
      });

      expect(this.calEventUtils.hasSignificantChange(oldEvent, newEvent)).to.be.true;
    });

    it('should return true when the events do not have the same end date', function() {
      var newEvent = this.CalendarShell.fromIncompleteShell({
        start: this.calMoment('2015-01-01 09:00:00'),
        end: this.calMoment('2015-01-01 10:00:00')
      });
      var oldEvent = this.CalendarShell.fromIncompleteShell({
        start: this.calMoment('2015-01-01 09:00:00'),
        end: this.calMoment('2015-01-01 11:00:00')
      });

      expect(this.calEventUtils.hasSignificantChange(oldEvent, newEvent)).to.be.true;
    });

    it('should return true when the events do not have the same due property', function() {
      var newEvent = this.CalendarShell.fromIncompleteShell({
        start: this.calMoment('2015-01-01 09:00:00'),
        end: this.calMoment('2015-01-01 11:00:00'),
        due: 'due1'
      });
      var oldEvent = this.CalendarShell.fromIncompleteShell({
        start: this.calMoment('2015-01-01 09:00:00'),
        end: this.calMoment('2015-01-01 11:00:00'),
        due: 'due2'
      });

      expect(this.calEventUtils.hasSignificantChange(oldEvent, newEvent)).to.be.true;
    });

    it('should return true when the events do not have the same rrule', function() {
      var newEvent = this.CalendarShell.fromIncompleteShell({
        start: this.calMoment('2015-01-01 09:00:00'),
        end: this.calMoment('2015-01-01 11:00:00'),
        due: 'due',
        rrule: {
          until: this.calMoment('2015-01-03 11:00:00').toDate()
        }
      });
      var oldEvent = this.CalendarShell.fromIncompleteShell({
        start: this.calMoment('2015-01-01 09:00:00'),
        end: this.calMoment('2015-01-01 11:00:00'),
        due: 'due',
        rrule: {
          until: this.calMoment('2015-01-02 11:00:00').toDate()
        }
      });

      expect(this.calEventUtils.hasSignificantChange(oldEvent, newEvent)).to.be.true;
    });

    it('should return true when the events do not have the same exdate', function() {
      var newEvent = this.CalendarShell.fromIncompleteShell({
        start: this.calMoment('2015-01-01 09:00:00'),
        end: this.calMoment('2015-01-01 11:00:00'),
        due: 'due',
        rrule: {
          frequency: 1
        },
        exdate: [
          this.calMoment('2015-01-02 11:00:00')
        ]
      });
      var oldEvent = this.CalendarShell.fromIncompleteShell({
        start: this.calMoment('2015-01-01 09:00:00'),
        end: this.calMoment('2015-01-01 11:00:00'),
        due: 'due',
        rrule: {
          frequency: 1
        },
        exdate: [
          this.calMoment('2015-01-03 11:00:00')
        ]
      });

      expect(this.calEventUtils.hasSignificantChange(oldEvent, newEvent)).to.be.true;
    });

    it('should return true when the events do not have the same status', function() {
      var newEvent = this.CalendarShell.fromIncompleteShell({
        start: this.calMoment('2015-01-01 09:00:00'),
        end: this.calMoment('2015-01-01 11:00:00'),
        due: 'due',
        rrule: {
          frequency: 1
        },
        exdate: [
          this.calMoment('2015-01-02 11:00:00')
        ],
        status: 'REFUSED'
      });
      var oldEvent = this.CalendarShell.fromIncompleteShell({
        start: this.calMoment('2015-01-01 09:00:00'),
        end: this.calMoment('2015-01-01 11:00:00'),
        due: 'due',
        rrule: {
          frequency: 1
        },
        exdate: [
          this.calMoment('2015-01-02 11:00:00')
        ],
        status: 'ACCEPTED'
      });

      expect(this.calEventUtils.hasSignificantChange(oldEvent, newEvent)).to.be.true;
    });

    it('should return false when the events are the same', function() {
      var newEvent = this.CalendarShell.fromIncompleteShell({
        start: this.calMoment('2015-01-01 09:00:00'),
        end: this.calMoment('2015-01-01 11:00:00'),
        due: 'due',
        rrule: {
          frequency: 1
        },
        exdate: [
          this.calMoment('2015-01-02 11:00:00')
        ],
        status: 'ACCEPTED'
      });
      var oldEvent = this.CalendarShell.fromIncompleteShell({
        start: this.calMoment('2015-01-01 09:00:00'),
        end: this.calMoment('2015-01-01 11:00:00'),
        due: 'due',
        rrule: {
          frequency: 1
        },
        exdate: [
          this.calMoment('2015-01-02 11:00:00')
        ],
        status: 'ACCEPTED'
      });

      expect(this.calEventUtils.hasSignificantChange(oldEvent, newEvent)).to.be.false;
    });
  });

  describe('isNew function', function() {
    it('should return true if event.id is undefined', function() {
      expect(this.calEventUtils.isNew({})).to.be.true;
    });

    it('should return false if event.etag is defined', function() {
      expect(this.calEventUtils.isNew({etag: '123'})).to.be.false;
    });
  });

  describe('setBackgroundColor function', function() {
    it('should set the background color of the good calendar', function() {

      var event = {
        id: 'paint it black',
        calendarId: 'altamont'
      };

      var calendars = [{id: 'woodstock', color: 'pink'}, {id: 'altamont', color: 'black'}];

      expect(this.calEventUtils.setBackgroundColor(event, calendars)).to.equal(event);
      expect(event.backgroundColor).to.equal('black');
    });
  });

  describe('hasAttendees fn', function() {
    it('should return false when undefined', function() {
      expect(this.calEventUtils.hasAttendees({})).to.be.false;
    });

    it('should return false when = 0 ', function() {
      expect(this.calEventUtils.hasAttendees({
        attendees: []
      })).to.be.false;
    });

    it('should return true when > 0', function() {
      expect(this.calEventUtils.hasAttendees({
        attendees: ['1']
      })).to.be.true;
    });
  });
});
