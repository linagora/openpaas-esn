'use strict';

var angularInjections = angularInjections || [];

angular.module('setupApp', [].concat(angularInjections)).controller('wizardController', ['$scope', 'setupAPI', function($scope, setupAPI) {
  $scope.settings = {};
  $scope.settings.hostname = null;
  $scope.settings.port = null;
  $scope.settings.dbname = null;
  $scope.step = 0;
  $scope.test = {
    running: false,
    status: 'none',
    err: null
  };
  $scope.record = {
    status: 'none',
    err: null,
    running: false
  };

  $scope.testButton = {
    label: 'Test connection',
    notRunning: 'Test connection',
    running: 'Testing database connection...'
  };

  $scope.recordButton = {
    label: 'Next',
    notRunning: 'Next',
    running: 'Recording settings on the server...'
  };

  function onError(data, err, type) {
    $scope[type].status = 'error';
    if (data.error && data.error.message && data.error.details) {
      $scope[type].err = data.error;
    } else {
      $scope[type].err = {
        message: err,
        details: data
      };
    }
  }

  $scope.ajaxRunning = function() {
    return $scope.record.running || $scope.test.running ? true : false;
  };

  $scope.infocomplete = function() {
    var authInfosComplete = ($scope.settings.username && $scope.settings.password) || (!$scope.settings.username && !$scope.settings.password);
    return $scope.settings.hostname && $scope.settings.port && $scope.settings.dbname && authInfosComplete ? true : false;
  };

  $scope.testConnection = function() {
    if ($scope.ajaxRunning()) {
      return;
    }
    $scope.test.running = true;
    $scope.testButton.label = $scope.testButton.running;
    setupAPI.testConnection($scope.settings)
      .success(function() {
        $scope.test.status = 'success';
      })
      .error(function(data, err) {
        onError(data, err, 'test');
      })
      .finally (function() {
        $scope.test.running = false;
        $scope.testButton.label = $scope.testButton.notRunning;
      });
  };

  $scope.recordSettings = function() {
    if ($scope.ajaxRunning()) {
      return;
    }
    $scope.record.running = true;
    $scope.recordButton.label = $scope.recordButton.running;
    setupAPI.recordSettings($scope.settings)
      .success(function() {
        $scope.step++;
      })
      .error(function(data, err) {
        onError(data, err, 'record');
      })
      .finally (function() {
        $scope.record.running = false;
        $scope.recordButton.label = $scope.recordButton.notRunning;
      });
  };

}]).service('setupAPI', ['$http', function($http) {

    function testConnection(settings) {
      var url = '/api/document-store/connection/' +
                encodeURIComponent(settings.hostname) + '/' +
                encodeURIComponent(settings.port) + '/' +
                encodeURIComponent(settings.dbname);
      var body = {};
      if (settings.username && settings.password) {
        body.username = settings.username;
        body.password = settings.password;
      }
      return $http.put(url, body);
    }

    function recordSettings(settings) {
      return $http.put('/api/document-store/connection', settings);
    }

    return {
      testConnection: testConnection,
      recordSettings: recordSettings
    };
  }
]);
