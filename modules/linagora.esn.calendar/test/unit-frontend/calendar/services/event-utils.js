'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The eventUtils service', function() {
  var element, fcTitle, fcContent, event, calendarService, sanitizeMock;

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

  var userEmail = 'aAttendee@open-paas.org';
  beforeEach(function() {
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

    sanitizeMock = sinon.spy(angular.identity);

    angular.mock.module('esn.calendar');
    angular.mock.module('esn.ical');
    angular.mock.module('ngSanitize');
    angular.mock.module(function($provide) {
      $provide.value('session', asSession);
      $provide.value('calendarService', calendarService);
      $provide.value('$sanitize', sanitizeMock);
    });

    var vcalendar = {};

    vcalendar.hasOwnProperty = null; // jshint ignore:line
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
    element.innerElements['.fc-content'] = fcContent;
    element.innerElements['.fc-title'] = fcTitle;
  });

  beforeEach(angular.mock.inject(function(eventUtils, $rootScope, fcMoment, CalendarShell) {
    this.eventUtils = eventUtils;
    this.$rootScope = $rootScope;
    this.fcMoment = fcMoment;
    this.CalendarShell = CalendarShell;
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

      this.eventUtils.applyReply(origEvent, reply);
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
    it('should sanitize event description', function() {
      this.eventUtils.render(event, element);
      expect(sanitizeMock).to.have.been.calledWith(event.description);
    });

    it('should add a title attribute if description is defined', function() {
      event.description = 'aDescription';
      this.eventUtils.render(event, element);
      expect(element.attributes.title).to.equal('aDescription');
    });

    it('should add event-needs-action class if current user is found in the DECLINED attendees', function() {
      event.attendees.push({
        email: userEmail,
        partstat: 'DECLINED'
      });
      this.eventUtils.render(event, element);
      expect(element.class).to.deep.equal(['event-declined']);
    });

    it('should add event-needs-action class if current user is found in the ACCEPTED attendees', function() {
      event.attendees.push({
        email: userEmail,
        partstat: 'ACCEPTED'
      });
      this.eventUtils.render(event, element);
      expect(element.class).to.deep.equal(['event-accepted']);
    });

    it('should add event-needs-action class if current user is found in the NEEDS-ACTION attendees', function() {
      event.attendees.push({
        email: userEmail,
        partstat: 'NEEDS-ACTION'
      });
      this.eventUtils.render(event, element);
      expect(element.class).to.deep.equal(['event-needs-action']);
    });

    it('should add event-tentative class if current user is found in the TENTATIVE attendees', function() {
      event.attendees.push({
        email: userEmail,
        partstat: 'TENTATIVE'
      });
      this.eventUtils.render(event, element);
      expect(element.class).to.deep.equal(['event-tentative']);
    });

    it('should add the event-is-instance class for instances', function() {
      event.isInstance = function() { return true; };
      this.eventUtils.render(event, element);
      expect(element.class).to.include('event-is-instance');
    });

    it('should keep startEditable and durationEditable to undefined if the user is not an attendee of the event', function() {
      this.eventUtils.render(event, element);
      expect(event.startEditable).to.not.exist;
      expect(event.durationEditable).to.not.exist;
    });

    it('should set startEditable and durationEditable to false if the user is an attendee of the event', function() {
      event.attendees.push({
        email: userEmail
      });
      this.eventUtils.render(event, element);
      expect(event.startEditable).to.be.false;
      expect(event.durationEditable).to.be.false;
    });
  });

  describe('isOrganizer function', function() {
    it('should return true when the event organizer is the current user', function() {
      var event = {
        organizer: {
          email: 'aAttendee@open-paas.org'
        }
      };
      expect(this.eventUtils.isOrganizer(event)).to.be.true;
    });

    it('should return false when the event organizer is not the current user', function() {
      var event = {
        organizer: {
          email: 'not-organizer@bar.com'
        }
      };
      expect(this.eventUtils.isOrganizer(event)).to.be.false;
    });

    it('should return true when the event is undefined', function() {
      expect(this.eventUtils.isOrganizer(null)).to.be.true;
    });

    it('should return true when the event organizer is undefined', function() {
      var event = {
        organizer: null
      };
      expect(this.eventUtils.isOrganizer(event)).to.be.true;
    });
  });

  describe('hasSignificantChange function', function() {
    it('should return true when the events do not have the same start date', function() {
      var newEvent = {
        start: this.fcMoment('2015-01-01 09:00:00'),
        end: this.fcMoment('2015-01-01 10:00:00')
      };
      var oldEvent = {
        start: this.fcMoment('2015-01-01 08:00:00'),
        end: this.fcMoment('2015-01-01 10:00:00')
      };
      expect(this.eventUtils.hasSignificantChange(oldEvent, newEvent)).to.be.true;
    });

    it('should return true when the events do not have the same end date', function() {
      var newEvent = {
        start: this.fcMoment('2015-01-01 09:00:00'),
        end: this.fcMoment('2015-01-01 10:00:00')
      };
      var oldEvent = {
        start: this.fcMoment('2015-01-01 09:00:00'),
        end: this.fcMoment('2015-01-01 11:00:00')
      };
      expect(this.eventUtils.hasSignificantChange(oldEvent, newEvent)).to.be.true;
    });

    it('should return true when the events do not have the same due property', function() {
      var newEvent = {
        start: this.fcMoment('2015-01-01 09:00:00'),
        end: this.fcMoment('2015-01-01 11:00:00'),
        due: 'due1'
      };
      var oldEvent = {
        start: this.fcMoment('2015-01-01 09:00:00'),
        end: this.fcMoment('2015-01-01 11:00:00'),
        due: 'due2'
      };
      expect(this.eventUtils.hasSignificantChange(oldEvent, newEvent)).to.be.true;
    });

    it('should return true when the events do not have the same rrule', function() {
      var newEvent = {
        start: this.fcMoment('2015-01-01 09:00:00'),
        end: this.fcMoment('2015-01-01 11:00:00'),
        due: 'due',
        rrule: {
          frequency: 2
        }
      };
      var oldEvent = {
        start: this.fcMoment('2015-01-01 09:00:00'),
        end: this.fcMoment('2015-01-01 11:00:00'),
        due: 'due',
        rrule: {
          frequency: 1
        }
      };
      expect(this.eventUtils.hasSignificantChange(oldEvent, newEvent)).to.be.true;
    });

    it('should return true when the events do not have the same exdate', function() {
      var newEvent = {
        start: this.fcMoment('2015-01-01 09:00:00'),
        end: this.fcMoment('2015-01-01 11:00:00'),
        due: 'due',
        rrule: {
          frequency: 1
        },
        exdate: [
          this.fcMoment('2015-01-02 11:00:00')
        ]
      };
      var oldEvent = {
        start: this.fcMoment('2015-01-01 09:00:00'),
        end: this.fcMoment('2015-01-01 11:00:00'),
        due: 'due',
        rrule: {
          frequency: 1
        },
        exdate: [
          this.fcMoment('2015-01-03 11:00:00')
        ]
      };
      expect(this.eventUtils.hasSignificantChange(oldEvent, newEvent)).to.be.true;
    });

    it('should return true when the events do not have the same status', function() {
      var newEvent = {
        start: this.fcMoment('2015-01-01 09:00:00'),
        end: this.fcMoment('2015-01-01 11:00:00'),
        due: 'due',
        rrule: {
          frequency: 1
        },
        exdate: [
          this.fcMoment('2015-01-02 11:00:00')
        ],
        status: 'REFUSED'
      };
      var oldEvent = {
        start: this.fcMoment('2015-01-01 09:00:00'),
        end: this.fcMoment('2015-01-01 11:00:00'),
        due: 'due',
        rrule: {
          frequency: 1
        },
        exdate: [
          this.fcMoment('2015-01-02 11:00:00')
        ],
        status: 'ACCEPTED'
      };
      expect(this.eventUtils.hasSignificantChange(oldEvent, newEvent)).to.be.true;
    });

    it('should return false when the events are the same', function() {
      var newEvent = {
        start: this.fcMoment('2015-01-01 09:00:00'),
        end: this.fcMoment('2015-01-01 11:00:00'),
        due: 'due',
        rrule: {
          frequency: 1
        },
        exdate: [
          this.fcMoment('2015-01-02 11:00:00')
        ],
        status: 'ACCEPTED'
      };
      var oldEvent = {
        start: this.fcMoment('2015-01-01 09:00:00'),
        end: this.fcMoment('2015-01-01 11:00:00'),
        due: 'due',
        rrule: {
          frequency: 1
        },
        exdate: [
          this.fcMoment('2015-01-02 11:00:00')
        ],
        status: 'ACCEPTED'
      };
      expect(this.eventUtils.hasSignificantChange(oldEvent, newEvent)).to.be.false;
    });
  });

  describe('isNew function', function() {
    it('should return true if event.id is undefined', function() {
      expect(this.eventUtils.isNew({})).to.be.true;
    });

    it('should return false if event.etag is defined', function() {
      expect(this.eventUtils.isNew({etag: '123'})).to.be.false;
    });
  });

  describe('setBackgroundColor function', function() {
    it('should set the background color of the good calendar', function() {

      var event = {
        id: 'paint it black',
        calendarId: 'altamont'
      };

      var calendars = [{id: 'woodstock', color: 'pink'}, {id: 'altamont', color: 'black'}];

      expect(this.eventUtils.setBackgroundColor(event, calendars)).to.equal(event);
      expect(event.backgroundColor).to.equal('black');
    });
  });
});
