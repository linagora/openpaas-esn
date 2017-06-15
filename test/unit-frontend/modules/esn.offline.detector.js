'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe.only('The esn.background Angular module', function() {
    var $rootScope, offlineDetectorApi, ioSocketConnectionMock, isConnectedResult;

    beforeEach(angular.mock.module('esn.offline.detector', function($provide) {
        isConnectedResult = "isConnectedResult";
        ioSocketConnectionMock = {
            addConnectCallback: sinon.spy(),
            addDisconnectCallback: sinon.spy(),
            isConnected: sinon.stub().returns(isConnectedResult)
        };

        $provide.value('ioSocketConnection', ioSocketConnectionMock);
    }));

    beforeEach(angular.mock.inject(function(_$rootScope_, _offlineDetectorApi_) {
        $rootScope = _$rootScope_;
        offlineDetectorApi = _offlineDetectorApi_;
    }));

    describe('isOnline attribute', function() {
       it('should take ioSocketConnection.isConnected value', function() {
           expect(ioSocketConnectionMock.isConnected).to.have.been.called;

           expect(offlineDetectorApi.isOnline).to.equal(isConnectedResult);
       });

       it('should register a callback, that set isOnline to true, on ioSocketConnection.addConnectCallback', function() {
           offlineDetectorApi.isOnline = false;
           expect(ioSocketConnectionMock.addConnectCallback).to.be.calledWith(sinon.match.func.and(sinon.match(function(callback) {
               callback();
               expect(offlineDetectorApi.isOnline).to.be.true;
               return true;
           })));
       });

       it('should register a callback, that set isOnline to false, on ioSocketConnection.addDisconnectCallback', function() {
           offlineDetectorApi.isOnline = true;
           expect(ioSocketConnectionMock.addDisconnectCallback).to.be.calledWith(sinon.match.func.and(sinon.match(function(callback) {
               callback();
               expect(offlineDetectorApi.isOnline).to.be.false;
               return true;
           })));
       })
    });

    describe('network:available event', function() {
        it('should broadcast network:available, when isOnline is false', function() {
            offlineDetectorApi.isOnline = false;
            var broadcastSpy = sinon.spy($rootScope, '$broadcast');
            $rootScope.$broadcast('network:available', offlineDetectorApi.isOnline);
            expect(broadcastSpy).to.have.been.calledWith('network:available', false);
        });

        it('should broadcast network:available, when isOnline is true', function() {
            offlineDetectorApi.isOnline = true;
            var broadcastSpy = sinon.spy($rootScope, '$broadcast');
            $rootScope.$broadcast('network:available', offlineDetectorApi.isOnline);
            expect(broadcastSpy).to.have.been.calledWith('network:available', true);
        });
    });
});
