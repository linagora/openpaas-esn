(function(angular) {
  'use strict';

  angular.module('esn.search').controller('SearchAdvancedOptionsController', SearchAdvancedOptionsController);

  function SearchAdvancedOptionsController($mdPanel, $scope) {
    var self = this;

    self.$onInit = $onInit;
    self.openOptions = openOptions;

    function $onInit() {
      $scope.provider = self.provider;
    }

    function openOptions() {
      var position = $mdPanel.newPanelPosition()
        .relativeTo('.search-advanced-options')
        .addPanelPosition($mdPanel.xPosition.ALIGN_END, $mdPanel.yPosition.BELOW);

      var config = {
        attachTo: angular.element(document.body),
        controllerAs: 'ctrl',
        disableParentScroll: true,
        panelClass: 'search-header-settings-panel',
        templateUrl: '/views/modules/search/header/settings/search-header-settings.html',
        hasBackdrop: false,
        position: position,
        trapFocus: true,
        clickOutsideToClose: true,
        escapeToClose: true,
        focusOnOpen: true,
        scope: $scope
      };

      $mdPanel.open(config);
    }
  }
})(angular);
