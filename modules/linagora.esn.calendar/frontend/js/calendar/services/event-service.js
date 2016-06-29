'use strict';

angular.module('esn.calendar')
  .service('eventService', function(
    $q,
    calendarEventEmitter,
    calendarAPI,
    ICAL,
    CalendarShell,
    calendarUtils,
    eventUtils,
    eventAPI,
    gracePeriodService,
    gracePeriodLiveNotification,
    cachedEventSource,
    masterEventCache,
    notifyService,
    CALENDAR_ERROR_DISPLAY_DELAY,
    CALENDAR_GRACE_DELAY) {

    var self = this;

    /**
     * List all events between a specific range [start..end] in a calendar defined by its path.<
     * @param  {String}   calendarPath the calendar path. it should be something like /calendars/<homeId>/<id>.json
     * @param  {fcMoment} start        start date
     * @param  {fcMoment} end          end date (inclusive)
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
      return eventAPI.get(eventPath)
        .then(function(response) {
          return CalendarShell.from(response.data, {path: eventPath, etag: response.headers('ETag')});
        })
        .catch($q.reject);
    }

    function _handleTask(taskId, task, onTaskSuccess, onTaskCancel) {
      if (task.cancelled) {
        return gracePeriodService.cancel(taskId).then(function() {
          onTaskCancel();
          task.success();
          return false;
        }, function(error) {
          task.error('An error has occured, cannot cancel this action', error.statusTask);
          return $q.reject('An error has occured, cannot cancel this action ' + error.statusTask);
        });
      } else {
        onTaskSuccess();
        return true;
      }
    }

    function _registerTaskListener(taskId, errorMessage, onTaskError) {
      gracePeriodLiveNotification.registerListeners(taskId, function() {
        gracePeriodService.remove(taskId);
        notifyService({
          message: errorMessage
        }, {
          type: 'danger',
          placement: {
            from: 'bottom',
            align: 'center'
          },
          delay: CALENDAR_ERROR_DISPLAY_DELAY
        });
        onTaskError();
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
      event.path = calendarPath.replace(/\/$/, '') + '/' + event.uid + '.ics';
      var taskId = null;

      function onTaskSuccess() {
        gracePeriodService.remove(taskId);
      }

      function onTaskCancel() {
        cachedEventSource.deleteRegistration(event);
        calendarEventEmitter.fullcalendar.emitRemovedEvent(event.uid);
        event.isRecurring() && masterEventCache.remove(event);
      }

      return eventAPI.create(event.path, event.vcalendar, options)
        .then(function(response) {
          if (typeof response !== 'string') {
            return response;
          } else {
            event.gracePeriodTaskId = taskId = response;
            event.isRecurring() && masterEventCache.save(event);
            cachedEventSource.registerAdd(event);
            calendarEventEmitter.fullcalendar.emitCreatedEvent(event);
            return gracePeriodService.grace(taskId, 'You are about to create a new event (' + event.title + ').', 'Cancel it', CALENDAR_GRACE_DELAY, {id: event.uid})
              .then(function(task) {
                return _handleTask(taskId, task, onTaskSuccess, onTaskCancel);
              })
              .catch($q.reject);
          }
        })
        .finally(function() {
          event.gracePeriodTaskId = undefined;
        })
        .catch($q.reject);
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
        return gracePeriodService.cancel(event.gracePeriodTaskId).then(function() {
          cachedEventSource.deleteRegistration(event);
          calendarEventEmitter.fullcalendar.emitRemovedEvent(event.id);
          return true;
        }, $q.reject);
      } else if (event.gracePeriodTaskId) {
        gracePeriodService.cancel(event.gracePeriodTaskId);
      }

      var taskId = null;

      function onTaskSuccess() {
        gracePeriodService.remove(taskId);
      }

      function onTaskCancel() {
        cachedEventSource.deleteRegistration(event);
        calendarEventEmitter.fullcalendar.emitCreatedEvent(event);
      }

      function onTaskError() {
        cachedEventSource.deleteRegistration(event);
        calendarEventEmitter.fullcalendar.emitCreatedEvent(event);
      }

      function performRemove() {
        return eventAPI.remove(eventPath, etag)
          .then(function(id) {
            event.gracePeriodTaskId = taskId = id;
            cachedEventSource.registerDelete(event);
            calendarEventEmitter.fullcalendar.emitRemovedEvent(event.id);
          })
          .then(function() {
            return _registerTaskListener(taskId, 'Could not find the event to delete. Please refresh your calendar.', onTaskError);
          })
          .then(function() {
            return gracePeriodService.grace(taskId, 'You are about to delete the event (' + event.title + ').', 'Cancel it', CALENDAR_GRACE_DELAY, event);
          })
          .then(function(task) {
            return _handleTask(taskId, task, onTaskSuccess, onTaskCancel);
          })
          .finally(function() {
            event.gracePeriodTaskId = undefined;
          })
          .catch($q.reject);
      }

      if (event.isInstance()) {
        return event.getModifiedMaster()
          .then(function(oldMaster) {
            var newMaster = oldMaster.clone();
            if (removeAllInstance || oldMaster.expand(null, null, 2).length < 2) {
              return performRemove();
            } else {
              newMaster.deleteInstance(event);

              //we use self.modifyEvent and not modifyEvent for ease of testing
              //this is also the reason why this is a service and not a factory so we can mock modifyEvent
              return self.modifyEvent(eventPath, newMaster, oldMaster, etag);
            }
          });
      } else {
        return performRemove();
      }
    }

    /**
     * Modify an event in the calendar defined by its path.
     * @param  {String}            path              the event path. it should be something like /calendars/<homeId>/<id>/<eventId>.ics
     * @param  {CalendarShell}     event             the new event.
     * @param  {CalendarShell}     oldEvent          the old event from fullcalendar. It is used in case of rollback and hasSignificantChange computation.
     * @param  {String}            etag              the etag
     * @param  {Function}          onCancel          callback called in case of rollback, ie when we cancel the task
     * @param  {Object}            options           options needed for the creation. The structure is {graceperiod: Boolean, notifyFullcalendar: Boolean}
     * @return {Boolean}                             true on success, false if cancelled
     */
    function modifyEvent(path, event, oldEvent, etag, onCancel, options) {
      if (event.isInstance()) {
        return event.getModifiedMaster().then(function(newMasterEvent) {
          var oldMasterEvent = newMasterEvent.clone();

          oldMasterEvent.modifyOccurrence(oldEvent, true);

          return modifyEvent(path, newMasterEvent, oldMasterEvent, etag, onCancel, options);
        });
      }

      if (eventUtils.hasSignificantChange(event, oldEvent)) {
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

      function onTaskSuccess() {
        gracePeriodService.remove(taskId);
      }

      function onTaskError() {
        cachedEventSource.registerUpdate(oldEvent);
        oldEvent.isRecurring() && masterEventCache.save(oldEvent);
        calendarEventEmitter.fullcalendar.emitModifiedEvent(oldEvent);
      }

      function onTaskCancel() {
        (onCancel || angular.noop)(); //order matter, onCancel should be called before emitModifiedEvent because it can mute oldEvent
        onTaskError();
      }

      return eventAPI.modify(path, event.vcalendar, etag)
        .then(function(id) {
          event.gracePeriodTaskId = taskId = id;
          cachedEventSource.registerUpdate(event);
          event.isRecurring() && masterEventCache.save(event);
          calendarEventEmitter.fullcalendar.emitModifiedEvent(event);
        })
        .then(function() {
          return _registerTaskListener(taskId, 'Could not modify the event, a problem occurred on the CalDAV server. Please refresh your calendar.', onTaskError);
        })
        .then(function() {
          return gracePeriodService.grace(taskId, 'You are about to modify the event (' + event.title + ').', 'Cancel it', CALENDAR_GRACE_DELAY, event);
        })
        .then(function(task) {
          return _handleTask(taskId, task, onTaskSuccess, onTaskCancel);
        })
        .finally(function() {
          event.gracePeriodTaskId = undefined;
        })
        .catch($q.reject);
    }

    /**
     * Change the status of participation of all emails (attendees) of an event
     * @param  {String}                   path       the event path. it should be something like /calendars/<homeId>/<id>/<eventId>.ics
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

      if (event.isInstance()) {
        return event.getModifiedMaster().then(function(newMasterEvent) {
          return changeParticipation(eventPath, newMasterEvent, emails, status, etag, emitEvents);
        });
      }

      return eventAPI.changeParticipation(eventPath, event.vcalendar, etag)
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
        })
        .catch(function(response) {
          if (response.status === 412) {
            return this.getEvent(eventPath).then(function(shell) {
              // A conflict occurred. We've requested the event data in the
              // response, so we can retry the request with this data.
              return changeParticipation(eventPath, shell, emails, status, shell.etag);
            });
          } else {
            return $q.reject(response);
          }
        });
    }

    this.getInvitedAttendees = getInvitedAttendees;
    this.changeParticipation = changeParticipation;
    this.createEvent = createEvent;
    this.listEvents = listEvents;
    this.modifyEvent = modifyEvent;
    this.removeEvent = removeEvent;
    this.getEvent = getEvent;
    this.searchEvents = searchEvents;
  });
