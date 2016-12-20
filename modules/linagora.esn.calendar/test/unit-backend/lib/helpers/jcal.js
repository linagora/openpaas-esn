'use strict';

var expect = require('chai').expect;
var fs = require('fs-extra');
var icaljs = require('ical.js');

describe('jcalHelper', function() {

  beforeEach(function() {
    this.calendarModulePath = this.moduleHelpers.modulesPath + 'linagora.esn.calendar';
    this.jcalHelper = require(this.calendarModulePath + '/backend/lib/helpers/jcal');
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

  describe('getVAlarmAsObject function', function() {
    beforeEach(function() {
      this.getAlarmObject = function(fileName) {
        const ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/' + fileName).toString('utf8');
        const vcalendar = icaljs.Component.fromString(ics);
        const vevent = vcalendar.getFirstSubcomponent('vevent');
        const valarm = vevent.getFirstSubcomponent('valarm');
        return this.jcalHelper.getVAlarmAsObject(valarm, vevent.getFirstProperty('dtstart'));
      };
    });

    it('should parse and return an object with email and attendee part for a VALARM with action === EMAIL', function() {
      const alarmObject = this.getAlarmObject('withVALARM.ics');

      expect(alarmObject).to.shallowDeepEqual({
        action: 'EMAIL',
        attendee: 'mailto:slemaistre@gmail.com',
        email: 'slemaistre@gmail.com',
        trigger: '-P1D',
        summary: 'Pending event! Event: Victor Sanders'
      });
    });

    it('should parse and return an object without email and attendee part for a VALARM with action !== EMAIL', function() {
      const alarmObject = this.getAlarmObject('withNotEMAILValarm.ics');

      expect(alarmObject).to.shallowDeepEqual({
        action: 'DISPLAY',
        trigger: '-P1D',
        summary: 'Pending event! Event: Victor Sanders'
      });
      expect(alarmObject.attendee).to.not.exist;
      expect(alarmObject.email).to.not.exist;
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
        uid: 'f1514f44bf39311568d640721cbc555071ca90e08d3349ccae43e1787553988ae047feb2aab16e43439a608f28671ab7c10e754cec5324c4e4cd93f443dc3934f6c5d2e592a8112c',
        start: {
          date: '06/12/2015',
          time: '1:00 PM',
          timezone: 'UTC'
        },
        end: {
          date: '06/12/2015',
          time: '1:30 PM',
          timezone: 'UTC'
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

    it('should parse jcal formatted event without organizer', function() {
      ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/meeting-without-organizer.ics').toString('utf8');
      expect(this.jcalHelper.jcal2content(ics, 'http://localhost:8080/')).to.deep.equal({
        method: 'REQUEST',
        sequence: 0,
        summary: 'Démo OPENPAAS',
        uid: 'f1514f44bf39311568d640721cbc555071ca90e08d3349ccae43e1787553988ae047feb2aab16e43439a608f28671ab7c10e754cec5324c4e4cd93f443dc3934f6c5d2e592a8112c',
        start: {
          date: '06/12/2015',
          time: '1:00 PM',
          timezone: 'UTC'
        },
        end: {
          date: '06/12/2015',
          time: '1:30 PM',
          timezone: 'UTC'
        },
        allDay: false,
        durationInDays: 0,
        location: 'https://hubl.in/openpaas',
        description: 'Présentation de OPENPAAS',
        organizer: undefined,
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

    it('should correctly parse date with a specified timezone', function() {
      ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/meeting-tzid.ics').toString('utf8');
      expect(this.jcalHelper.jcal2content(ics, 'http://localhost:8080/')).to.shallowDeepEqual({
        start: {
          date: '06/12/2015',
          time: '1:00 PM',
          timezone: 'America/New_York'
        },
        end: {
          date: '06/12/2015',
          time: '1:30 PM',
          timezone: 'America/New_York'
        }
      });
    });

    it('should correctly parse date with different specified timezone for start and end', function() {
      ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/flight-event.ics').toString('utf8');
      expect(this.jcalHelper.jcal2content(ics, 'http://localhost:8080/')).to.shallowDeepEqual({
        start: {
          date: '06/12/2015',
          time: '1:00 PM',
          timezone: 'America/New_York'
        },
        end: {
          date: '06/12/2015',
          time: '5:00 PM',
          timezone: 'Europe/Paris'
        }
      });
    });

    it('should correctly parse floating date by passing them as they are', function() {
      ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/meeting-floating.ics').toString('utf8');
      expect(this.jcalHelper.jcal2content(ics, 'http://localhost:8080/')).to.shallowDeepEqual({
        start: {
          date: '06/12/2015',
          time: '1:00 PM'
        },
        end: {
          date: '06/12/2015',
          time: '1:30 PM'
        }
      });
    });

    it('should parse jcal formatted event using the cancel method', function() {
      ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/cancel-event.ics').toString('utf8');
      expect(this.jcalHelper.jcal2content(ics, 'http://localhost:8080/')).to.deep.equal({
        method: 'CANCEL',
        sequence: 0,
        summary: 'Démo OPENPAAS',
        uid: 'f1514f44bf39311568d640721cbc555071ca90e08d3349ccae43e1787553988ae047feb2aab16e43439a608f28671ab7c10e754cec5324c4e4cd93f443dc3934f6c5d2e592a8112c',
        start: {
          date: '06/12/2015',
          time: '1:00 PM',
          timezone: 'UTC'
        },
        end: {
          date: '06/12/2015',
          time: '2:00 PM',
          timezone: 'UTC'
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
        uid: 'f1514f44bf39311568d640721cbc555071ca90e08d3349ccae43e1787553988ae047feb2aab16e43439a608f28671ab7c10e754cec5324c4e4cd93f443dc3934f6c5d2e592a8112c',
        start: {
          date: '06/12/2015'
        },
        end: {
          date: '09/11/2015'
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

    it('should parse jcal with one valarm component', function() {
      ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/withVALARM.ics').toString('utf8');
      expect(this.jcalHelper.jcal2content(ics, 'http://localhost:8080/')).to.shallowDeepEqual({
        method: 'REQUEST',
        sequence: 0,
        summary: 'Démo OPENPAAS',
        uid: 'f1514f44bf39311568d640721cbc555071ca90e08d3349ccae43e1787553988ae047feb2aab16e43439a608f28671ab7c10e754cec5324c4e4cd93f443dc3934f6c5d2e592a8112c',
        start: {
          date: '06/12/2015'
        },
        end: {
          date: '09/11/2015'
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
        },
        alarm: {
          action: 'EMAIL',
          trigger: '-P1D',
          description: 'This is an automatic alarm sent by OpenPaas',
          summary: 'Pending event! Event: Victor Sanders',
          attendee: 'mailto:slemaistre@gmail.com',
          triggerDisplay: 'a day'
        }
      });
    });
  });

});
