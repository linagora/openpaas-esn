'use strict';

angular.module('linagora.esn.account')

  .directive('fabAccountDropup', function() {
    return {
      restrict: 'E',
      templateUrl: '/account/views/partials/fab.html',
      link: function($scope, $element) {

        function getModal() {
          return angular.element($element[0].querySelector('.modal-accounts-list'));
        }

        $scope.hide = function() {
          var e = getModal();
          if (!e) {
            return;
          }

          if (e.hasClass('active')) {
            e.removeClass('active');
          }
        };

        $scope.onClick = function() {
          var e = getModal();
          if (!e) {
            return;
          }

          if (e.hasClass('active')) {
            e.removeClass('active');
          } else {
            e.addClass('active');
          }
        };
      }
    };
  })
  .directive('accountCardDisplayer', function() {
    return {
      restrict: 'E',
      templateUrl: '/account/views/partials/card-displayer.html',
      scope: {
        account: '='
      }
    };
  });
