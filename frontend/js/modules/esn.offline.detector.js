/**
 * offlineDetectorApi Service
 * @namespace esn.offline.detector
 */
(function() {
  'use strict';

  angular
    .module('esn.offline.detector', ['esn.websocket'])
    .factory('offlineDetectorApi', offlineDetectorApi)
    .run(function(offlineDetectorApi) {
      offlineDetectorApi.activate();
    });

  /**
   * @namespace offlineDetectorApi
   * @desc Service to detect offline/online event
   * @memberOf esn.offline.detector
   */
  function offlineDetectorApi($rootScope, ioSocketConnection) {
    var service = {
      activate: activate,
      online: ioSocketConnection.isConnected()
    };
    return service;

    ////////////

    /**
     * @name activate
     * @desc Activation function launch at service instantiation
     * @memberOf esn.offline.detector.offlineDetectorApi
     */
    function activate() {
     ioSocketConnection.addConnectCallback(() => {setNetworkActivity(true);});
     ioSocketConnection.addDisconnectCallback(() => {setNetworkActivity(false);});
    }

    /**
     * @name setNetworkActivity
     * @desc Set network activity based on websocket connect/disconnect callback
     * @param {boolean} connected - true:connected | false:disconnected
     * @memberOf esn.offline.detector.offlineDetectorApi
     */
    function setNetworkActivity(connected) {
      service.online = connected;
      $rootScope.$broadcast('network:available', service.online);
    }
  }
})();
