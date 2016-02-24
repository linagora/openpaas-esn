'use strict';

angular.module('esn.calendar')
  .constant('CALENDAR_LIST_OF_COLORS', {
    red: '#F44336',
    pink: '#E91E63',
    purple: '#9C27B0',
    indigo: '#3F51B5',
    blue: '#2196F3',
    teal: '#009688',
    green: '#4CAF50',
    amber: '#FFC107',
    orange: '#FF9800',
    brown: '#795548'
  })
  .directive('calendarColorPickerToggler', function($parse, $modal, CALENDAR_LIST_OF_COLORS) {
    function link(scope, element, attrs) {
      scope.CALENDAR_LIST_OF_COLORS = CALENDAR_LIST_OF_COLORS;
      scope.colorKeys = Object.keys(CALENDAR_LIST_OF_COLORS);

      var getter = $parse(attrs.ngModel);
      var setter = getter.assign;

      function set() {
        setter(scope, scope.CALENDAR_LIST_OF_COLORS[scope.selected]);
      }

      function select(color) {
        scope.selected = color;
      }

      function isSelected(color) {
        return scope.selected === color;
      }

      function _openModal() {
        scope.selected = undefined;
        $modal({
          scope: scope,
          templateUrl: '/calendar/views/components/calendar-color-picker.html',
          backdrop: 'static',
          placement: 'center'
        });
      }

      element.bind('click', function(event) {
        event.stopImmediatePropagation();
        event.preventDefault();
        _openModal();
      });

      scope.set = set;
      scope.select = select;
      scope.isSelected = isSelected;
    }

    return {
      require: 'ngModel',
      restrict: 'A',
      link: link
    };
  });
