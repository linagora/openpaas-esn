'use strict';

angular.module('esn.constants', [])

  .constant('AGGREGATOR_DEFAULT_RESULTS_PER_PAGE', 5)
  .constant('AGGREGATOR_DEFAULT_FIRST_PAGE_SIZE', 40)

  .constant('AUTOCOMPLETE_MAX_RESULTS', 5)

  .constant('ELEMENTS_PER_REQUEST', 30)
  .constant('ELEMENTS_PER_PAGE', 30)

  .constant('INFINITE_LIST_DISTANCE', 0.5)
  .constant('INFINITE_LIST_DISABLED', false)
  .constant('INFINITE_LIST_IMMEDIATE_CHECK', true)
  .constant('INFINITE_LIST_THROTTLE', 10)
  .constant('INFINITE_LIST_POLLING_INTERVAL', 60000)

  .constant('VIRTUAL_SCROLL_DISTANCE', 10)

  .constant('ASYNC_ACTION_LONG_TASK_DURATION', 1000)

  .constant('AVATAR_MIN_SIZE_PX', 256)
  .constant('AVATAR_MAX_SIZE_MB', 5)

  .constant('MAX_BOX_COUNT', 2)

  .constant('ESN_DRAG_ANIMATION_DURATION', 500)
  .constant('ESN_DRAG_DISTANCE_THRESHOLD', 10)

  .constant('ESN_ROUTER_DEFAULT_HOME_PAGE', 'unifiedinbox')

  .constant('ESN_FEEDBACK_DEFAULT_SUBJECT', '[OpenPaas] New feedback')

  .constant('FOLLOW_PAGE_SIZE', 10)

  .constant('HTTP_LAG_UPPER_BOUND', 500)

  .constant('SCROLL_DIFF_DELTA', 30) // in px

  .constant('TIMELINE_PAGE_SIZE', 10)

  .constant('DEFAULT_COLOR_CLASS', 'accent')

  .constant('CACHE_DEFAULT_TTL', 60000)

  .constant('RESET_PASSWORD_ENABLED', true);
