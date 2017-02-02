'use strict';

const q = require('q'),
      mockery = require('mockery');
const expect = require('chai').expect;

describe('The Calendar autoconf transformer', function() {

  let modulePath, config;

  function transform() {
    return require(modulePath + '/backend/lib/autoconf')().transform(config, {
      id: 'id',
      preferredEmail: 'email'
    });
  }

  beforeEach(function() {
    config = {};
    modulePath = this.moduleHelpers.modulesPath + 'linagora.esn.calendar';
  });

  it('should call client.getCalendarList and reject if it rejects', function(done) {
    mockery.registerMock('../caldav-client', () => ({
      getCalendarList: () => q.reject(new Error('Fail'))
    }));

    transform().then(() => done('Test should have failed'), () => done());
  });

  it('should call client.getCalendarList and assign an empty list to config.calendar, if there is no calendars', function(done) {
    mockery.registerMock('../caldav-client', () => ({
      getCalendarList: () => q([])
    }));

    transform().then(() => {
      expect(config).to.deep.equal({ calendars: [] });

      done();
    }, () => done('This test should have passed'));
  });

  it('should call client.getCalendarList and assign an upgraded list to config.calendar', function(done) {
    mockery.registerMock('../caldav-client', () => ({
      getCalendarList: () => q([{ a: 1 }, { b: 2 }])
    }));

    transform().then(() => {
      expect(config).to.deep.equal({
        calendars: [
          { a: 1, username: 'email' },
          { b: 2, username: 'email' }
        ]
      });

      done();
    }, () => done('This test should have passed'));
  });

});
