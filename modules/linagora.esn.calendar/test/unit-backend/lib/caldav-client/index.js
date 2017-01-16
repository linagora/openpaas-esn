'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const mockery = require('mockery');

describe('Caldav-client helper', function() {
  let authMock, davServerMock, request;
  const davEndpoint = 'http://davendpoint:8003';
  const userId = 'user1';
  const calendarId = 'calendar2';
  const eventId = 'event3';
  const token = 'aToken';
  const jcal = {};

  beforeEach(function() {
    this.calendarModulePath = this.moduleHelpers.modulesPath + 'linagora.esn.calendar';
    authMock = {
      token: {
        getNewToken: sinon.spy(function(opts, callback) {
          return callback(null, {token: token});
        })
      }
    };

    davServerMock = {
      utils: {
        getDavEndpoint: sinon.spy(function(callback) {
          return callback(davEndpoint);
        })
      }
    };

    this.moduleHelpers.addDep('auth', authMock);
    this.moduleHelpers.addDep('davserver', davServerMock);
    this.requireModule = function() {
      return require(this.calendarModulePath + '/backend/lib/caldav-client')(this.moduleHelpers.dependencies);
    };
  });

  describe('the getEvent function', function() {
    beforeEach(function() {
      request = {
        method: 'GET',
        url: [davEndpoint, 'calendars', userId, calendarId, eventId + '.ics'].join('/'),
        headers: {ESNToken: token}
      };
    });

    it('should fail if token retrieval fails', function(done) {
      authMock.token.getNewToken = sinon.spy(function(opts, callback) {
        return callback(new Error());
      });

      this.requireModule().getEvent(userId, 'calendarId', 'eventUid').then(function() {
        done('The promise should not have successed');
      }, function(err) {
        expect(err).to.exist;
        expect(authMock.token.getNewToken).to.have.been.calledWith({user: userId});
        expect(davServerMock.utils.getDavEndpoint).to.have.been.called;
        done();
      });
    });

    it('should call request with the built parameters and reject if it fails', function(done) {
      const requestMock = function(opts, callback) {
        expect(opts).to.deep.equal(request);
        callback(new Error());
      };

      mockery.registerMock('request', requestMock);

      this.requireModule().getEvent(userId, calendarId, eventId).then(function() {
        done('The promise should not have successed');
      }, function(err) {
        expect(err).to.exist;
        expect(authMock.token.getNewToken).to.have.been.calledWith({user: userId});
        expect(davServerMock.utils.getDavEndpoint).to.have.been.called;
        done();
      });
    });

    it('should call request with the built parameters and resolve with its results if it succeeds', function(done) {
      const requestMock = function(opts, callback) {
        expect(opts).to.deep.equal(request);
        callback(null, {body: 'result'});
      };

      mockery.registerMock('request', requestMock);

      this.requireModule().getEvent(userId, calendarId, eventId).then(function(event) {
        expect(event).to.deep.equal('result');
        expect(authMock.token.getNewToken).to.have.been.calledWith({user: userId});
        expect(davServerMock.utils.getDavEndpoint).to.have.been.called;
        done();
      }, done);
    });

  });

  describe('the putEvent function', function() {
    beforeEach(function() {
        request = {
          method: 'PUT',
          url: [davEndpoint, 'calendars', userId, calendarId, eventId + '.ics'].join('/'),
          headers: {ESNToken: token},
          json: true,
          body: jcal
        };
      }
    );

    it('should fail if token retrieval fails', function(done) {
      authMock.token.getNewToken = sinon.spy(function(opts, callback) {
        return callback(new Error());
      });

      this.requireModule().putEvent(userId, calendarId, eventId, jcal).then(function() {
        done('The promise should not have successed');
      }, function(err) {
        expect(err).to.exist;
        expect(authMock.token.getNewToken).to.have.been.calledWith({user: userId});
        expect(davServerMock.utils.getDavEndpoint).to.have.been.called;
        done();
      });
    });

    it('should call request with the built parameters and reject if it fails', function(done) {
      const requestMock = function(opts, callback) {
        expect(opts).to.deep.equal(request);
        callback(new Error());
      };

      mockery.registerMock('request', requestMock);

      this.requireModule().putEvent(userId, calendarId, eventId, jcal).then(function() {
        done('The promise should not have successed');
      }, function(err) {
        expect(err).to.exist;
        expect(authMock.token.getNewToken).to.have.been.calledWith({user: userId});
        expect(davServerMock.utils.getDavEndpoint).to.have.been.called;
        done();
      });
    });

    it('should call request with the built parameters and resolve with its results if it succeeds', function(done) {
      const requestMock = function(opts, callback) {
        expect(opts).to.deep.equal(request);
        callback(null, {body: 'result'});
      };

      mockery.registerMock('request', requestMock);

      this.requireModule().putEvent(userId, calendarId, eventId, jcal).then(function(event) {
        expect(event).to.deep.equal('result');
        expect(authMock.token.getNewToken).to.have.been.calledWith({user: userId});
        expect(davServerMock.utils.getDavEndpoint).to.have.been.called;
        done();
      }, done);
    });
  });
});
