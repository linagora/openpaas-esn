(function(angular) {
  'use strict';

  angular.module('linagora.esn.contact')
    .factory('contactAddressbookParser', contactAddressbookParser);

  function contactAddressbookParser() {
    return {
      parseAddressbookPath: parseAddressbookPath,
      parsePrincipalPath: parsePrincipalPath
    };

    function parseAddressbookPath(path) {
      var match = path.match(/addressbooks\/(.*?)\/(.*?)\.json/);

      return match ? {
        bookId: match[1],
        bookName: match[2]
      } : {};
    }

    function parsePrincipalPath(path) {
      var match = path.match(/principals\/([^/]*)\/([^/]*)/);

      return match ? {
        type: match[1],
        id: match[2]
      } : {};
    }
  }
})(angular);
