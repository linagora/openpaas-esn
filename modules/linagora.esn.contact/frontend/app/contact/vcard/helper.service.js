(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactVcardHelper', contactVcardHelper);

  function contactVcardHelper(CONTACT_FALLBACK_ATTRIBUTE_TYPE) {
    return {
      getMultiValue: getMultiValue,
      getMultiAddress: getMultiAddress
    };

    function getMultiValue(vcard, propName, supportedTypes) {
      var props = vcard.getAllProperties(propName);

      return props.map(function(prop) {
        var data = {
          value: prop.getFirstValue()
        };

        var type = _getSuitableType(prop.getParameter('type'), supportedTypes);

        if (type) {
          data.type = type;
        }

        return data;
      });
    }

    function getMultiAddress(vcard, propName, supportedTypes) {
      var props = vcard.getAllProperties(propName);

      return props.map(function(prop) {
        var propVal = prop.getFirstValue();

        return {
          type: _getSuitableType(prop.getParameter('type'), supportedTypes),
          street: propVal[2],
          city: propVal[3],
          zip: propVal[5],
          country: propVal[6]
        };
      });
    }

    function _getSuitableType(types, supportedTypes) {
      if (!types) {
        return types;
      }

      if (!Array.isArray(types)) {
        types = [types];
      }

      if (!supportedTypes) {
        return types[0];
      }

      var suitableTypes = types.filter(function(type) {
        return supportedTypes.some(function(supportedType) {
          return _equalCaseInsensitive(supportedType, type);
        });
      });

      if (suitableTypes.length) {
        return suitableTypes[0];
      }

      return CONTACT_FALLBACK_ATTRIBUTE_TYPE;
    }

    function _equalCaseInsensitive(str1, str2) {
      return str1.toUpperCase() === str2.toUpperCase();
    }
  }
})(angular);
