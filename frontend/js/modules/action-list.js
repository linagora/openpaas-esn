'use strict';

angular.module('esn.actionList', [])

  .directive('actionList', function($modal, $popover, screenSize) {
    var dialogOpened;

    return {
      restrict: 'A',
      link: function(scope, element, attrs) {

        function close() {
          if (dialogOpened) {
            dialogOpened.destroy();
          }
        }

        function isDialogOfThisScope() {
          return dialogOpened && dialogOpened.scope === scope;
        }

        function isDialogOpened() {
          return isDialogOfThisScope() && dialogOpened.$isShown;
        }

        function openForMobile() {
          close();
          dialogOpened = $modal({
            scope: scope,
            template: '<div class="action-list-container modal"><div class="modal-dialog modal-content" ng-include="\'' + attrs.actionListUrl + '\'"></div></div>',
            placement: 'center'
          });

          dialogOpened.scope = scope;
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

          dialogOpened.scope = scope;
        }

        var boundOpenFn = screenSize.is('xs, sm') ? openForMobile : openForDesktop;

        function handleWindowResizement() {
          if (isDialogOpened()) {
            boundOpenFn();
          }
        }

        screenSize.on('xs, sm', function(match) {
          if (match && boundOpenFn === openForDesktop) {
            boundOpenFn = openForMobile;
            handleWindowResizement();
          } else if (!match && boundOpenFn === openForMobile) {
            boundOpenFn = openForDesktop;
            handleWindowResizement();
          }
        });

        element.click(function(event) {
          event.stopImmediatePropagation();
          event.preventDefault();
          if (isDialogOpened()) {
            dialogOpened.hide();
          } else {
            boundOpenFn();
          }
        });

        scope.$on('$destroy', function() {
          if (isDialogOfThisScope()) {
            close();
          }
        });

      }
    };
  });
