'use strict';

angular.module('linagora.esn.admin')

.component('adminDavSubheader', {
  templateUrl: '/admin/views/dav/admin-dav-subheader',
  bindings: {
    onSaveButtonClick: '&'
  }
});
