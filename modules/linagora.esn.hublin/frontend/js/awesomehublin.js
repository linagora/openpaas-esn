'use strict'

angular.module("esn.awesomeHublin", [])
   .directive('hublinContactAction', function($window) {
	function link($scope) {
		$scope.openHublin = function () {
			$window.open('http://hubl.in/contactChat');
		}
	}
	return {
		replace: true,
		restrict: 'E',
		templateUrl: '/hublin/views/hublin-contact-action.html',
		link: link
	}
}.run(function(dynamicDirectiveService) {
	var dir = new dynamicDirectiveService.DynamicDirective(
        	function(scope) {return true;},
        	'hublin-contact-action'
      		);
	dynamicDirectiveService.addInjection('dynamic-menu-actions', dir);
} ))
