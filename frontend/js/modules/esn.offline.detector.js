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
  function offlineDetectorApi($rootScope, $window, ioSocketConnection) {
    var service = {
      activate: activate,
      online: ioSocketConnection.isConnected()
    };

    $window.luc = $window.setForceOffline = function() {
      service.forceOffline = true;
      service.online = false;

      return 'May the force be with you';
    };

    $window.han = $window.unsetForceOffline = function() {
      service.forceOffline = false;
      setNetworkActivity(ioSocketConnection.isConnected());

      return 'Han shot first!';
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
      if (service.forceOffline) {
        return;
      }

      service.online = connected;
      $rootScope.$broadcast('network:available', service.online);
    }

  }
})();
