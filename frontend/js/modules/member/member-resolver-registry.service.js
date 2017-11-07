(function(angular) {
  'use strict';

  angular.module('esn.member')
    .factory('esnMemberResolverRegistry', esnMemberResolverRegistry);

  function esnMemberResolverRegistry(esnRegistry) {
    var name = 'member-resolver';
    var options = {
      primaryKey: 'objectType'
    };

    var memberResolverRegistry = esnRegistry(name, options);

    return {
      getResolver: memberResolverRegistry.get.bind(memberResolverRegistry),
      addResolver: memberResolverRegistry.add.bind(memberResolverRegistry)
    };
  }
})(angular);
