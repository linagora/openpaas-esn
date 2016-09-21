(function() {
  'use strict';

  angular.module('esn.calendar')
         .factory('calendarUtils', calendarUtils);

  calendarUtils.$inject = [
    'fcMoment'
  ];

  function calendarUtils(fcMoment) {
    var service = {
      prependMailto: prependMailto,
      removeMailto: removeMailto,
      fullmailOf: fullmailOf,
      displayNameOf: displayNameOf,
      getNewStartDate: getNewStartDate,
      getNewEndDate: getNewEndDate,
      getDateOnCalendarSelect: getDateOnCalendarSelect
    };

    return service;

    ////////////

    /**
     * Prepend a mail with 'mailto:'
     * @param {String} mail
     */
    function prependMailto(mail) {
      return 'mailto:' + mail;
    }

    /**
     * Remove (case insensitive) mailto: prefix
     * @param {String} mail
     */
    function removeMailto(mail) {
      return mail.replace(/^mailto:/i, '');
    }

    /**
     * Build and return a fullname like: John Doe <john.doe@open-paas.org>
     * @param {String} cn
     * @param {String} mail
     */
    function fullmailOf(cn, mail) {
      return cn ? cn + ' <' + mail + '>' : mail;
    }

    /**
     * Build and return a displayName: 'firstname lastname'
     * @param {String} firstname
     * @param {String} lastname
     */
    function displayNameOf(firstname, lastname) {
      return firstname + ' ' + lastname;
    }

    /**
     * Return a fcMoment representing (the next half hour) starting from Date.now()
     */
    function getNewStartDate() {
      var now = fcMoment();
      var minute = now.minute();

      now.endOf('hour');

      if (minute < 30) {
        now.subtract(30, 'minute');
      }

      return now.add(1, 'seconds');
    }

    /**
     * Return a fcMoment representing the result of getNewStartDate + one hour
     */
    function getNewEndDate() {
      return getNewStartDate().add(1, 'hours');
    }

    /**
     * When selecting a single cell, ensure that the end date is 1 hours more than the start date at least.
     * @param {Date} start
     * @param {Date} end
     */
    function getDateOnCalendarSelect(start, end) {
      if (end.diff(start, 'minutes') === 30) {
        var newEnd = fcMoment(start).add(1, 'hours');

        return { start: start, end: newEnd };
      } else {
        return { start: start, end: end };
      }
    }
  }

})();
