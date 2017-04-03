(function() {
  'use strict';

  angular.module('esn.calendar')
         .constant('CALENDAR_CONTENT_TYPE_HEADER', 'application/calendar+json')
         .constant('CALENDAR_PREFER_HEADER', 'return=representation')
         .factory('calEventAPI', calEventAPI);

  function calEventAPI(
    calDavRequest,
    calHttpResponseHandler,
    calGracePeriodResponseHandler,
    CAL_ACCEPT_HEADER,
    CALENDAR_CONTENT_TYPE_HEADER,
    CAL_GRACE_DELAY,
    CALENDAR_PREFER_HEADER
  ) {
    var service = {
      get: get,
      create: create,
      modify: modify,
      remove: remove,
      changeParticipation: changeParticipation
    };

    return service;

    ////////////

    /**
     * GET request used to get details of an event of path eventPath.
     * @param  {String} eventPath path of the event. The form is /<calendar_path>/<uuid>.ics
     * @return {Object}           the http response.
     */
    function get(eventPath) {
      return calDavRequest('get', eventPath, { Accept: CAL_ACCEPT_HEADER }, null, { _: Date.now() }).then(calHttpResponseHandler(200));
    }

    /**
     * PUT request used to create a new event in a specific calendar.
     * @param  {String}         eventPath path of the event. The form is /<calendar_path>/<uuid>.ics
     * @param  {ICAL.Component} vcalendar a vcalendar object including the vevent to create.
     * @param  {Object}         options   {graceperiod: true||false} specify if we want to use the graceperiod or not.
     * @return {String||Object}           a taskId if with use the graceperiod, the http response otherwise.
     */
    function create(eventPath, vcalendar, options) {
      var headers = {'Content-Type': CALENDAR_CONTENT_TYPE_HEADER};
      var body = vcalendar.toJSON();

      if (options.graceperiod) {
        return calDavRequest('put', eventPath, headers, body, {graceperiod: CAL_GRACE_DELAY}).then(calGracePeriodResponseHandler);
      }

      return calDavRequest('put', eventPath, headers, body).then(calHttpResponseHandler(201));
    }

    /**
     * PUT request used to modify an event in a specific calendar.
     * @param  {String}         eventPath path of the event. The form is /<calendar_path>/<uuid>.ics
     * @param  {ICAL.Component} vcalendar a vcalendar object including the vevent to create.
     * @param  {String}         etag      set the If-Match header to this etag before sending the request
     * @return {String}                   the taskId which will be used to create the grace period.
     */
    function modify(eventPath, vcalendar, etag) {
      var headers = {
        'Content-Type': CALENDAR_CONTENT_TYPE_HEADER,
        Prefer: CALENDAR_PREFER_HEADER
      };

      if (etag) {
        headers['If-Match'] = etag;
      }
      var body = vcalendar.toJSON();

      return calDavRequest('put', eventPath, headers, body, { graceperiod: CAL_GRACE_DELAY }).then(calGracePeriodResponseHandler);
    }

    /**
     * DELETE request used to remove an event in a specific calendar.
     * @param  {String} eventPath path of the event. The form is /<calendar_path>/<uuid>.ics
     * @param  {String} etag      set the If-Match header to this etag before sending the request
     * @return {String}           the taskId which will be used to create the grace period.
     */
    function remove(eventPath, etag) {
      var headers = {'If-Match': etag};

      return calDavRequest('delete', eventPath, headers, null, { graceperiod: CAL_GRACE_DELAY }).then(calGracePeriodResponseHandler);
    }

    /**
     * PUT request used to change the participation status of an event
     * @param  {String}         eventPath path of the event. The form is /<calendar_path>/<uuid>.ics
     * @param  {ICAL.Component} vcalendar a vcalendar object including the vevent to create.
     * @param  {String}         etag      set the If-Match header to this etag before sending the request
     * @return {Object}                   the http response.
     */
    function changeParticipation(eventPath, vcalendar, etag) {
      var headers = {
        'Content-Type': CALENDAR_CONTENT_TYPE_HEADER,
        Prefer: CALENDAR_PREFER_HEADER
      };

      if (etag) {
        headers['If-Match'] = etag;
      }
      var body = vcalendar.toJSON();

      return calDavRequest('put', eventPath, headers, body).then(calHttpResponseHandler([200, 204]));
    }
  }
})();
