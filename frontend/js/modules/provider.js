'use strict';

angular.module('esn.provider', ['esn.aggregator', 'esn.lodash-wrapper'])

  .constant('ELEMENTS_PER_REQUEST', 200)
  .constant('ELEMENTS_PER_PAGE', 20)

  .factory('Providers', function($q, toAggregatorSource, ELEMENTS_PER_PAGE) {
    function Providers() {
      this.providers = [];
    }

    Providers.prototype = {
      add: function(provider) {
        this.providers.push(provider);
      },
      getAll: function() {
        return $q.all(this.providers.map(function(provider) {
          return provider.getDefaultContainer().then(function(container) {
            provider.loadNextItems = toAggregatorSource(provider.fetch(container), ELEMENTS_PER_PAGE);

            return provider;
          });
        }));
      }
    };

    return Providers;
  })

  .factory('toAggregatorSource', function() {
    return function(fetcher, length) {
      return function() {
        return fetcher().then(function(results) {
          return { data: results, lastPage: results.length < length };
        });
      };
    };
  })

  .factory('newProvider', function(PageAggregatorService, toAggregatorSource, _, ELEMENTS_PER_REQUEST, ELEMENTS_PER_PAGE) {
    return function(provider) {
      return {
        name: provider.name,
        fetch: function(container) {
          var aggregator = new PageAggregatorService(provider.name, [{
            loadNextItems: toAggregatorSource(provider.fetch(container), ELEMENTS_PER_REQUEST)
          }], { results_per_page: ELEMENTS_PER_PAGE });

          return function() {
            return aggregator.loadNextItems()
              .then(_.property('data'))
              .then(function(results) {
                return results.map(function(result) {
                  if (!(result.date instanceof Date)) {
                    result.date = new Date(result.date);
                  }
                  result.templateUrl = provider.templateUrl;

                  return result;
                });
              });
          };
        },
        getDefaultContainer: provider.getDefaultContainer
      };
    };
  })

  .factory('ElementGroupingTool', function(moment) {

    function ElementGroupingTool(elements) {
      this.todayElements = [];
      this.weeklyElements = [];
      this.monthlyElements = [];
      this.otherElements = [];
      this.allElements = [
        {name: 'Today', dateFormat: 'shortTime', elements: this.todayElements},
        {name: 'This Week', dateFormat: 'short', elements: this.weeklyElements},
        {name: 'This Month', dateFormat: 'short', elements: this.monthlyElements},
        {name: 'Older than a month', dateFormat: 'fullDate', elements: this.otherElements}
      ];

      if (elements) {
        this.addAll(elements);
      }

      return this;
    }

    ElementGroupingTool.prototype.addAll = function addElement(elements) {
      elements.forEach(this.addElement.bind(this));
    };

    ElementGroupingTool.prototype.addElement = function addElement(element) {
      var currentMoment = moment().utc();
      var elementMoment = moment(element.date).utc();

      if (this._isToday(currentMoment, elementMoment)) {
        this.todayElements.push(element);
      } else if (this._isThisWeek(currentMoment, elementMoment)) {
        this.weeklyElements.push(element);
      } else if (this._isThisMonth(currentMoment, elementMoment)) {
        this.monthlyElements.push(element);
      } else {
        this.otherElements.push(element);
      }
    };

    ElementGroupingTool.prototype._isToday = function _isSameDay(currentMoment, targetMoment) {
      return currentMoment.clone().startOf('day').isBefore(targetMoment);
    };

    ElementGroupingTool.prototype._isThisWeek = function _isSameDay(currentMoment, targetMoment) {
      return currentMoment.clone().subtract(7, 'days').startOf('day').isBefore(targetMoment);
    };

    ElementGroupingTool.prototype._isThisMonth = function _isSameDay(currentMoment, targetMoment) {
      return currentMoment.clone().startOf('month').isBefore(targetMoment);
    };

    ElementGroupingTool.prototype.getGroupedElements = function getGroupedElements() {
      return this.allElements;
    };

    ElementGroupingTool.prototype.reset = function reset() {
      return this.allElements.forEach(function(elementGroup) {
        elementGroup.elements.length = 0;
      });
    };

    return ElementGroupingTool;
  })

  .factory('infiniteScrollHelper', function($q, ElementGroupingTool, _, ELEMENTS_PER_PAGE) {
    return function(scope, loadNextItems) {
      var groups = new ElementGroupingTool();

      scope.groupedElements = groups.getGroupedElements();

      return function() {
        if (scope.infiniteScrollDisabled || scope.infiniteScrollCompleted) {
          return $q.reject();
        }

        scope.infiniteScrollDisabled = true;

        return loadNextItems()
          .then(function(elements) {
            if (elements) {
              groups.addAll(elements);
            }

            return elements || [];
          })
          .then(function(elements) {
            if (elements.length < ELEMENTS_PER_PAGE) {
              scope.infiniteScrollCompleted = true;

              return $q.reject();
            }

            return elements;
          })
          .finally(function() {
            scope.infiniteScrollDisabled = false;
          });
      };
    };
  });
