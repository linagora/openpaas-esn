/**
 * offlineDetectorApi Service
 * @namespace esn.offline.detector
 */
(function() {
  'use strict';

  angular
    .module('esn.offline.detector', [])
    .factory('offlineDetectorApi', offlineDetectorApi)
    .run(function(offlineDetectorApi) {
      offlineDetectorApi.activate();
    });

  /**
   * @namespace offlineDetectorApi
   * @desc Service to detect offline/online event
   * @memberOf esn.offline.detector
   */
  function offlineDetectorApi($interval, $rootScope, $window, $http) {
    var service = {
      activate: activate,
    };
    return service;

    ////////////

    /* @name activate
     * @desc Activation function launch at service instantiation
     * @memberOf esn.offline.detector.offlineDetectorApi
     */
    function activate() {
      $interval(setNetworkActivity(), 2*1000);
    }

    /* @name isOnline
     * @desc Detection of browser connectivity based on window.online
     * @memberOf esn.offline.detector.offlineDetectorApi
     */
    function isOnline() {
      return $http.get('/api/ping').then(
        function(result) {
          return result.data === 'pong';
        },
        function() {
          return false;
        }
      );
    }

    /* @name setNetworkActivity
     * @desc Set network activity based on isOnline() detection
     * @memberOf esn.offline.detector.offlineDetectorApi
     */
    function setNetworkActivity() {
      isOnline().then(function(connected) {
        service.online = connected;
      });

      $rootScope.$broadcast('network:available', service.online);
    }
  }
})();
