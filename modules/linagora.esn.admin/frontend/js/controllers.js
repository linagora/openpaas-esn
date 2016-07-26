'use strict';

angular.module('linagora.esn.admin')

.controller('adminRootController', function($state, session) {
  var domainId = session.domain._id; // we suppose that an admin manages only 1 domain

  $state.go('admin.dav', { domainId: domainId });
});
