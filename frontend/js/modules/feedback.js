'use strict';

angular.module('esn.feedback', [
  'esn.http',
  'esn.constants'
])

  .factory('feedbackAPI', function(esnRestangular) {

    /**
     * Post the content of a feedback
     *
     * @param {string} content - the feedback content
     */
    function post(subject, content) {
      return esnRestangular.one('feedback').customPOST({ subject: subject, content: content });
    }

    return {
      post: post
    };
  })
  .controller('feedback', function($scope, feedbackAPI, ESN_FEEDBACK_DEFAULT_SUBJECT) {

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
      var subject = $scope.subject || ESN_FEEDBACK_DEFAULT_SUBJECT;

      feedbackAPI.post(subject, $scope.content).then(
        function() {
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
