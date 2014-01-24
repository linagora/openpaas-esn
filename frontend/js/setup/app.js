'use strict';

angular.module('setupApp', []).controller('wizardController', ['$scope', 'setupAPI', function($scope, setupAPI) {
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
  $scope.record={
    results: 'none',
    err: null,
    running: false
  };

  $scope.ajaxRunning = function() {
    return $scope.record.running || $scope.test.running ? true : false;
  };
  
  $scope.infocomplete = function() {
    return $scope.settings.hostname && $scope.settings.port && $scope.settings.dbname ? true : false;
  };

  $scope.testConnection = function() {
    if ( $scope.ajaxRunning() ) {
      return ;
    }
    $scope.test.running=true;
    setupAPI.testConnection($scope.settings.hostname, $scope.settings.port,$scope.settings.dbname)
      .success(function() {
        $scope.test.status='success';
      })
      .error(function(data) {
        $scope.test.status='error';
        $scope.test.err=data.error+': '+data.reason;
      })
      .finally(function() {
        $scope.test.running = false;
      });
  };

  $scope.recordSettings = function() {
    if ( $scope.ajaxRunning() ) {
      return ;
    }
    $scope.record.running = true;
    setupAPI.recordSettings($scope.settings)
      .success(function() {
        $scope.step++;
      })
      .error(function(data){
        $scope.record.results = 'error';
        $scope.record.err = data;
      })
      .finally(function() {
        $scope.record.running = false;
      });
  };

}]).service('setupAPI', ['$http', function($http) {

    function testConnection(hostname, port, dbname) {
      var url = '/api/setup/database/test/connection/'+
                encodeURIComponent(hostname)+'/'+
                encodeURIComponent(port)+'/'+
                encodeURIComponent(dbname);
      return $http.get(url);
    }

    function recordSettings(settings) {
      return $http.put('/api/setup/settings', settings);
    }

    return {
      testConnection: testConnection,
      recordSettings: recordSettings
    };
  }
]);