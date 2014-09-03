'use strict';

angular.module('liveConferenceApp', [
  'restangular',
  'ngRoute',
  'mgcrea.ngStrap',
  'ui.notify',
  'angularMoment',
  'ngAnimate',
  'esn.core',
  'esn.domain',
  'esn.session',
  'esn.websocket',
  'esn.easyrtc',
  'esn.conference',
  'esn.authentication',
  'esn.live-conference',
  'esn.conference-notification'
]).config(function($routeProvider, RestangularProvider) {

  $routeProvider.when('/', {
    templateUrl: '/views/live-conference/partials/live',
    controller: 'liveConferenceController',
    resolve: {
      conference: function(conferenceAPI, $route, $location) {
        var urlParams = $location.absUrl().split('/');
        urlParams.pop();
        var conference_id = urlParams.pop().replace('#', '');
        return conferenceAPI.get(conference_id).then(
          function(response) {
            return response.data;
          },
          function(err) {
            $location.path('/');
          }
        );
      }
    }
  });

  $routeProvider.otherwise({redirectTo: '/'});

  RestangularProvider.setBaseUrl('/api');
  RestangularProvider.setFullResponse(true);
});
