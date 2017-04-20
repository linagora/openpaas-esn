'use strict';

angular.module('linagora.esn.unifiedinbox.ml')

  .component('inboxClassificationMessageIndicator', {
    templateUrl: '/unifiedinbox.ml/app/components/classification-message-indicator/classification-message-indicator.html',
    bindings: {
      item: '<'
    },
    controller: 'inboxClassificationMessageIndicatorController'
  });
