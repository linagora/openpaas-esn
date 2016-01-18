'use strict';

angular.module('esn.actionList', [])

  .directive('actionList', function($modal, $dropdown, screenSize) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var dialogOpened;
        function close() {
          if (dialogOpened) {
            dialogOpened.destroy();
          }
        }

        function openForMobile() {
          close();
          dialogOpened = $modal({scope: scope, templateUrl: attrs.templateMobileUrl, placement: 'center'});
        }

        function openForDesktop() {
          close();
          dialogOpened = $dropdown(element, {scope: scope, trigger: 'manual', show: true, templateUrl: attrs.templateDesktopUrl, placement: 'left-bottom'});
        }

        function handleWindowResizement() {
          if (dialogOpened && dialogOpened.$isShown) {
            boundOpenFn();
          }
        }

        var boundOpenFn = screenSize.is('xs, sm') ? openForMobile : openForDesktop;

        screenSize.on('xs, sm', function(match) {
          if (match && boundOpenFn === openForDesktop) {
            boundOpenFn = openForMobile;
            handleWindowResizement();
          } else if (!match && boundOpenFn === openForMobile) {
            boundOpenFn = openForDesktop;
            handleWindowResizement();
          }
        });

        element.click(function() {
          boundOpenFn();
        });

      }
    };
  });
