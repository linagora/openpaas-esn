'use strict';

angular.module('esn.actionList', [])

  .directive('actionList', function($modal, $popover, screenSize) {
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
          dialogOpened = $modal({
            scope: scope,
            template: '<div class="action-list-container modal"><div class="modal-dialog modal-content" ng-include="\'' + attrs.actionListUrl + '\'"></div></div>',
            placement: 'center'
          });
        }

        function openForDesktop() {
          close();
          dialogOpened = $popover(element, {
            scope: scope,
            trigger: 'manual',
            show: true,
            autoClose: true,
            template: '<div class="action-list-container popover"><div class="popover-content" ng-include="\'' + attrs.actionListUrl + '\'"></div></div>',
            html: false,
            placement: 'bottom-right',
            animation: 'am-fade'
          });
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
