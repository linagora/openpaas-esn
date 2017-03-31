'use strict';

/* global sinon, chai: false */

var expect = chai.expect;

describe('The calEventUtils service', function() {
  var element, fcTitle, fcTime, fcContent, eventIconsDivInMobile, event, calendarService, view, self;

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

  Element.prototype.append = sinon.spy();

  Element.prototype.prepend = sinon.spy();

  Element.prototype.css = sinon.spy();

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
      isInstance: function() { return false; },
      isOverOneDayOnly: sinon.spy(),
      isPrivate: sinon.stub().returns(false)
    };

    element = new Element();
    fcContent = new Element();
    fcTitle = new Element();
    fcTime = new Element();
    eventIconsDivInMobile = new Element();
    view = {name: 'month'};
    element.innerElements['.fc-content'] = fcContent;
    element.innerElements['.fc-title'] = fcTitle;
    element.innerElements['.fc-time'] = fcTime;
    fcTitle.innerElements['.event-icons-mobile'] = eventIconsDivInMobile;

    this.escapeHTMLMockResult = {};
    this.escapeHTMLMock = {
      escapeHTML: sinon.stub().returns(this.escapeHTMLMockResult)
    };

    this.matchmediaMock = {
      is: sinon.spy()
    };

    angular.mock.module(function($provide) {
      $provide.value('escapeHtmlUtils', self.escapeHTMLMock);
      $provide.value('matchmedia', self.matchmediaMock);
    });
  });

  beforeEach(angular.mock.inject(function(calEventUtils, $rootScope, calMoment, CalendarShell, escapeHtmlUtils, matchmedia, SM_XS_MEDIA_QUERY, CAL_MAX_DURATION_OF_SMALL_EVENT) {
    this.calEventUtils = calEventUtils;
    this.$rootScope = $rootScope;
    this.calMoment = calMoment;
    this.CalendarShell = CalendarShell;
    this.escapeHtmlUtils = escapeHtmlUtils;
    this.matchmedia = matchmedia;
    this.SM_XS_MEDIA_QUERY = SM_XS_MEDIA_QUERY;
    this.CAL_MAX_DURATION_OF_SMALL_EVENT = CAL_MAX_DURATION_OF_SMALL_EVENT;
    event.start = calMoment();
    event.end = event.start.add(this.CAL_MAX_DURATION_OF_SMALL_EVENT.DESKTOP, 'minutes');
    this.recurrentEventIcon = angular.element('<i class="mdi mdi-sync"/>');
    this.maybeEventIcon = angular.element('<i class="mdi mdi-help-circle"/>');
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

    describe('addTooltipToEvent function', function() {

      it('should add a tooltip in all views', function() {
        fcContent.attr = sinon.spy();
        this.calEventUtils.render(event, element, view);

        expect(fcContent.attr).to.have.been.calledWith('title', event.title);
      });
    });

    describe('changeEventColorWhenMonthView function', function() {

      it('should change CSS if we are in month view and the event is not allDay and event.isOverOneDayOnly() return true', function() {
        var backgroundColor = 'blue';

        element.css = sinon.spy(function(attr) {
          if (attr === 'background-color') {
            return backgroundColor;
          }
        });

        event.isOverOneDayOnly = sinon.stub().returns(true);

        this.calEventUtils.render(event, element, view);

        expect(element.css).to.have.been.calledWith('color', backgroundColor);
        expect(element.css).to.have.been.calledWith('background-color', 'transparent');
        expect(fcTime.css).to.have.been.calledWith('background-color', 'transparent');
        expect(element.css).to.have.been.calledWith('border', '0');
      });

      it('should not change CSS if we are in month vue and the event is not allDay and event.isOverOneDayOnly() return false', angular.mock.inject(function() {
        var backgroundColor = 'blue';

        element.css = sinon.spy(function(attr) {
          if (attr === 'background-color') {
            return backgroundColor;
          }
        });

        event.isOverOneDayOnly = sinon.stub().returns(false);

        this.calEventUtils.render(event, element, view);

        expect(element.css).to.have.not.been.called;
      }));

      it('should not change CSS if we are in month view and the event is allDay', function() {
        var backgroundColor = 'blue';

        event.allDay = true;

        element.css = sinon.spy(function(attr) {
          if (attr === 'background-color') {
            return backgroundColor;
          }
        });
        this.calEventUtils.render(event, element, view);

        expect(element.css).to.have.not.been.called;
      });
    });

    describe('adaptTitleWhenShortEvent function', function() {

      it('should display event title instead of time if the event duration under the max duration of a small event', angular.mock.inject(function() {
        element.innerElements['.fc-time'].length = 1;
        fcTime.attr = sinon.spy();

        this.calEventUtils.render(event, element, view);

        expect(fcTime.attr).to.have.been.calledWith('data-start', event.start.format('hh:mm') + ' - ' + event.title);
      }));
    });

    describe('appendLocation function', function() {

      it('should display the location if the location is defined', function() {
        event.location = 'location';

        this.calEventUtils.render(event, element, view);

        expect(this.escapeHTMLMock.escapeHTML).to.have.been.calledWith(event.location);
        expect(element.class).to.include('event-with-location');
      });

      it('should not display the location if the location is not defined', function() {
        this.calEventUtils.render(event, element, view);

        expect(element.class).to.not.include('event-with-location');
      });
    });

    describe('appendDescription function', function() {

      it('should add a title attribute if description is defined', function() {
        event.description = 'aDescription';

        this.calEventUtils.render(event, element, view);

        expect(this.escapeHTMLMock.escapeHTML).to.have.been.calledWith(event.description);
        expect(element.attributes.title).to.equal(this.escapeHTMLMockResult);
      });

      it('should not add a title attribute if description is not defined', function() {
        this.calEventUtils.render(event, element, view);

        expect(element.attributes.title).to.deep.equal({});
      });
    });

    describe('checkUserIsOrganizer function', function() {

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
    });

    describe('addIcons function', function() {

      describe('mobile View', function() {

        beforeEach(function() {
          var SM_XS_MEDIA_QUERY = this.SM_XS_MEDIA_QUERY;

          fcTitle.prepend = sinon.spy();

          eventIconsDivInMobile.append = sinon.spy();

          this.matchmedia.is = function(mediaquery) {
            expect(mediaquery).to.equal(SM_XS_MEDIA_QUERY);
            return true;
          };
        });

        describe('addIconInEventInstanceInMobile function', function() {

          it('should add the event-is-instance class for instances if the event is recurrent', function() {
            event.isInstance = function() { return true; };

            this.calEventUtils.render(event, element, view);

            expect(element.class).to.include('event-is-instance');
          });

          it('should not add the event-is-instance class for instances if the event is not recurrent', function() {
            event.isInstance = function() { return false; };

            this.calEventUtils.render(event, element, view);

            expect(element.class).to.not.include('event-is-instance');
          });

          it('should add the recurrent event icon in the title div if the event is recurrent and allDay', function() {
            event.isInstance = function() { return true; };
            event.allDay = true;

            this.calEventUtils.render(event, element, view);

            expect(fcTitle.prepend).to.have.been.calledWith('<i class="mdi mdi-sync"/>');
          });

          it('should add the recurrent event icon in the title div if the event is recurrent and not allDay and event Duration <= one hour', function() {
            event.isInstance = function() { return true; };

            this.calEventUtils.render(event, element, view);

            expect(fcTitle.prepend).to.have.been.calledWith('<i class="mdi mdi-sync"/>');
          });

          it('should add the recurrent event icon in the eventIconsDivInMobile div after location if the event is recurrent and not allDay and event duration > one hour', function() {
            event.start = this.calMoment();
            event.end = event.start.clone().add(this.CAL_MAX_DURATION_OF_SMALL_EVENT.MOBILE + 1, 'minutes');

            event.isInstance = function() { return true; };

            this.calEventUtils.render(event, element, view);

            expect(eventIconsDivInMobile.append).to.have.been.calledWith('<i class="mdi mdi-sync"/>');
          });
        });

        describe('addIconForAttendeesInMobile function', function() {

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

          it('should add event-tentative class if current user is found in the TENTATIVE attendees and the event is an allDay event', function() {
            event.attendees.push({
              email: userEmail,
              partstat: 'TENTATIVE'
            });
            event.allDay = true;

            this.calEventUtils.render(event, element, view);

            expect(fcTitle.prepend).to.have.been.calledWith('<i class="mdi mdi-help-circle"/>');
          });

          it('should add maybe event icone before the title if current user is found in the TENTATIVE attendees and the event is not an allDay event and the duration <= one hour', function() {
            event.attendees.push({
              email: userEmail,
              partstat: 'TENTATIVE'
            });

            this.calEventUtils.render(event, element, view);

            expect(fcTitle.prepend).to.have.been.calledWith('<i class="mdi mdi-help-circle"/>');
          });

          it('should add maybe event icone after the title if current user is found in the TENTATIVE attendees and the event is not an allDay event and the duration > one hour', function() {
            event.start = this.calMoment();
            event.end = event.start.clone().add(this.CAL_MAX_DURATION_OF_SMALL_EVENT.MOBILE + 1, 'minutes');
            event.attendees.push({
              email: userEmail,
              partstat: 'TENTATIVE'
            });

            this.calEventUtils.render(event, element, view);

            expect(eventIconsDivInMobile.append).to.have.been.calledWith('<i class="mdi mdi-help-circle"/>');
          });
        });

        describe('addIconInPrivateEventInMobile function', function() {

          it('should add the private event icon in the title div if the event is private and allDay', function() {
            event.isPrivate = function() { return true; };
            event.allDay = true;

            this.calEventUtils.render(event, element, view);

            expect(fcTitle.prepend).to.have.been.calledWith('<i class="mdi mdi-lock"/>');
          });

          it('should add the private event icon in the title div if the event is private and not allDay and event Duration <= one hour', function() {
            event.isPrivate = function() { return true; };

            this.calEventUtils.render(event, element, view);

            expect(fcTitle.prepend).to.have.been.calledWith('<i class="mdi mdi-lock"/>');
          });

          it('should add the private event icon in the eventIconsDivInMobile div after location if the event is private and not allDay and event duration > one hour', function() {
            event.start = this.calMoment();
            event.end = event.start.clone().add(this.CAL_MAX_DURATION_OF_SMALL_EVENT.MOBILE + 1, 'minutes');

            event.isPrivate = function() { return true; };

            this.calEventUtils.render(event, element, view);

            expect(eventIconsDivInMobile.append).to.have.been.calledWith('<i class="mdi mdi-lock"/>');
          });
        });
      });

      describe('desktop view', function() {

        beforeEach(function() {
          var SM_XS_MEDIA_QUERY = this.SM_XS_MEDIA_QUERY;

          fcTitle.prepend = sinon.spy();

          fcTime.prepend = sinon.spy();

          this.matchmedia.is = function(mediaquery) {
            expect(mediaquery).to.equal(SM_XS_MEDIA_QUERY);
            return false;
          };
        });

        describe('addIconInEventInstanceInDesktop function', function() {

          it('should add the event-is-instance class for instances if the event is recurrent', function() {
            event.isInstance = function() { return true; };
            event.allDay = true;

            this.calEventUtils.render(event, element, view);

            expect(element.class).to.include('event-is-instance');
          });

          it('should not add the event-is-instance class for instances if the event is not recurrent', function() {
            event.isInstance = function() { return false; };

            this.calEventUtils.render(event, element, view);

            expect(element.class).to.not.include('event-is-instance');
          });

          it('should add the recurrentEventIcon in the title div if the event is recurrent and allDay', function() {
            event.isInstance = function() { return true; };
            event.allDay = true;

            this.calEventUtils.render(event, element, view);

            expect(fcTitle.prepend).to.have.been.calledWith('<i class="mdi mdi-sync"/>');
          });

          it('should add the recurrentEventIcon in the time div if the event is recurrent and not allDay', function() {
            event.isInstance = function() { return true; };

            this.calEventUtils.render(event, element, view);

            expect(fcTime.prepend).to.have.been.calledWith('<i class="mdi mdi-sync"/>');
          });
        });

        describe('addIconForAttendeesInDesktop function', function() {

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

          it('should add event-tentative class if current user is found in the TENTATIVE attendees', function() {
            event.attendees.push({
              email: userEmail,
              partstat: 'TENTATIVE'
            });
            event.allDay = true;

            this.calEventUtils.render(event, element, view);

            expect(element.class).to.deep.equal(['event-tentative']);
          });

          it('should add maybe event icon in the title div if current user is found in the TENTATIVE attendees and it is an allDay event', function() {
            event.attendees.push({
              email: userEmail,
              partstat: 'TENTATIVE'
            });
            event.allDay = true;

            this.calEventUtils.render(event, element, view);

            expect(fcTitle.prepend).to.have.been.calledWith('<i class="mdi mdi-help-circle"/>');
          });

          it('should add maybe event icon in time div if current user is found in the TENTATIVE attendees and it is not an allDay event', function() {
            event.attendees.push({
              email: userEmail,
              partstat: 'TENTATIVE'
            });

            this.calEventUtils.render(event, element, view);

            expect(fcTime.prepend).to.have.been.calledWith('<i class="mdi mdi-help-circle"/>');
          });
        });

        describe('addIconInPrivateEventInDesktop function', function() {

          it('should add the private event icon in the title div if the event is private and allDay', function() {
            event.isPrivate = function() { return true; };
            event.allDay = true;

            this.calEventUtils.render(event, element, view);

            expect(fcTitle.prepend).to.have.been.calledWith('<i class="mdi mdi-lock"/>');
          });

          it('should add the private event icon in the time div if the event is private and not allDay', function() {
            event.isPrivate = function() { return true; };

            this.calEventUtils.render(event, element, view);

            expect(fcTime.prepend).to.have.been.calledWith('<i class="mdi mdi-lock"/>');
          });
        });
      });
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

  describe('getUserAttendee fn', function() {

    it('should return undefined when event has no "attendees" property', function() {
      expect(this.calEventUtils.getUserAttendee({})).to.equal(undefined);
    });

    it('should return undefined when event has 0 attendees', function() {
      expect(this.calEventUtils.getUserAttendee({ attendees: [] })).to.equal(undefined);
    });

    it('should return undefined when user is not found in event attendees', function() {
      expect(this.calEventUtils.getUserAttendee({
        attendees: [{
          email: 'contact@domain.com'
        }]
      })).to.equal(undefined);
    });

    it('should return null when user is not found in event attendees', function() {
      var attendee = {
        email: 'aAttendee@open-paas.org'
      };

      expect(this.calEventUtils.getUserAttendee({ attendees: [attendee] })).to.deep.equal(attendee);
    });

  });

});
