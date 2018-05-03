(function(angular) {
  'use strict';

  angular.module('esn.search').controller('SearchAdvancedToggleButtonController', SearchAdvancedToggleButtonController);

  function SearchAdvancedToggleButtonController($mdPanel) {
    var self = this;

    self.showAdvancedForm = showAdvancedForm;

    function showAdvancedForm() {
      if (!self.panelRef) {
        createPanel();
      }

      self.panelRef.open();
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
            if (self.panelRef) {
              self.panelRef.hide();
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

      self.panelRef = $mdPanel.create(config);
    }
  }
})(angular);
