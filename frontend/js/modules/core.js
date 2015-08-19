'use strict';

angular.module('esn.core', [])
  .factory('CounterFactory', function($log, $timeout) {

    function Counter(initialCount, refreshTimer, refreshFn) {
      this.count = initialCount;
      this.refreshTimer = refreshTimer;
      this.refreshFn = refreshFn;
      this.timer = null;
    }

    Counter.prototype.init = function init() {
      var self = this;
      self.refreshFn()
        .then(function(response) {
          self.count = response.data.unread_count;
          $log.debug('Initial count is ' + response.data.unread_count);
        }, function(err) {
          $log.error('Error getting unread count of user notification: ' + err);
        });
    };

    Counter.prototype.refresh = function refresh() {
      var self = this;
      if (self.timer === null) {
        self.timer = $timeout(function() {
          self.refreshFn()
            .then(function(response) {
              self.count = response.data.unread_count;
              $log.debug('count is ' + response.data.unread_count);
            }, function(err) {
              $log.error('Error getting unread count of user notification: ' + err);
            });
          self.timer = null;
        }, self.refreshTimer);
      } else {
        $log.debug('get unread timer is already up');
      }
    };

    Counter.prototype.decreaseBy = function decreaseBy(number) {
      this.count -= number;
      if (this.count < 0) {
        this.count = 0;
      }
    };

    Counter.prototype.increaseBy = function increaseBy(number) {
      this.count += number;
    };

    return {
      newCounter: function(initialCount, refreshTimer, refreshFn) {
        return new Counter(initialCount, refreshTimer, refreshFn);
      }
    };
  })

  .factory('charAPI', function() {

    var defaultDiacriticsMap = [
      {'base': 'A', 'letters': 'AⒶＡÀÁÂẦẤẪẨÃĀĂẰẮẴẲȦǠÄǞẢÅǺǍȀȂẠẬẶḀĄȺⱯꜲÆǼǢꜴꜶꜸꜺꜼ'},
      {'base': 'B', 'letters': 'BⒷＢḂḄḆɃƂƁ'},
      {'base': 'C', 'letters': 'CⒸＣĆĈĊČÇḈƇȻꜾ'},
      {'base': 'D', 'letters': 'DⒹＤḊĎḌḐḒḎĐƋƊƉꝹǱǄǲǅ'},
      {'base': 'E', 'letters': 'EⒺＥÈÉÊỀẾỄỂẼĒḔḖĔĖËẺĚȄȆẸỆȨḜĘḘḚƐƎ'},
      {'base': 'F', 'letters': 'FⒻＦḞƑꝻ'},
      {'base': 'G', 'letters': 'GⒼＧǴĜḠĞĠǦĢǤƓꞠꝽꝾ'},
      {'base': 'H', 'letters': 'HⒽＨĤḢḦȞḤḨḪĦⱧⱵꞍ'},
      {'base': 'I', 'letters': 'IⒾＩÌÍÎĨĪĬİÏḮỈǏȈȊỊĮḬƗ'},
      {'base': 'J', 'letters': 'JⒿＪĴɈ'},
      {'base': 'K', 'letters': 'KⓀＫḰǨḲĶḴƘⱩꝀꝂꝄꞢ'},
      {'base': 'L', 'letters': 'LⓁＬĿĹĽḶḸĻḼḺŁȽⱢⱠꝈꝆꞀǇǈ'},
      {'base': 'M', 'letters': 'MⓂＭḾṀṂⱮƜ'},
      {'base': 'N', 'letters': 'NⓃＮǸŃÑṄŇṆŅṊṈȠƝꞐꞤǊǋ'},
      {'base': 'O', 'letters': 'OⓄＯÒÓÔỒỐỖỔÕṌȬṎŌṐṒŎȮȰÖȪỎŐǑȌȎƠỜỚỠỞỢỌỘǪǬØǾƆƟꝊꝌƢꝎȢ'},
      {'base': 'P', 'letters': 'PⓅＰṔṖƤⱣꝐꝒ'},
      {'base': 'Q', 'letters': 'QⓆＱꝖɊ'},
      {'base': 'R', 'letters': 'RⓇＲŔṘŘȐȒṚṜŖṞɌⱤꝚꞦꞂ'},
      {'base': 'S', 'letters': 'SⓈＳẞŚṤŜṠŠṦṢṨȘŞⱾꞨꞄ'},
      {'base': 'T', 'letters': 'TⓉＴṪŤṬȚŢṰṮŦƬƮȾꞆꜨ'},
      {'base': 'U', 'letters': 'UⓊＵÙÚÛŨṸŪṺŬÜǛǗǕǙỦŮŰǓȔȖƯỪỨỮỬỰỤṲŲṶṴɄ'},
      {'base': 'V', 'letters': 'VⓋＶṼṾƲɅ'},
      {'base': 'W', 'letters': 'WⓌＷẀẂŴẆẄẈⱲ'},
      {'base': 'X', 'letters': 'XⓍＸẊẌ'},
      {'base': 'Y', 'letters': 'YⓎＹỲÝŶỸȲẎŸỶỴƳɎỾ'},
      {'base': 'Z', 'letters': 'ZⓏＺŹẐŻŽẒẔƵȤⱿⱫ'},
      {'base': 'a', 'letters': 'aⓐａẚàáâầấẫẩãāăằắẵẳȧǡäǟảåǻǎȁȃạậặḁąⱥɐꜳæǽǣꜵꜷꜹꜻꜽ'},
      {'base': 'b', 'letters': 'bⓑｂḃḅḇƀƃɓ'},
      {'base': 'c', 'letters': 'cⓒｃćĉċčçḉƈȼꜿↄ'},
      {'base': 'd', 'letters': 'dⓓｄḋďḍḑḓḏđƌɖɗꝺǳǆ'},
      {'base': 'e', 'letters': 'eⓔｅèéêềếễểẽēḕḗĕėëẻěȅȇẹệȩḝęḙḛɇɛǝ'},
      {'base': 'f', 'letters': 'fⓕｆḟƒꝼ'},
      {'base': 'g', 'letters': 'gⓖｇǵĝḡğġǧģǥɠꞡᵹꝿ'},
      {'base': 'h', 'letters': 'hⓗｈĥḣḧȟḥḩḫẖħⱨⱶɥƕ'},
      {'base': 'i', 'letters': 'iⓘｉìíîĩīĭïḯỉǐȉȋịįḭɨı'},
      {'base': 'j', 'letters': 'jⓙｊĵǰɉ'},
      {'base': 'k', 'letters': 'kⓚｋḱǩḳķḵƙⱪꝁꝃꝅꞣ'},
      {'base': 'l', 'letters': 'lⓛｌŀĺľḷḹļḽḻſłƚɫⱡꝉꞁꝇǉ'},
      {'base': 'm', 'letters': 'mⓜｍḿṁṃɱɯ'},
      {'base': 'n', 'letters': 'nⓝｎǹńñṅňṇņṋṉƞɲŉꞑꞥǌ'},
      {'base': 'o', 'letters': 'oⓞｏòóôồốỗổõṍȭṏōṑṓŏȯȱöȫỏőǒȍȏơờớỡởợọộǫǭøǿɔꝋꝍɵƣȣꝏ'},
      {'base': 'p', 'letters': 'pⓟｐṕṗƥᵽꝑꝓ'},
      {'base': 'q', 'letters': 'qⓠｑɋꝗ'},
      {'base': 'r', 'letters': 'rⓡｒŕṙřȑȓṛṝŗṟɍɽꝛꞧꞃ'},
      {'base': 's', 'letters': 'sⓢｓßśṥŝṡšṧṣṩșşȿꞩꞅẛ'},
      {'base': 't', 'letters': 'tⓣｔṫẗťṭțţṱṯŧƭʈⱦꞇꜩ'},
      {'base': 'u', 'letters': 'uⓤｕùúûũṹūṻŭüǜǘǖǚủůűǔȕȗưừứữửựụṳųṷṵʉ'},
      {'base': 'v', 'letters': 'vⓥｖṽṿʋʌ'},
      {'base': 'w', 'letters': 'wⓦｗẁẃŵẇẅẘẉⱳ'},
      {'base': 'x', 'letters': 'xⓧｘẋẍ'},
      {'base': 'y', 'letters': 'yⓨｙỳýŷỹȳẏÿỷẙỵƴɏỿ'},
      {'base': 'z', 'letters': 'zⓩｚźẑżžẓẕƶȥɀⱬ'}
    ];

    var uppercaseAsciiMap = [];

    for (var i = 0; i < defaultDiacriticsMap.length; i++) {
      for (var j = 0; j < defaultDiacriticsMap[i].letters.length; j++) {
        uppercaseAsciiMap[defaultDiacriticsMap[i].letters[j]] = defaultDiacriticsMap[i].base.toUpperCase();
      }
    }

    function getAsciiUpperCase(letter) {
      return uppercaseAsciiMap[letter];
    }

    return {
      getAsciiUpperCase: getAsciiUpperCase
    };
  })

  .filter('bytes', function() {
    return function(bytes, precision) {
      if (bytes === 0) {
        return '0 bytes';
      }

      if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) {
        return '-';
      }

      if (typeof precision === 'undefined') {
        precision = 1;
      }

      var units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'],
        number = Math.floor(Math.log(bytes) / Math.log(1024)),
        val = (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision);

      return (val.match(/\.0*$/) ? val.substr(0, val.indexOf('.')) : val) + '' + units[number];
    };
  })
  .filter('urlencode', function($window) {
    return $window.encodeURIComponent;
  })
  .directive('fallbackSrc', function() {
    return {
      link: function postLink(scope, element, attrs) {
        element.bind('error', function() {
          angular.element(this).attr('src', attrs.fallbackSrc);
        });
      }
    };
  })
  .directive('esnMainNavbar', function($location) {

    function firstPathSegment() {
      return $location.path().replace(/^\//, '').split('/').shift();
    }

    function link(scope, element, attrs) {
      function activateTabItem(segment) {
        element.find('.esn-item[data-esn-path]').removeClass('active');
        if (segment) {
          element.find('.esn-item[data-esn-path="' + segment + '"]').addClass('active');
        }
      }

      scope.$on('$routeChangeSuccess', function() {
        activateTabItem(firstPathSegment());
      });
      activateTabItem(firstPathSegment());
    }

    return {
      restruct: 'E',
      templateUrl: '/views/modules/core/esn-main-navbar.html',
      link: link
    };
  })

  .directive('onFinishRender', function($timeout) {
    return {
      restrict: 'A',
      link: function($scope) {
        if ($scope.$last === true) {
          $timeout(function() {
            $scope.$emit('ngRepeatFinished');
          });
        }
      }
    };
  })

  .constant('routeResolver', {
    session: function(type) {
      return ['session', '$q', function(session, $q) {
        return session.ready.then(function(session) {
          return session[type];
        });
      }];
    },

    api: function(api, method, paramName, target) {
      return [api, '$route', '$location', function(api, $route, $location) {
        var routeId = $route.current.params[paramName || 'id'] || undefined;
        return api[method || 'get'](routeId).then(function(response) {
          return response.data;
        }, function(err) {
          $location.path(target || '/');
        });
      }];
    }
  });
