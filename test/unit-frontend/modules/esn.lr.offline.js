'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esn.offline Angular module', function() {
    var $rootScope, offlineApi, offlineDetectorApi, OFFLINE_RECORD, uuid4;

    beforeEach(angular.mock.module('esn.offline', function($provide) {
        var storageData = {};
        var storage = {
            getItem: function(id) {
                return $q.when(storageData[id]);
            },
            setItem: function(id, localRecords) {
                storageData[id] = localRecords;
                return $q.when(localRecords);
            }
        };
        var localStorageServiceMock = {
            getOrCreateInstance: sinon.stub().returns(storage)
        };

        $provide.value('localStorageService', localStorageServiceMock);
    }));

    beforeEach(angular.mock.inject(function(_$rootScope_, _offlineApi_, _offlineDetectorApi_, _OFFLINE_RECORD_, _uuid4_) {
        $rootScope = _$rootScope_;
        offlineApi = _offlineApi_;
        offlineDetectorApi = _offlineDetectorApi_;
        OFFLINE_RECORD = _OFFLINE_RECORD_;
        uuid4 = _uuid4_;
    }));

    describe('activate function', function() {
        it('should execute onNetworkChange function on network:available', function() {
            var onSpy = sinon.spy($rootScope, '$on');
            offlineApi.activate();
            expect(onSpy).to.have.been.calledWith('network:available', sinon.match.func);
        });
    });

    describe('recordAction function', function() {
        var localRecord;

        beforeEach(function() {
            localRecord = {module: 'myModule', action: 'create', payload: {}};
        });

        it('should record an action on connection not available', function() {
            offlineDetectorApi.isOnline = false;
            offlineApi.recordAction(localRecord).then(function(status) {
                expect(status.localRecord.id).to.exist;
            });
            $rootScope.$digest();
        });
    });
});
