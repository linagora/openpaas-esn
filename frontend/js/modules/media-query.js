(function() {
  'use strict';

  angular
    .module('esn.media.query', ['matchmedia-ng'])
    .constant('ESN_MEDIA_QUERY_SM_XS', '(max-width: 767px), (min-width: 768px) and (max-width: 991px)')
    .constant('ESN_MEDIA_QUERY_MD', '(min-width: 992px) and (max-width: 1365px)');
})();
