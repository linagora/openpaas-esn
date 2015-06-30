'use strict';

var expect = require('chai').expect;
var fs = require('fs-extra');
var jcal2content = require('../../../../backend/lib/jcal/jcal2content');

describe('jcal2content', function() {

  it('should parse jcal formatted event and return a pruned content for the email', function() {
    var ics = fs.readFileSync(__dirname + '/../../fixtures/meeting.ics').toString('utf8');
    expect(jcal2content(ics, 'http://localhost:8080/')).to.deep.equal({
      summary: 'Démo OPENPAAS',
      start: {
        date: '06/12/2015',
        time: '3:00 PM'
      },
      end: {
        date: '06/12/2015',
        time: '3:30 PM'
      },
      location: 'https://hubl.in/openpaas',
      description: 'Présentation de OPENPAAS',
      organizer: {
        cn: 'John Doe',
        mail: 'johndoe@open-paas.org',
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

  it('should parse jcal formatted event without end date nor duration', function() {
    var ics = fs.readFileSync(__dirname + '/../../fixtures/cancel-event.ics').toString('utf8');
    expect(jcal2content(ics, 'http://localhost:8080/')).to.deep.equal({
      summary: 'Démo OPENPAAS',
      start: {
        date: '06/12/2015',
        time: '3:00 PM'
      },
      end: null,
      location: 'https://hubl.in/openpaas',
      description: 'Présentation de OPENPAAS',
      organizer: {
        cn: 'John Doe',
        mail: 'johndoe@open-paas.org',
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
