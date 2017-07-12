'use strict';

angular.
	module('esn.attachment').
	component('esnAttachmentViewer', {
		bindings: {
			file: '='
		},
		controller: function esnAttachmentViewerController(){
		},
		controllerAs: 'ctrl',
		templateUrl: '/views/modules/attachment/viewer/attachment-viewer.html'
	});