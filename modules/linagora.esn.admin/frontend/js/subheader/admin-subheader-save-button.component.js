'use strict';

angular.module('linagora.esn.admin')

.component('adminSubheaderSaveButton', {
  templateUrl: '/admin/views/subheader/admin-subheader-save-button',
  bindings: {
    onClick: '&'
  }
});
