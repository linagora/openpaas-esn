(function() {
  'use strict';

  angular.module('esn.calendar')
         .service('calEventService', calEventService);

  function calEventService(
    $q,
    $rootScope,
    _,
    ICAL,
    calCachedEventSource,
    calendarAPI,
    calendarEventEmitter,
    CalendarShell,
    calendarUtils,
    calEventAPI,
    calEventUtils,
    gracePeriodService,
    calMasterEventCache,
    notificationFactory,
    esnI18nService,
    CAL_GRACE_DELAY,
    CAL_EVENTS) {

      var self = this;
      var oldEventStore = {};

      self.changeParticipation = changeParticipation;
      self.getInvitedAttendees = getInvitedAttendees;
      self.getEvent = getEvent;
      self.listEvents = listEvents;
      self.createEvent = createEvent;
      self.modifyEvent = modifyEvent;
      self.removeEvent = removeEvent;
      self.searchEvents = searchEvents;
      self.getEventByUID = getEventByUID;

      ////////////

      /**
       * List all events between a specific range [start..end] in a calendar defined by its path.<
       * @param  {String}   calendarPath the calendar path. it should be something like /calendars/<homeId>/<id>.json
       * @param  {calMoment} start        start date
       * @param  {calMoment} end          end date (inclusive)
       * @param  {String}   timezone     the timezone in which we want the returned events to be in
       * @return {[CalendarShell]}       an array of CalendarShell or an empty array if no events have been found
       */
      function listEvents(calendarPath, start, end, timezone) {
        return calendarAPI.listEvents(calendarPath, start, end, timezone)
          .then(function(events) {
            return events.reduce(function(shells, icaldata) {
              var vcalendar = new ICAL.Component(icaldata.data);
              var vevents = vcalendar.getAllSubcomponents('vevent');

              vevents.forEach(function(vevent) {
                var shell = new CalendarShell(vevent, {path: icaldata._links.self.href, etag: icaldata.etag});

                shells.push(shell);
              });

              return shells;
            }, []);
          })
          .catch($q.reject);
      }

      /**
       * Search all events depending of the query parameter, in a calendar.
       * @param  {[type]} calendarId     The calendar id.
       * @param  {[type]} options        The query parameters {query: '', limit: 20, offset: 0}
       * @return {[CalendarShell]}       an array of CalendarShell or an empty array if no events have been found
       */
      function searchEvents(calendarId, options) {
        return calendarAPI.searchEvents(calendarId, options)
          .then(function(events) {
            return events.reduce(function(shells, icaldata) {
              var vcalendar = ICAL.Component.fromString(icaldata.data);
              var vevents = vcalendar.getAllSubcomponents('vevent');

              vevents.forEach(function(vevent) {
                var shell = new CalendarShell(vevent, {path: icaldata._links.self.href, etag: icaldata.etag});

                shells.push(shell);
              });

              return shells;
            }, []);
          })
          .catch($q.reject);
      }

      /**
       * Get all invitedAttendees in a vcalendar object.
       * @param  {ICAL.Component}      vcalendar The ICAL.component object
       * @param  {[String]}            emails    The array of emails against which we will filter vcalendar attendees
       * @return {[Object]}                        An array of attendees
       */
      function getInvitedAttendees(vcalendar, emails) {
        var vevent = vcalendar.getFirstSubcomponent('vevent');
        var attendees = vevent.getAllProperties('attendee');
        var organizer = vevent.getFirstProperty('organizer');
        var organizerId = organizer && organizer.getFirstValue().toLowerCase();

        var emailMap = Object.create(null);

        emails.forEach(function(email) { emailMap[calendarUtils.prependMailto(email.toLowerCase())] = true; });

        var invitedAttendees = [];

        for (var i = 0; i < attendees.length; i++) {
          if (attendees[i].getFirstValue().toLowerCase() in emailMap) {
            invitedAttendees.push(attendees[i]);
          }
        }

        // We also need the organizer to work around an issue in Lightning
        if (organizer && organizerId in emailMap) {
          invitedAttendees.push(organizer);
        }

        return invitedAttendees;
      }

      /**
       * Get an event from its path
       * @param  {String} eventPath        the path of the event to get
       * @return {CalendarShell}           the found event wrap into a CalendarShell
       */
      function getEvent(eventPath) {
        return calEventAPI.get(eventPath)
          .then(function(response) {
            return CalendarShell.from(response.data, {path: eventPath, etag: response.headers('ETag')});
          });
      }

    /**
     * Gets an event by its UID. This searches in all user's calendar.
     *
     * @param calendarHomeId {String} The calendar home ID to search in
     * @param {String} uid The event UID to search for.
     *
     * @return {CalendarShell} A {@link CalendarShell} object representing the found event
     */
      function getEventByUID(calendarHomeId, uid) {
        return calendarAPI.getEventByUID(calendarHomeId, uid)
          .then(_.head) // There's only one item returned
          .then(function(item) {
            return CalendarShell.from(item.data, { path: item._links.self.href, etag: item.etag });
          });
      }

      /**
       * Create a new event in the calendar defined by its path. If options.graceperiod is true, the request will be handled by the grace
       * period service.
       * @param  {String}             calendarId   the calendar id.
       * @param  {String}             calendarPath the calendar path. it should be something like /calendars/<homeId>/<id>.json
       * @param  {CalendarShell}      event        the event to PUT to the caldav server
       * @param  {Object}             options      options needed for the creation. The structure is {graceperiod: Boolean}
       * @return {Mixed}                           true if success, false if cancelled, the http response if no graceperiod is used.
       */
      function createEvent(calendarId, calendarPath, event, options) {
        var taskId = null;

        event.path = calendarPath.replace(/\/$/, '') + '/' + event.uid + '.ics';

        function onTaskCancel() {
          calCachedEventSource.deleteRegistration(event);
          calendarEventEmitter.fullcalendar.emitRemovedEvent(event.uid);
          event.isRecurring() && calMasterEventCache.remove(event);

          return false;
        }

        return calEventAPI.create(event.path, event.vcalendar, options)
          .then(function(response) {
            if (typeof response !== 'string') {
              return response;
            } else {
              event.gracePeriodTaskId = taskId = response;
              event.isRecurring() && calMasterEventCache.save(event);
              calCachedEventSource.registerAdd(event);
              calendarEventEmitter.fullcalendar.emitCreatedEvent(event);

              return gracePeriodService.grace({
                id: taskId,
                delay: CAL_GRACE_DELAY,
                context: {id: event.uid},
                performedAction: esnI18nService.translate('You are about to create a new event (%s).', event.title),
                cancelFailed: 'An error has occured, the creation could not been reverted',
                cancelTooLate: 'It is too late to cancel the creation',
                gracePeriodFail: 'Event creation failed. Please refresh your calendar',
                successText: esnI18nService.translate('Calendar - %s has been created.', event.title)
              }).then(_.constant(true), onTaskCancel);
            }
          }, function(err) {
            notificationFactory.weakError('Event creation failed', esnI18nService.translate('%s. Please refresh your calendar', err.statusText || err));

            return $q.reject(err);
          })
          .finally(function() {
            event.gracePeriodTaskId = undefined;
          });
      }

      /**
       * Remove an event in the calendar defined by its path.
       * @param  {String}        eventPath            The event path. it should be something like /calendars/<homeId>/<id>/<eventId>.ics
       * @param  {CalendarShell} event                The event from fullcalendar. It is used in case of rollback.
       * @param  {String}        etag                 The etag
       * @param  {String}        removeAllInstance    Make sens only for instance of recurring event. If true all the instance of the recurring event will be removed
       * @return {Boolean}                 true on success, false if cancelled
       */
      function removeEvent(eventPath, event, etag, removeAllInstance) {
        if (!etag && !event.isInstance()) {
          // This is a noop and the event is not created yet in sabre/dav,
          // we then should only remove the event from fullcalendar
          // and cancel the taskid corresponding on the event.
          notificationFactory.weakInfo('Calendar', esnI18nService.translate('%s has been deleted.', event.title));

          return gracePeriodService.cancel(event.gracePeriodTaskId).then(function() {
            calCachedEventSource.deleteRegistration(event);
            calendarEventEmitter.fullcalendar.emitRemovedEvent(event.id);

            return true;
          }, $q.reject);
        } else if (event.gracePeriodTaskId) {
          gracePeriodService.cancel(event.gracePeriodTaskId);
        }

        var taskId = null;

        function onTaskCancel() {
          calCachedEventSource.deleteRegistration(event);
          calendarEventEmitter.fullcalendar.emitCreatedEvent(event);
        }

        function performRemove() {
          return calEventAPI.remove(eventPath, etag)
            .then(function(id) {
              event.gracePeriodTaskId = taskId = id;
              calCachedEventSource.registerDelete(event);
              calendarEventEmitter.fullcalendar.emitRemovedEvent(event.id);

              return gracePeriodService.grace({
                id: taskId,
                delay: CAL_GRACE_DELAY,
                context: {id: event.uid},
                performedAction: esnI18nService.translate('You are about to delete the event (%s).', event.title),
                cancelFailed: 'An error has occurred, can not revert the deletion',
                cancelSuccess: esnI18nService.translate('Calendar - Deletion of %s has been cancelled', event.title),
                cancelTooLate: 'It is too late to cancel the deletion',
                successText: esnI18nService.translate('Calendar - %s has been deleted.', event.title),
                gracePeriodFail: {
                  text: 'Event deletion failed. Please refresh your calendar',
                  delay: -1,
                  hideCross: true,
                  actionText: 'Refresh calendar',
                  action: function() {
                    calCachedEventSource.resetCache();
                    $rootScope.$broadcast(CAL_EVENTS.CALENDAR_REFRESH);
                  }
                 }

              }).then(_.constant(true), function() {
                onTaskCancel();

                return false;
              });
            }, function(err) {
              notificationFactory.weakError(esnI18nService.translate('Event deletion failed', '%s. Please refresh your calendar', err.statusText || err));

              return $q.reject(err);
            })
            .finally(function() {
              event.gracePeriodTaskId = undefined;
            });
        }

        if (event.isInstance()) {
          return event.getModifiedMaster()
            .then(function(oldMaster) {
              var newMaster = oldMaster.clone();

              if (removeAllInstance || oldMaster.expand(null, null, 2).length < 2) {
                return performRemove();
              }

              newMaster.deleteInstance(event);

              //we use self.modifyEvent and not modifyEvent for ease of testing
              //this is also the reason why this is a service and not a factory so we can mock modifyEvent
              return self.modifyEvent(eventPath, newMaster, oldMaster, etag);
            });
        }

        return performRemove();
      }

      /**
       * Modify an event in the calendar defined by its path.
       * @param  {String}            path              the event path. it should be something like /calendars/<homeId>/<id>/<eventId>.ics
       * @param  {CalendarShell}     event             the new event.
       * @param  {CalendarShell}     oldEvent          the old event from fullcalendar. It is used in case of rollback and hasSignificantChange computation.
       * @param  {String}            etag              the etag
       * @param  {Function}          onCancel          callback called in case of rollback, ie when we cancel the task
       * @param  {Object}            options           options needed for the creation. The structure is
       *   {graceperiod: Boolean, notifyFullcalendar: Boolean, graceperiodMessage: Object}
       *                                               graceperiodMessage allow to override message displayed during the graceperiod
       * @return {Boolean}                             true on success, false if cancelled
       */
      function modifyEvent(path, event, oldEvent, etag, onCancel, options) {
        oldEvent = oldEventStore[event.uid] = oldEventStore[event.uid] || oldEvent;
        options = options || {};
        if (event.isInstance()) {
          return event.getModifiedMaster().then(function(newMasterEvent) {
            var oldMasterEvent = newMasterEvent.clone();

            oldMasterEvent.modifyOccurrence(oldEvent, true);

            return modifyEvent(path, newMasterEvent, oldMasterEvent, etag, onCancel, options);
          });
        }

        if (calEventUtils.hasSignificantChange(event, oldEvent)) {
          event.changeParticipation('NEEDS-ACTION');
          // see https://github.com/fruux/sabre-vobject/blob/0ae191a75a53ad3fa06e2ea98581ba46f1f18d73/lib/ITip/Broker.php#L69
          // see RFC 5546 https://tools.ietf.org/html/rfc5546#page-11
          // The calendar client is in charge to handle the SEQUENCE incrementation
          event.sequence = event.sequence + 1;
        }

        if (event.gracePeriodTaskId) {
          gracePeriodService.cancel(event.gracePeriodTaskId);
        }

        var taskId = null;

        function onTaskCancel() {
          delete oldEventStore[event.uid];
          onCancel && onCancel(); //order matter, onCancel should be called before emitModifiedEvent because it can mute oldEvent
          calCachedEventSource.registerUpdate(oldEvent);
          oldEvent.isRecurring() && calMasterEventCache.save(oldEvent);
          calendarEventEmitter.fullcalendar.emitModifiedEvent(oldEvent);
        }

        return calEventAPI.modify(path, event.vcalendar, etag)
          .then(function(id) {
            event.gracePeriodTaskId = taskId = id;
            calCachedEventSource.registerUpdate(event);
            event.isRecurring() && calMasterEventCache.save(event);
            calendarEventEmitter.fullcalendar.emitModifiedEvent(event);

            return gracePeriodService.grace(angular.extend({
              id: taskId,
              delay: CAL_GRACE_DELAY,
              context: {id: event.uid},
              performedAction: esnI18nService.translate('You are about to modify an event (%s).', event.title),
              cancelFailed: 'An error has occured, the modification can not be reverted',
              cancelTooLate: 'It is too late to cancel the modification',
              cancelSuccess: esnI18nService.translate('Calendar - Modification of %s has been canceled.', event.title),
              gracePeriodFail: {
                text: 'Event modification failed, please refresh your calendar',
                delay: -1,
                hideCross: true,
                actionText: 'Refresh calendar',
                action: function() {
                  calCachedEventSource.resetCache();
                  $rootScope.$broadcast(CAL_EVENTS.CALENDAR_REFRESH);
                }
               },
              successText: esnI18nService.translate('Calendar - %s has been modified.', event.title)
            }, options.graceperiodMessage)).then(_.constant(true), function() {
              onTaskCancel();

              return false;
            });
          }, function(err) {
            notificationFactory.weakError('Event modification failed', esnI18nService.translate('%s, Please refresh your calendar', err.statusText || err));

            return $q.reject(err);
          })
          .finally(function() {
            delete oldEventStore[event.uid];
            event.gracePeriodTaskId = undefined;
          });
      }

      /**
       * Change the status of participation of all emails (attendees) of an event
       * @param  {String}                   eventPath       the event path. it should be something like /calendars/<homeId>/<id>/<eventId>.ics
       * @param  {CalendarShell}            event      the event in which we seek the attendees
       * @param  {[String]}                 emails     an array of emails
       * @param  {String}                   status     the status in which attendees status will be set
       * @param  {String}                   etag       the etag
       * @param  {Boolean}                  emitEvents true if you want to emit the event to the fullcalendar false if not
       * @return {Mixed}                               the event as CalendarShell in case of 200 or 204, the response otherwise
       * Note that we retry the request in case of 412. This is the code returned for a conflict.
       */
      function changeParticipation(eventPath, event, emails, status, etag, emitEvents) {

        emitEvents = emitEvents || true;
        if (!angular.isArray(event.attendees)) {
          return $q.when(null);
        }
        if (!event.changeParticipation(status, emails)) {
          return $q.when(null);
        }

        return $q.when(event.isInstance() ? event.getModifiedMaster() : event).then(function(masterEvent) {

          return calEventAPI.changeParticipation(eventPath, masterEvent.vcalendar, etag)
            .then(function(response) {
              if (response.status === 200) {
                return CalendarShell.from(response.data, {path: eventPath, etag: response.headers('ETag')});
              } else if (response.status === 204) {
                return getEvent(eventPath).then(function(shell) {
                  if (emitEvents) {
                    calendarEventEmitter.fullcalendar.emitModifiedEvent(shell);
                  }

                  return shell;
                });
              }

              return $q.reject('changeParticipation unhandle server status code : ' + response.status);
            });
        }).catch(function(response) {
          if (response.status === 412) {
            return self.getEvent(eventPath).then(function(shell) {
              // A conflict occurred. We've requested the event data in the
              // response, so we can retry the request with this data.
              return changeParticipation(eventPath, shell, emails, status, shell.etag);
            });
          }

          return $q.reject(response);
        });
      }
  }
})();
