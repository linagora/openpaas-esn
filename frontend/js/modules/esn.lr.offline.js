/**
 * offlineApi Service
 * @namespace esn.offline
 */
(function() {
  'use strict';

  angular
    .module('esn.offline', ['esn.localstorage', 'esn.lodash-wrapper', 'esn.offline.detector'])
    .factory('offlineApi', offlineApi)
    .constant('OFFLINE_RECORD', 'linagora.esn.offlineRecord');

  /**
   * @namespace offlineApi
   * @desc Service to manage action execution on offline mode
   * @memberOf esn.offline
   */
  function offlineApi($rootScope, $q, _, localStorageService, offlineDetectorApi, OFFLINE_RECORD) {
    var
    actionHandlers = {},
    service = {
      activate: activate,
      listActions: listActions,
      recordAction: recordAction,
      registerActionHandler: registerActionHandler
    };

    return service;

    ////////////

    /**
     * @name activate
     * @desc Activation function launch at service instantiation$
     * @memberOf esn.offline.offlineApi
     */
    function activate() {
      $rootScope.$on('network:available', onNetworkChange);
    }

    /**
     * @name getActionHandler
     * @desc Get the handler associated to an action of a given module
     * @param {string} module - Module name
     * @param {string} action - Name of the action
     * @return {function} handler - function to be executed
     * @memberOf esn.offline.offlineApi
     */
    function getActionHandler(module, action) {
      return actionHandlers[module][action];
    }

    /**
     * @name listActions
     * @desc List all actions recorded for a given module
     * @param {string} module - Module name
     * @return {Object[]} localRecord - list of local records
     * @memberOf esn.offline.offlineApi
     */
    function listActions(module) {
      var recorderInstance = localStorageService.getOrCreateInstance(OFFLINE_RECORD);

      return recorderInstance.getItem(module).then(function(data) {
        return data || [];
      });
    }

    /**
     * @name onNetworkChange
     * @desc Manage network event change
     * @param {Event} event - Event 'network:available'
     * @param {boolean} networkState - Status of the network (true: online | false: offline)
     * @return {???} ???
     * @memberOf esn.offline.offlineApi
     */
    function onNetworkChange(event, networkState) {
      if (!networkState) {
        return null;
      }

      var moduleNames = Object.keys(actionHandlers);

      return $q.all(moduleNames.map(function(name) {
        return listActions(name);
      })).then(function(moduleActions) {
        var localRecords = _.flatMapDeep(moduleActions, function(action) {
          return _.values(action);
        });
      });
    }

    /**
     * @name recordAction
     * @desc Record an action
     * @param {Object} localRecord - LocalRecord object to record
     * @param {string} localRecord.module - Name of the module
     * @param {string} localRecord.action - Name of the action
     * @param {Object} localRecord.playload - Playload of the action
     * @return {Promise} Record status
     * @memberOf esn.offline.offlineApi
     */
    function recordAction(localRecord) {
      var recorderInstance = localStorageService.getOrCreateInstance(OFFLINE_RECORD);

      return recorderInstance.getItem(localRecord.module).then(function(localRecords) {
        localRecords = localRecords || [];

        localRecords.push(localRecord);

        return recorderInstance.setItem(localRecord.module, localRecords);
      }).then(function() {
        if (offlineDetectorApi.online) {
          var handler = getActionHandler(localRecord.module, localRecord.action);

          return handler(localRecord).then(function() {
            return true;
          });
        }

        return false;
      }).then(function(executed) {
        if (executed) {
          return removeAction(localRecord);
        }

        return executed;
      });
    }

    /**
     * @name registerActionHandler
     * @desc Handler for registering an action
     * @param {string} module - Name of the module
     * @param {string} action - Name of the action
     * @param {function} callback - function to execute on action success
     * @memberOf esn.offline.offlineApi
     */
    function registerActionHandler(module, action, callback) {
      actionHandlers[module] = actionHandlers[module] || {};
      actionHandlers[module][action] = callback;
    }

    /**
     * @name removeAction
     * @desc Remove an action
     * @param {Object} localRecord - LocalRecord object to remove
     * @param {string} localRecord.module - Name of the module
     * @param {string} localRecord.action - Name of the action
     * @param {Object} localRecord.playload - Playload of the action
     * @return {Promise} Remove status
     * @memberOf esn.offline.offlineApi
     */
    function removeAction(localRecord) {
      var recorderInstance = localStorageService.getOrCreateInstance(OFFLINE_RECORD);
      var localRecords = recorderInstance.get(localRecord.module) || [];

      if (localRecords) {
        _.remove(localRecords, localRecord);
      }

      return recorderInstance.setItem(localRecord.module, localRecords);
    }
  }
})();
