(function(angular) {
  'use strict';

  angular.module('esn.search').controller('ESNSearchAdvancedToggleButtonController', ESNSearchAdvancedToggleButtonController);

  function ESNSearchAdvancedToggleButtonController($mdPanel) {
    var self = this;
    var panelRef;

    self.showAdvancedForm = showAdvancedForm;
    self.canShowAdvancedForm = canShowAdvancedForm;

    function canShowAdvancedForm() {
      return self.provider && self.provider.hasAdvancedSearch;
    }

    function showAdvancedForm() {
      if (!panelRef) {
        createPanel();
      }

      panelRef.open();
    }

    function createPanel() {
      var position = $mdPanel.newPanelPosition()
        .relativeTo('.search-advanced-options')
        .addPanelPosition($mdPanel.xPosition.ALIGN_END, $mdPanel.yPosition.BELOW);

      var config = {
        attachTo: angular.element(document.body),
        controllerAs: 'ctrl',
        controller: function($scope) {
          $scope.query = self.query;
          $scope.provider = self.provider;
          $scope.$hide = hide;
          $scope.search = search;

          function hide() {
            if (panelRef) {
              panelRef.hide();
            }
          }

          function search() {
            hide();
            self.search();
          }
        },
        disableParentScroll: true,
        panelClass: 'search-header-settings-panel',
        templateUrl: '/views/modules/search/form/advanced/search-advanced-form-content.html',
        hasBackdrop: false,
        position: position,
        trapFocus: true,
        clickOutsideToClose: true,
        escapeToClose: true,
        focusOnOpen: true
      };

      panelRef = $mdPanel.create(config);
    }
  }
})(angular);
