(function() {
  'use strict';

  angular.module('esn.calendar')
    .factory('calCalendarSubscriptionApiService', calCalendarSubscriptionApiService);

  function calCalendarSubscriptionApiService(
    _,
    uuid4,
    calendarRestangular,
    calDavRequest,
    calHttpResponseHandler,
    calPathBuilder
  ) {

    return {
      get: get,
      subscribe: subscribe,
      unsubscribe: unsubscribe,
      update: update
    };

    /**
     * Get a subscription from its id
     * @param {String} calendarHomeId - The calendar where the subscription is saved.
     * @param {String} id - The subscription id
     * @return {Promise}
     */
    function get(calendarHomeId, subscriptionId) {
      var path = calPathBuilder.forSubscriptionId(calendarHomeId, subscriptionId);

      return calDavRequest('get', path)
        .then(calHttpResponseHandler(200, _.property('data')));
    }

    /**
     * Create a new subscription in the given calendar home id.
     * @param {String} calendarHomeId - The calendar to save subscription in
     * @param {CalendarSubscriptionShell} subscription - A subscription shell
     * @return {Promise}
     */
    function subscribe(calendarHomeId, subscription) {
      var path = calPathBuilder.forCalendarHomeId(calendarHomeId);

      subscription.id = subscription.id || uuid4.generate();

      return calDavRequest('post', path, null, subscription)
        .then(calHttpResponseHandler(201));
    }

    /**
     * Remove a subscription from its id.
     * @param {String} calendarHomeId - The id of the calendar the subscription is saved in.
     * @param {String} subscriptionId The id of the subscription.
     * @return {Promise}
     */
    function unsubscribe(calendarHomeId, subscriptionId) {
      var path = calPathBuilder.forSubscriptionId(calendarHomeId, subscriptionId);

      return calDavRequest('delete', path)
        .then(calHttpResponseHandler(204));
    }

    /**
     * Update a subscription.
     * @param {String} calendarHomeId - The id of the calendar the subscription is saved in.
     * @param {String} subscriptionId - The subscription id.
     * @param {CalendarSubscriptionShell} subscription - The new subscription data.
     * @return {Promise}
     */
    function update(calendarHomeId, subscriptionId, subscription) {
      var path = calPathBuilder.forSubscriptionId(calendarHomeId, subscriptionId);

      return calDavRequest('proppatch', path, { 'Content-Type': 'application/json' }, subscription)
        .then(calHttpResponseHandler(204));
    }
  }
})();
