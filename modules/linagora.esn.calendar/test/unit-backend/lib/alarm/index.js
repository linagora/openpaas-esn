'use strict';

var expect = require('chai').expect;
var fs = require('fs');
var sinon = require('sinon');
var q = require('q');

describe('jcalHelper', function() {
  var contentSender, helpers;

  beforeEach(function() {
    this.calendarModulePath = this.moduleHelpers.modulesPath + 'linagora.esn.calendar';
    contentSender = { send: sinon.stub().returns(q.when({})) };
    helpers = {
      config: {
        getBaseUrl: function(callback) {
          callback(null, 'http://localhost:8080/');
        }
      }
    };
    this.moduleHelpers.addDep('content-sender', contentSender);
    this.moduleHelpers.addDep('helpers', helpers);
    this.requireModule = function() {
      return require(this.calendarModulePath + '/backend/lib/alarm')(this.moduleHelpers.dependencies);
    };

  });

  it('should call contentSender.send with correct arguments', function() {
    var ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/withVALARM.ics').toString('utf8');
    this.requireModule().sendAlarmEmail(ics, 'test@open-paas.org');
    expect(contentSender.send).to.have.been.calledWith(
      { id: 'noreply@open-paas.org', objectType: 'email' },
      { id: 'test@open-paas.org', objectType: 'email' },
      sinon.match.has('alarm'),
      {
        message: { subject: 'Pending event! Event: Victor Sanders' },
        template: 'event.alarm'
      },
      'email'
    );
  });

  it('should reject err if jcal2content fail', function(done) {
    var ics = fs.readFileSync(this.calendarModulePath + '/test/unit-backend/fixtures/invalid.ics').toString('utf8');
    this.requireModule().sendAlarmEmail(ics, 'test@open-paas.org').then(function() {
      done(new Error('should not be there'));
    }, function() {
      done();
    });
  });
});
