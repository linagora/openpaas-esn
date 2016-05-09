'use strict';

var expect = require('chai').expect;
var sinon = require('sinon');
var mockery = require('mockery');

describe('Caldav-client helper', function() {
  var authMock, davserverMock;
  var davEndpoint = 'http://davendpoint:8003';

  beforeEach(function() {
    this.calendarModulePath = this.moduleHelpers.modulesPath + 'linagora.esn.calendar';
    authMock = {};
    davserverMock = {
      utils: {
        getDavEndpoint: sinon.spy(function(callback) {
          return callback(davEndpoint);
        })
      }
    };
    this.moduleHelpers.addDep('davserver', davserverMock);
    this.requireModule = function() {
      return require(this.calendarModulePath + '/backend/lib/caldav-client')(this.moduleHelpers.dependencies);
    };
  });

  describe('the getEvent function', function() {

    it('should fail if token retrieval fails', function(done) {
      var userId = 'user1';
      authMock = {
        token: {
          getNewToken: sinon.spy(function(opts, callback) {
            return callback(new Error());
          })
        }
      };
      this.moduleHelpers.addDep('auth', authMock);
      this.requireModule().getEvent(userId, 'calendarId', 'eventUid').then(function() {
        done('The promise should not have successed');
      }, function(err) {
        expect(err).to.exist;
        expect(authMock.token.getNewToken).to.have.been.calledWith({user: userId});
        expect(davserverMock.utils.getDavEndpoint).to.have.been.called;
        done();
      });
    });

    it('should call request with the built parameters and reject if it fails', function(done) {
      var userId = 'user1';
      var calendarId = 'calendar2';
      var eventUid = 'event3';
      var token = 'aToken';
      authMock = {
        token: {
          getNewToken: sinon.spy(function(opts, callback) {
            return callback(null, {token: token});
          })
        }
      };
      this.moduleHelpers.addDep('auth', authMock);

      var requestMock = function(opts, callback) {
        expect(opts).to.deep.equal({
          method: 'GET',
          url: [davEndpoint, 'calendars', userId, calendarId, eventUid + '.ics'].join('/'),
          headers: {ESNToken: token}
        });
        callback(new Error());
      };
      mockery.registerMock('request', requestMock);

      this.requireModule().getEvent(userId, calendarId, eventUid).then(function() {
        done('The promise should not have successed');
      }, function(err) {
        expect(err).to.exist;
        expect(authMock.token.getNewToken).to.have.been.calledWith({user: userId});
        expect(davserverMock.utils.getDavEndpoint).to.have.been.called;
        done();
      });
    });

    it('should call request with the built parameters and resolve with its results if it succeeds', function(done) {
      var userId = 'user1';
      var calendarId = 'calendar2';
      var eventUid = 'event3';
      var token = 'aToken';
      authMock = {
        token: {
          getNewToken: sinon.spy(function(opts, callback) {
            return callback(null, {token: token});
          })
        }
      };
      this.moduleHelpers.addDep('auth', authMock);

      var requestMock = function(opts, callback) {
        expect(opts).to.deep.equal({
          method: 'GET',
          url: [davEndpoint, 'calendars', userId, calendarId, eventUid + '.ics'].join('/'),
          headers: {ESNToken: token}
        });
        callback(null, {body: 'result'});
      };
      mockery.registerMock('request', requestMock);

      this.requireModule().getEvent(userId, calendarId, eventUid).then(function(event) {
        expect(event).to.deep.equal('result');
        expect(authMock.token.getNewToken).to.have.been.calledWith({user: userId});
        expect(davserverMock.utils.getDavEndpoint).to.have.been.called;
        done();
      }, done);
    });

  });

});
