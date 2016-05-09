'use strict';

angular.module('esn.actionList', [])

  .directive('actionList', function($modal, $popover, screenSize) {
    var dialogOpened;

    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        var boundOpenFn, dialogLock;

        function hide() {
          dialogOpened && dialogOpened.hide();
        }

        function destroy() {
          if (isDialogOfThisScope() && !dialogOpened.$isShown) {
            dialogOpened.destroy();
            dialogLock && dialogLock.destroy();
          }
        }

        function isDialogOfThisScope() {
          return dialogOpened && dialogOpened.scope === scope;
        }

        function isDialogOpened() {
          return isDialogOfThisScope() && dialogOpened.$isShown;
        }

        function openForMobile() {
          hide();
          dialogOpened = $modal({
            scope: scope,
            template: '<div class="action-list-container modal"><div class="modal-dialog modal-content" ng-include="\'' + attrs.actionList + '\'"></div></div>',
            placement: 'center',
            prefixEvent: 'action-list'
          });

          dialogOpened.scope = scope;
        }

        function openForDesktop() {
          hide();
          dialogOpened = $popover(element, {
            scope: scope,
            trigger: 'manual',
            show: true,
            prefixEvent: 'action-list',
            autoClose: true,
            template: '<div class="action-list-container popover"><div class="popover-content" ng-include="\'' + attrs.actionList + '\'"></div></div>',
            html: false,
            placement: 'bottom-right',
            animation: 'am-fade',
            container: element
          });

          dialogOpened.scope = scope;
        }

        function handleWindowResizement() {
          if (isDialogOpened()) {
            boundOpenFn();
          }
        }

        element.click(function(event) {
          event.stopImmediatePropagation();
          event.preventDefault();

          boundOpenFn = screenSize.is('xs, sm') ? openForMobile : openForDesktop;

          if (isDialogOpened()) {
            dialogOpened.hide();
          } else {
            boundOpenFn();
          }

          dialogLock = dialogOpened;

          screenSize.onChange(dialogLock.$scope, 'xs, sm', function(match) {
            if (match) {
              boundOpenFn = openForMobile;
              handleWindowResizement();
            } else {
              boundOpenFn = openForDesktop;
              handleWindowResizement();
            }
          });
        });

        scope.$on('action-list.hide', destroy);

        scope.$on('$destroy', destroy);
      }
    };
  });
