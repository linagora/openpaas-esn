'use strict';

/* exported materialAdmin */
angular.module('materialAdmin', [])
    .directive('jqueryNicescroll', function() {
        function link(scope, element, attrs) {
            element.niceScroll({
                cursorcolor: "rgb(152,152,152)",
                cursorborderradius: 0,
                bouncescroll: true,
                mousescrollstep: 100,
                autohidemode: true
            });
        }
        return {
            restrict: 'A',
            link: link
        }
    });
