'use strict';

var expect = require('chai').expect;
var fs = require('fs-extra');

describe('jscal2content', function() {
  var ics;

  before(function() {
    ics = fs.readFileSync(__dirname + '/../../fixtures/meeting.ics').toString('utf8');
  });

  it('should parse jcal formatted event and return a pruned content for the email', function() {
    var jcal2content = require('../../../../backend/lib/jcal/jcal2content');
    expect(jcal2content(ics)).to.deep.equal({
      summary: 'Démo OPENPAAS',
      start: 'Fri, Jun 12, 2015 3:00 PM',
      end: 'Fri, Jun 12, 2015 3:30 PM',
      location: 'https://hubl.in/openpaas',
      description: 'Présentation de OPENPAAS',
      organizer: 'John Doe <johndoe@open-paas.org>',
      attendees: {
        'John Doe <johndoe@open-paas.org>': 'ACCEPTED',
        'Jane Doe <janedoe@open-paas.org>': 'NEEDS-ACTION'
      }
    });
  });

});
