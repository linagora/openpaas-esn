(function() {
  'use strict';

  angular
    .module('esn.media.query', ['matchmedia-ng'])
    .constant('SM_XS_MEDIA_QUERY', '(max-width: 767px), (min-width: 768px) and (max-width: 991px)');
})();
