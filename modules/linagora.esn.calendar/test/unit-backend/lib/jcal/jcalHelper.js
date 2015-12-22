'use strict';

var expect = require('chai').expect;
var fs = require('fs-extra');
var icaljs = require('ical.js');
var mockery = require('mockery');
var moment = require('moment-timezone');

describe('jcalHelper', function() {

  beforeEach(function() {
    this.calendarModulePath = this.moduleHelpers.modulesPath + 'linagora.esn.calendar';
    mockery.registerMock('moment', function(date) { return moment(date).utc(); });
    this.jcalHelper = require(this.calendarModulePath + '/backend/lib/jcal/jcalHelper');
  });

  describe('the getAttendeesEmails function', function() {
    it('should return an empty array if the ical component has no attendee', function() {
      var ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/noAttendee.ics').toString('utf8');
      var vcalendar = icaljs.Component.fromString(ics).toJSON();
      expect(this.jcalHelper.getAttendeesEmails(vcalendar)).to.deep.equal([]);
    });

    it('should get the attendees emails from the ical component', function() {
      var ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/meeting.ics').toString('utf8');
      var vcalendar = icaljs.Component.fromString(ics).toJSON();
      expect(this.jcalHelper.getAttendeesEmails(vcalendar)).to.deep.equal(['johndoe@open-paas.org', 'janedoe@open-paas.org']);
    });
  });

  describe('the getOrganizerEmail function', function() {
    it('should return undefined if the ical component has no organizer', function() {
      var ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/noOrganizer.ics').toString('utf8');
      var vcalendar = icaljs.Component.fromString(ics).toJSON();
      expect(this.jcalHelper.getOrganizerEmail(vcalendar)).to.be.undefined;
    });

    it('should return the organizer email from the ical component', function() {
      var ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/meeting.ics').toString('utf8');
      var vcalendar = icaljs.Component.fromString(ics).toJSON();
      expect(this.jcalHelper.getOrganizerEmail(vcalendar)).to.deep.equal('johndoe@open-paas.org');
    });
  });

  describe('getVeventAttendeeByMail', function() {
    beforeEach(function() {
      this.vevent = new icaljs.Component(icaljs.parse(fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/meeting.ics').toString('utf-8'))).getFirstSubcomponent('vevent');
    });

    it('should return undefined if no attendee with the given email', function() {
      expect(this.jcalHelper.getVeventAttendeeByMail(this.vevent, 'chuck@norris.com')).to.be.null;
    });

    it('should return the good attendee if a valid email is provided', function() {
      var attendee = this.jcalHelper.getVeventAttendeeByMail(this.vevent, 'johndoe@open-paas.org').toJSON();
      expect(attendee[1].cn).to.equal('John Doe');
    });
  });

  describe('jcal2content function', function() {
    var ics;

    it('should parse jcal formatted event and return a pruned content for the email', function() {
      ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/meeting.ics').toString('utf8');
      expect(this.jcalHelper.jcal2content(ics, 'http://localhost:8080/')).to.deep.equal({
        method: 'REQUEST',
        sequence: 0,
        summary: 'Démo OPENPAAS',
        start: {
          date: '06/12/2015',
          time: '1:00 PM'
        },
        end: {
          date: '06/12/2015',
          time: '1:30 PM'
        },
        allDay: false,
        durationInDays: 0,
        location: 'https://hubl.in/openpaas',
        description: 'Présentation de OPENPAAS',
        organizer: {
          cn: 'John Doe',
          email: 'johndoe@open-paas.org',
          avatar: 'http://localhost:8080/api/avatars?objectType=user&email=johndoe@open-paas.org'
        },
        attendees: {
          'johndoe@open-paas.org': {
            cn: 'John Doe',
            partstat: 'ACCEPTED'
          },
          'janedoe@open-paas.org': {
            cn: 'Jane Doe',
            partstat: 'NEEDS-ACTION'
          }
        }
      });
    });

    it('should parse jcal formatted event using the cancel method', function() {
      ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/cancel-event.ics').toString('utf8');
      expect(this.jcalHelper.jcal2content(ics, 'http://localhost:8080/')).to.deep.equal({
        method: 'CANCEL',
        sequence: 0,
        summary: 'Démo OPENPAAS',
        start: {
          date: '06/12/2015',
          time: '1:00 PM'
        },
        end: {
          date: '06/12/2015',
          time: '2:00 PM'
        },
        allDay: false,
        durationInDays: 0,
        location: 'https://hubl.in/openpaas',
        description: 'Présentation de OPENPAAS',
        organizer: {
          cn: 'John Doe',
          email: 'johndoe@open-paas.org',
          avatar: 'http://localhost:8080/api/avatars?objectType=user&email=johndoe@open-paas.org'
        },
        attendees: {
          'johndoe@open-paas.org': {
            cn: 'John Doe',
            partstat: 'ACCEPTED'
          },
          'janedoe@open-paas.org': {
            cn: 'Jane Doe',
            partstat: 'NEEDS-ACTION'
          }
        }
      });
    });

    it('should parse jcal formatted allDay event', function() {
      ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/allday.ics').toString('utf8');
      expect(this.jcalHelper.jcal2content(ics, 'http://localhost:8080/')).to.shallowDeepEqual({
        method: 'REQUEST',
        sequence: 0,
        summary: 'Démo OPENPAAS',
        start: {
          date: '06/11/2015'
        },
        end: {
          date: '09/10/2015'
        },
        allDay: true,
        durationInDays: 92,
        location: 'https://hubl.in/openpaas',
        description: 'Présentation de OPENPAAS',
        organizer: {
          cn: 'John Doe',
          email: 'johndoe@open-paas.org',
          avatar: 'http://localhost:8080/api/avatars?objectType=user&email=johndoe@open-paas.org'
        },
        attendees: {
          'johndoe@open-paas.org': {
            cn: 'John Doe',
            partstat: 'ACCEPTED'
          },
          'janedoe@open-paas.org': {
            cn: 'Jane Doe',
            partstat: 'NEEDS-ACTION'
          }
        }
      });
    });
  });

});
