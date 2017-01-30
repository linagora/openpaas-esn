'use strict';

angular.module('esn.provider', [
  'esn.constants',
  'esn.aggregator',
  'esn.lodash-wrapper',
  'esn.infinite-list',
  'uuid4'
])

  .factory('Providers', function($q, _, toAggregatorSource, ELEMENTS_PER_PAGE) {

    function Providers() {
      this.providersPromises = [];
    }

    Providers.prototype = {
      add: function(providerPromise) {
        this.providersPromises.push($q.when(providerPromise));
      },

      /**
       * @param {Object} [options] - should follow the following template,
       *   all fields are optional.
       *   {
       *     query: 'keyword to search for',
       *     acceptedTypes: ['providerType1', 'providerType2'],
       *     acceptedIds: ['id1', 'id2',...],
       *     filterByType: {
       *       providerType1: { custom: 'object' },
       *       providerType2: { custom: 'object' }
       *     }
       *   }
       */
      remove: function(predicate) {
        var defer = $q.defer();
        var resolved = false;
        var numProviderPromiseNotResolved = this.providersPromises.length;
        var self = this;

        this.providersPromises.forEach(function(providerPromise) {
          providerPromise.then(function(provider) {
            if (resolved) return;

            numProviderPromiseNotResolved--;
            if (_.isArray(provider) && _.any(provider, predicate)) {
              var newProviders = _.reject(provider, predicate).map($q.when);

              for (var i = 0; i < self.providersPromises.length; i++) {
                if (self.providersPromises[i] === providerPromise) {
                  Array.prototype.splice.bind(self.providersPromises, i, 1).apply(null, newProviders);
                }
              }
            } else if (predicate(provider)) {
              resolved = true;
              defer.resolve(!!_.remove(self.providersPromises, function(_providerPromise_) {
                return _providerPromise_ === providerPromise;
              }));
            } else if (!numProviderPromiseNotResolved) {
              resolved = true;
              defer.resolve(false);
            }
          });
        });

        return defer.promise;
      },
      getAll: function(options) {
        options = options || {};

        return $q.all(this.providersPromises).then(function(providers) {
          return $q.all(_.flatten(providers)
            .filter(function(provider) {
              return !provider.type || !options.acceptedTypes || options.acceptedTypes.indexOf(provider.type) >= 0;
            })
            .filter(function(provider) {
              return !provider.id || !options.acceptedIds || _.contains(options.acceptedIds, provider.id);
            })
            .map(function(provider) {
              options.filterByType = options.filterByType || {};

              return provider.buildFetchContext(options).then(function(context) {
                provider.loadNextItems = toAggregatorSource(provider.fetch(context), ELEMENTS_PER_PAGE);

                return provider;
              }, angular.noop /* Provider will be skipped if we cannot build its fetch context */);
            })
          ).then(function(providers) {
            return providers.filter(Boolean);
          });
        });
      },
      getAllProviderDefinitions: function() {
        return $q.all(this.providersPromises).then(function(providers) {
          return _.map(_.flatten(providers), function(provider) {
            return {
              id: provider.id,
              name: provider.name
            };
          });
        });
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

  .factory('newProvider', function(PageAggregatorService, toAggregatorSource, _, uuid4, ELEMENTS_PER_REQUEST,
                                   ELEMENTS_PER_PAGE) {
    return function(provider) {
      return {
        id: provider.id || uuid4.generate(),
        type: provider.type,
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
        buildFetchContext: provider.buildFetchContext
      };
    };
  })

  .factory('ByTypeElementGroupingTool', function() {
    function ByTypeElementGroupingTool(types, elements) {
      this.groupedElements = {};
      this.allElements = [];
      types.forEach(function(type) {
        this.initType(type);
      }, this);

      if (elements) {
        this.addAll(elements);
      }

      return this;
    }

    ByTypeElementGroupingTool.prototype.initType = function(type) {
      this.groupedElements[type] = [];
      this.allElements.push({name: type, elements: this.groupedElements[type]});
    };

    ByTypeElementGroupingTool.prototype.addAll = function addAll(elements) {
      elements.forEach(this.addElement.bind(this));
    };

    ByTypeElementGroupingTool.prototype.addElement = function addElement(element) {
      if (!this.groupedElements[element.type]) {
        this.initType(element.type);
      }
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

  .factory('ByDateElementGroupingTool', function(moment, _) {

    function ByDateElementGroupingTool(elements) {
      this.todayElements = [];
      this.yesterdayElements = [];
      this.weeklyElements = [];
      this.monthlyElements = [];
      this.otherElements = [];
      this.allElements = [
        {name: 'Today', dateFormat: 'shortTime', elements: this.todayElements},
        {name: 'Yesterday', dateFormat: 'shortTime', elements: this.yesterdayElements},
        {name: 'This Week', dateFormat: 'EEE d', elements: this.weeklyElements},
        {name: 'This Month', dateFormat: 'EEE d', elements: this.monthlyElements},
        {name: 'Older than a month', dateFormat: 'mediumDate', elements: this.otherElements}
      ];

      if (elements) {
        this.addAll(elements);
      }

      return this;
    }

    ByDateElementGroupingTool.prototype.addAll = function(elements) {
      elements.forEach(this.addElement, this);
    };

    ByDateElementGroupingTool.prototype.addElement = function(element) {
      var currentMoment = moment().utc();
      var elementMoment = moment(element.date).utc();

      if (this._isToday(currentMoment, elementMoment)) {
        this.todayElements.push(element);
      } else if (this._isYesterday(currentMoment, elementMoment)) {
        this.yesterdayElements.push(element);
      } else if (this._isThisWeek(currentMoment, elementMoment)) {
        this.weeklyElements.push(element);
      } else if (this._isThisMonth(currentMoment, elementMoment)) {
        this.monthlyElements.push(element);
      } else {
        this.otherElements.push(element);
      }
    };

    ByDateElementGroupingTool.prototype.removeElement = function(element) {
      angular.forEach(this.allElements, function(group) {
        var index = _.findIndex(group.elements, element);

        if (index > -1) {
          group.elements.splice(index, 1);
        }
      });
    };

    ByDateElementGroupingTool.prototype.removeElements = function(elements) {
      elements.forEach(this.removeElement, this);
    };

    ByDateElementGroupingTool.prototype._isToday = function(currentMoment, targetMoment) {
      return currentMoment.clone().startOf('day').isBefore(targetMoment);
    };

    ByDateElementGroupingTool.prototype._isYesterday = function(currentMoment, targetMoment) {
      return currentMoment.clone().subtract(1, 'days').startOf('day').isBefore(targetMoment);
    };

    ByDateElementGroupingTool.prototype._isThisWeek = function(currentMoment, targetMoment) {
      return currentMoment.clone().startOf('week').isBefore(targetMoment);
    };

    ByDateElementGroupingTool.prototype._isThisMonth = function(currentMoment, targetMoment) {
      return currentMoment.clone().startOf('month').isBefore(targetMoment);
    };

    ByDateElementGroupingTool.prototype.getGroupedElements = function getGroupedElements() {
      return this.allElements;
    };

    ByDateElementGroupingTool.prototype.reset = function() {
      return this.allElements.forEach(function(elementGroup) {
        elementGroup.elements.length = 0;
      });
    };

    return ByDateElementGroupingTool;
  });
