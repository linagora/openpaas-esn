'use strict';

angular.module('esn.widget.helper', ['mgcrea.ngStrap.modal'])
.directive('modalLauncher', function($modal) {
  return {
    restrict: 'A',
    scope: true,
    link: function($scope, element, attrs) {
      var template = attrs.template;
      $scope.$on('modal.hide', function(evt, modal) {
        $scope.modal = null;
        modal.destroy();
      });
      $scope.showModal = function() {
        $scope.modal = $modal({scope: $scope, template: template, backdrop: 'static'});
      };
    }
  };
})
.factory('WidgetWizard', function() {
  function Wizard(steps) {
    var self = this;
    this.template = null;
    this.currentStep = 0;
    this.steps = steps;
    this.nextStep = function nextStep() {
      var nStep = self.currentStep + 1;
      if (!self.steps[nStep]) {
        return;
      }
      self.template = self.steps[nStep];
      self.currentStep = nStep;
    };

    this.previousStep = function previousStep() {
      var pStep = this.currentStep - 1;
      if (!this.steps[pStep]) {
        return;
      }
      self.template = self.steps[pStep];
      self.currentStep = pStep;
    };
    this.init = function init() {
      self.template = steps[0];
    };


    this.init();
  }
  return Wizard;
});
