(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('ContactHighLightHelper', ContactHighLightHelper);

  function ContactHighLightHelper() {
    return ContactHighLightHelper;

    function ContactHighLightHelper() {
      var dataHighlight = [];

      return {
        checkArrMatching: checkArrMatching,
        checkStringMatch: checkStringMatch,
        checkArrAddressMatching: checkArrAddressMatching,
        dataHighlight: dataHighlight
      };

      function checkArrMatching(array, query, iconClass) {
        if (typeof array === 'undefined') {
          return -1;
        }
        var index = -1;

        for (var i = 0; i < array.length; i++) {
          var dataInput = array[i].value ? array[i].value : array[i].text;
          var typeInput = array[i].type ? array[i].type : '';
          var strIndex = dataInput.toLowerCase().indexOf(query);

          if (strIndex > -1) {
            index = strIndex;
            dataHighlight.push({
              index: index,
              data: dataInput,
              type: typeInput,
              icon: iconClass
            });
          }
        }

        return index;
      }

      function checkStringMatch(str, query, iconClass) {
        if (str === null || angular.isUndefined(str)) {
          return -1;
        }
        var index = str.toLowerCase().indexOf(query);

        if (index > -1) {
          dataHighlight.push({
            index: index,
            data: str,
            type: '',
            icon: iconClass
          });
        }

        return index;
      }

      function checkArrAddressMatching(array, query, iconClass) {
        function getMinOfArray(numArray) {
          return Math.min.apply(null, numArray);
        }
        if (typeof array === 'undefined') {
          return -1;
        }
        var index = -1;

        for (var i = 0; i < array.length; i++) {
          var strIndex = (array[i].street + array[i].city + array[i].zip + array[i].country).toLowerCase().indexOf(query);

          if (strIndex > -1) {
            var arrIndex = [array[i].street.toLowerCase().indexOf(query), array[i].city.toLowerCase().indexOf(query), array[i].zip.toLowerCase().indexOf(query), array[i].country.toLowerCase().indexOf(query)];

            for (var j = arrIndex.length; j--;) {
              if (arrIndex[j] === -1) {
                arrIndex.splice(j, 1);
              }
            }
            index = getMinOfArray(arrIndex);
            var str = array[i].street + ' ' + array[i].city + ' ' + array[i].country + ' ' + array[i].zip;

            dataHighlight.push({
              index: index,
              data: str,
              type: array[i].type,
              icon: iconClass
            });
          }
        }

        return index;
      }
    }
  }
})(angular);
