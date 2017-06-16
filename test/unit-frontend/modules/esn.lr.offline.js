'use strict';

/* global chai, sinon: false */

var expect = chai.expect;

describe('The esn.offline Angular module', function() {
  var $rootScope, localStorageServiceMock, offlineApi, OFFLINE_RECORD, localRecord, storageData;

  beforeEach(angular.mock.module('esn.offline', function($provide) {
    storageData = {};
    var storage = {
      getItem: function(id) {
        return $q.when(storageData[id]);
      },
      setItem: function(id, localRecords) {

        storageData[id] = localRecords;

        return $q.when(localRecords);
      }
    };

    localStorageServiceMock = {
      getOrCreateInstance: sinon.stub().returns(storage)
    };

    $provide.value('localStorageService', localStorageServiceMock);

    localRecord = {module: 'myModule', action: 'create', payload: {}};
  }));

  beforeEach(angular.mock.inject(function(_$rootScope_, _offlineApi_, _OFFLINE_RECORD_) {
    $rootScope = _$rootScope_;
    offlineApi = _offlineApi_;
    OFFLINE_RECORD = _OFFLINE_RECORD_;
  }));

  describe('activate function', function() {
    it('should record a callback on event network:available', function() {
      var onSpy = sinon.spy($rootScope, '$on');

      offlineApi.activate();
      expect(onSpy).to.have.been.calledWith('network:available', sinon.match.func);
    });
  });

  describe('recordAction function', function() {
    it('should record an action on local storage when called', function() {
      var thenSpy = sinon.spy(function(status) {
        expect(status.localRecord.id).to.exist;
        expect(localStorageServiceMock.getOrCreateInstance).to.have.been.calledWith(OFFLINE_RECORD);
        //expect(status.localRecord).to.shallow.equals(localRecord);
        expect(storageData[localRecord.module]).to.deep.equals([status.localRecord]);
      });

      offlineApi.recordAction(localRecord).then(thenSpy);
      $rootScope.$digest();
      expect(thenSpy).to.have.been.calledOnce;
    });
  });

  describe('listActions function', function() {
    it('should list recorded actions', function() {
      offlineApi.recordAction(localRecord);
      $rootScope.$digest();
      var thenSpy = sinon.spy();

      offlineApi.listActions(localRecord.module).then(thenSpy);
      $rootScope.$digest();
      expect(thenSpy).to.have.been.calledWith(sinon.match({
        length: 1,
        0: localRecord
      }));

      expect(localStorageServiceMock.getOrCreateInstance).to.have.been.calledWith(OFFLINE_RECORD);
    });
  });

  describe('removeAction function', function() {
    it('should not fail if the recorded action is not found', function() {
      var thenSpy = sinon.spy();

      offlineApi.removeAction(localRecord).then(thenSpy);

      $rootScope.$digest();
      expect(thenSpy).to.have.been.calledOnce;

      thenSpy = sinon.spy();
      offlineApi.listActions(localRecord.module).then(thenSpy);
      $rootScope.$digest();
      expect(thenSpy).to.have.been.calledWith([]);
    });

    it('should remove recorded action', function() {
      var thenSpy = sinon.spy();

      offlineApi.recordAction(localRecord).then(function(data) {
        offlineApi.removeAction(data.localRecord);

        offlineApi.listActions(localRecord.module).then(thenSpy);
      });

      $rootScope.$digest();
      expect(thenSpy).to.have.been.calledWith([]);
    });

    it('should remove recorded action', function() {
      offlineApi.removeAction(localRecord).then(function(data) {
        expect(data[0]).to.not.be.equal(localRecord);
        expect(localStorageServiceMock.getOrCreateInstance).to.have.been.calledWith(OFFLINE_RECORD);
      });
      $rootScope.$digest();
    });
  });
});
