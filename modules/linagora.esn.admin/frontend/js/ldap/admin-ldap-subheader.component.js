'use strict';

angular.module('linagora.esn.admin')

.component('adminLdapSubheader', {
  templateUrl: '/admin/views/ldap/admin-ldap-subheader',
  bindings: {
    onSaveButtonClick: '&'
  }
});
