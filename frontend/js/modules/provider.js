'use strict';

angular.module('esn.provider', ['esn.aggregator', 'esn.lodash-wrapper'])

  .constant('ELEMENTS_PER_REQUEST', 200)
  .constant('ELEMENTS_PER_PAGE', 20)

  .factory('Providers', function($q, _, toAggregatorSource, ELEMENTS_PER_PAGE) {
    function Providers() {
      this.providers = [];
    }

    Providers.prototype = {
      add: function(provider) {
        this.providers.push(provider);
      },
      getAll: function(context) {
        return $q.all(this.providers.map(function(provider) {
          return provider.getDefaultContext(context).then(function(context) {
            provider.loadNextItems = toAggregatorSource(provider.fetch(context), ELEMENTS_PER_PAGE);

            return provider;
          });
        }));
      },
      getAllProviderNames: function() {
        return _.map(this.providers, 'name');
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
        fetch: function(context) {
          var aggregator = new PageAggregatorService(provider.name, [{
            loadNextItems: toAggregatorSource(provider.fetch(context), ELEMENTS_PER_REQUEST)
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
        getDefaultContext: provider.getDefaultContext
      };
    };
  })

  .factory('ByTypeElementGroupingTool', function() {
    function ByTypeElementGroupingTool(types, elements) {
      this.groupedElements = {};
      this.allElements = [];
      types.forEach(function(type) {
        this.groupedElements[type] = [];
        this.allElements.push({name: type, elements: this.groupedElements[type]});
      }, this);

      if (elements) {
        this.addAll(elements);
      }

      return this;
    }

    ByTypeElementGroupingTool.prototype.addAll = function addAll(elements) {
      elements.forEach(this.addElement.bind(this));
    };

    ByTypeElementGroupingTool.prototype.addElement = function addElement(element) {
      this.groupedElements[element.type].push(element);
    };

    ByTypeElementGroupingTool.prototype.getGroupedElements = function getGroupedElements() {
      return this.allElements;
    };

    ByTypeElementGroupingTool.prototype.reset = function reset() {
      return this.allElements.forEach(function(elementGroup) {
        elementGroup.elements.length = 0;
      });
    };

    return ByTypeElementGroupingTool;
  })

  .factory('ByDateElementGroupingTool', function(moment) {

    function ByDateElementGroupingTool(elements) {
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

    ByDateElementGroupingTool.prototype.addAll = function addAll(elements) {
      elements.forEach(this.addElement, this);
    };

    ByDateElementGroupingTool.prototype.addElement = function addElement(element) {
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

    ByDateElementGroupingTool.prototype._isToday = function _isSameDay(currentMoment, targetMoment) {
      return currentMoment.clone().startOf('day').isBefore(targetMoment);
    };

    ByDateElementGroupingTool.prototype._isThisWeek = function _isSameDay(currentMoment, targetMoment) {
      return currentMoment.clone().subtract(7, 'days').startOf('day').isBefore(targetMoment);
    };

    ByDateElementGroupingTool.prototype._isThisMonth = function _isSameDay(currentMoment, targetMoment) {
      return currentMoment.clone().startOf('month').isBefore(targetMoment);
    };

    ByDateElementGroupingTool.prototype.getGroupedElements = function getGroupedElements() {
      return this.allElements;
    };

    ByDateElementGroupingTool.prototype.reset = function reset() {
      return this.allElements.forEach(function(elementGroup) {
        elementGroup.elements.length = 0;
      });
    };

    return ByDateElementGroupingTool;
  })

  .factory('infiniteScrollHelper', function($q, ByDateElementGroupingTool, _, ELEMENTS_PER_PAGE) {
    return function(scope, loadNextItems, elementGroupingTool) {
      var groups = elementGroupingTool;

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
