'use strict';

angular.module('esn.feedback', ['restangular'])
  .factory('feedbackAPI', function(Restangular) {

    /**
     * Post the content of a feedback
     *
     * @param {string} content - the feedback content
     */
    function post(content) {
      return Restangular.one('feedback').customPOST({ content: content });
    }

    return {
      post: post
    };
  })
  .controller('feedback', function($scope, feedbackAPI) {

    $scope.error = false;

    $scope.feedbackButton = {
      label: 'Send',
      notRunning: 'Send',
      running: 'Please wait...'
    };
    $scope.feedbackTask = {
      running: false,
      done: false
    };

    $scope.submit = function() {
      $scope.feedbackTask.running = true;
      $scope.feedbackButton.label = $scope.feedbackButton.running;

      feedbackAPI.post($scope.feedback).then(
        function(response) {
          $scope.feedbackTask.running = false;
          $scope.feedbackTask.done = true;
          $scope.feedbackButton.label = $scope.feedbackButton.notRunning;
          $scope.error = false;
        },
        function(err) {
          $scope.feedbackTask.running = false;
          $scope.feedbackButton.label = $scope.feedbackButton.notRunning;
          $scope.error = err.data.details;
        }
      );
    };
  });
