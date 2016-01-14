'use strict';

angular.module('esn.calendar')

  .factory('calendarEventSource', function($log, calendarService) {
    return function(calendarPath, errorCallback) {
      return function(start, end, timezone, callback) {
        $log.debug('Getting events for %s', calendarPath);
        return calendarService.listEvents(calendarPath, start, end, timezone).then(
          function(events) {
            callback(events.filter(function(calendarShell) {
              return !calendarShell.status || calendarShell.status !== 'CANCELLED';
            }));
          },
          function(err) {
            callback([]);
            $log.error(err);
            if (errorCallback) {
              errorCallback(err, 'Can not get calendar events');
            }
          });
      };
    };
  })

  .factory('calendarEventEmitter', function($rootScope, $q, socket, CALENDAR_EVENTS) {
    var websocket = socket('/calendars');

    return {
      activitystream: {
        emitPostedMessage: function(messageId, activityStreamUuid) {
          $rootScope.$emit('message:posted', {
            activitystreamUuid: activityStreamUuid,
            id: messageId
          });
        }
      },
      fullcalendar: {
        emitCreatedEvent: function(shell) {
          $rootScope.$emit(CALENDAR_EVENTS.ITEM_ADD, shell);
        },
        emitRemovedEvent: function(id) {
          $rootScope.$emit(CALENDAR_EVENTS.ITEM_REMOVE, id);
        },
        emitModifiedEvent: function(shell) {
          $rootScope.$emit(CALENDAR_EVENTS.ITEM_MODIFICATION, shell);
        }
      },
      websocket: {
        emitCreatedEvent: function(shell) {
          websocket.emit(CALENDAR_EVENTS.WS.EVENT_CREATED, shell);
        },
        emitRemovedEvent: function(shell) {
          websocket.emit(CALENDAR_EVENTS.WS.EVENT_DELETED, shell);
        },
        emitUpdatedEvent: function(shell) {
          websocket.emit(CALENDAR_EVENTS.WS.EVENT_UPDATED, shell);
        }
      }
    };
  })

  .factory('calendarService', function($q, $rootScope, keepChangeDuringGraceperiod, CalendarShell, CalendarCollectionShell, calendarAPI, eventAPI, calendarEventEmitter, calendarUtils, gracePeriodService, gracePeriodLiveNotification, $modal, ICAL, CALENDAR_GRACE_DELAY, CALENDAR_ERROR_DISPLAY_DELAY, notifyService) {

    /**
     * List all calendars in the calendar home.
     * @param  {String}     calendarHomeId  The calendar home id
     * @return {[CalendarCollectionShell]}  an array of CalendarCollectionShell
     */
    function listCalendars(calendarHomeId) {
      return calendarAPI.listCalendars(calendarHomeId)
        .then(function(calendars) {
          var vcalendars = [];
          calendars.forEach(function(calendar) {
            vcalendars.push(new CalendarCollectionShell(calendar));
          });
          return vcalendars;
        })
        .catch($q.reject);
    }

    /**
     * Get a calendar
     * @param  {String}     calendarHomeId  The calendar home id
     * @param  {String}     calendarId      The calendar id
     * @return {CalendarCollectionShell}  an array of CalendarCollectionShell
     */
    function getCalendar(calendarHomeId, calendarId) {
      return calendarAPI.getCalendar(calendarHomeId, calendarId)
        .then(function(calendar) {
          return new CalendarCollectionShell(calendar);
        })
        .catch($q.reject);
    }

    /**
     * Create a new calendar in the calendar home defined by its id.
     * @param  {String}                   calendarHomeId the id of the calendar in which we will create a new calendar
     * @param  {CalendarCollectionShell}  calendar       the calendar to create
     * @return {Object}                                  the http response
     */
    function createCalendar(calendarHomeId, calendar) {
      return calendarAPI.createCalendar(calendarHomeId, CalendarCollectionShell.toDavCalendar(calendar))
        .then(function(response) {
          return response;
        })
        .catch($q.reject);
    }

    /**
     * Modify a calendar in the calendar home defined by its id.
     * @param  {String}                   calendarHomeId the id of the calendar in which we will create a new calendar
     * @param  {CalendarCollectionShell}  calendar       the calendar to create
     * @return {Object}                                  the http response
     */
    function modifyCalendar(calendarHomeId, calendar) {
      return calendarAPI.modifyCalendar(calendarHomeId, CalendarCollectionShell.toDavCalendar(calendar))
        .then(function(response) {
          return response;
        })
        .catch($q.reject);
    }

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

    /**
     * Create a new event in the calendar defined by its path. If options.graceperiod is true, the request will be handled by the grace
     * period service.
     * @param  {String}             calendarPath the calendar path. it should be something like /calendars/<homeId>/<id>.json
     * @param  {CalendarShell}      event        the event to PUT to the caldav server
     * @param  {Object}             options      options needed for the creation. For now it only accept {graceperiod: true||false}
     * @return {Mixed}                           the new event wrap into a CalendarShell if it works, the http response otherwise.
     */
    function createEvent(calendarPath, event, options) {
      var eventPath = calendarPath.replace(/\/$/, '') + '/' + event.uid + '.ics';
      var taskId = null;
      return eventAPI.create(eventPath, event.vcalendar, options)
        .then(function(response) {
          if (typeof response !== 'string') {
            return response;
          } else {
            taskId = response;
            event.gracePeriodTaskId = taskId;
            keepChangeDuringGraceperiod.registerAdd(event, calendarPath);
            calendarEventEmitter.fullcalendar.emitCreatedEvent(event);
            return gracePeriodService.grace(taskId, 'You are about to create a new event (' + event.title + ').', 'Cancel it', CALENDAR_GRACE_DELAY, {id: event.uid})
              .then(function(task) {
                if (task.cancelled) {
                  gracePeriodService.cancel(taskId).then(function() {
                    keepChangeDuringGraceperiod.deleteRegistration(event);
                    calendarEventEmitter.fullcalendar.emitRemovedEvent(event.uid);
                    task.success();
                    var scope = $rootScope.$new();
                    scope.event = event;
                    scope.modal = $modal({scope: scope, template: '/calendar/views/event-quick-form/event-quick-form-modal', backdrop: 'static'});
                  }, function(err) {
                    task.error('Unexpected error. Cannot cancel the event creation', err.statusText);
                  });
                } else {
                  // Unfortunately, sabredav doesn't support Prefer:
                  // return=representation on the PUT request,
                  // so we have to retrieve the event again for the etag.
                  return getEvent(eventPath).then(function(shell) {
                    gracePeriodService.remove(taskId);
                    calendarEventEmitter.fullcalendar.emitModifiedEvent(shell);
                    calendarEventEmitter.websocket.emitCreatedEvent(shell);
                    return shell;
                  }, function(response) {
                    if (response.status === 404) {
                      // Silently fail here because it is due to
                      // the task being cancelled by another method.
                      return;
                    } else {
                      return response;
                    }
                  });
                }
              })
              .catch($q.reject);
          }
        })
        .catch($q.reject);
    }

    /**
     * Remove an event in the calendar defined by its path. If options.graceperiod is true, the request will be handled by the grace
     * period service.
     * @param  {String}        eventPath the event path. it should be something like /calendars/<homeId>/<id>/<eventId>.ics
     * @param  {CalendarShell} event     The event from fullcalendar. It is used in case of rollback.
     * @param  {String}        etag      The etag
     * @return {Boolean}                 true if it works, false if it does not.
     */
    function removeEvent(eventPath, event, etag) {
      if (!etag) {
        // This is a noop and the event is not created yet in sabre/dav,
        // we then should only remove the event from fullcalendar
        // and cancel the taskid corresponding on the event.
        return gracePeriodService.cancel(event.gracePeriodTaskId).then(function() {
          calendarEventEmitter.fullcalendar.emitRemovedEvent(event.id);
          return $q.when(false);
        }, $q.reject);
      }

      var taskId = null;
      return eventAPI.remove(eventPath, etag).then(function(id) {
        taskId = id;
        keepChangeDuringGraceperiod.registerDelete(event);
        calendarEventEmitter.fullcalendar.emitRemovedEvent(event.id);
      })
      .then(function() {
        gracePeriodLiveNotification.registerListeners(taskId, function() {
          gracePeriodService.remove(taskId);
          notifyService({
            message: 'Could not find the event to delete. Please refresh your calendar.'
          }, {
            type: 'danger',
            placement: {
              from: 'bottom',
              align: 'center'
            },
            delay: CALENDAR_ERROR_DISPLAY_DELAY
          });
          calendarEventEmitter.fullcalendar.emitCreatedEvent(event);
        });
        return gracePeriodService.grace(taskId, 'You are about to delete the event (' + event.title + ').', 'Cancel it', CALENDAR_GRACE_DELAY, event);
      })
      .then(function(data) {
        var task = data;
        if (task.cancelled) {
          return gracePeriodService.cancel(taskId).then(function() {
            keepChangeDuringGraceperiod.deleteRegistration(event);
            calendarEventEmitter.fullcalendar.emitCreatedEvent(event);
            task.success();
            return $q.when(false);
          }, function(err) {
            task.error('Unexpected error. Cannot cancel the event deletion', err.statusText);
            return $q.when(false);
          });
        } else {
          if (gracePeriodService.hasTask(taskId)) {
            gracePeriodService.remove(taskId);
            calendarEventEmitter.websocket.emitRemovedEvent(event);
          }
          return $q.when(true);
        }
      })
      .catch($q.reject);
    }

    /**
     * Remove an event in the calendar defined by its path. If options.graceperiod is true, the request will be handled by the grace
     * period service.
     * @param  {String}            path              the event path. it should be something like /calendars/<homeId>/<id>/<eventId>.ics
     * @param  {CalendarShell}     event             the event from fullcalendar. It is used in case of rollback.
     * @param  {CalendarShell}     oldEvent          the event from fullcalendar. It is used in case of rollback.
     * @param  {String}            etag              the etag
     * @param  {boolean}           majorModification it is used to reset invited attendees status to 'NEEDS-ACTION'
     * @param  {Function}          onCancel          callback called in case of rollback, ie when we cancel the task
     * @return {Mixed}                               the new event wrap into a CalendarShell if it works, the http response otherwise.
     */
    function modifyEvent(path, event, oldEvent, etag, majorModification, onCancel) {
      if (majorModification) {
        event.changeParticipation('NEEDS-ACTION');
      }

      if (!etag) {
        // This is a create event because the event is not created yet in sabre/dav,
        // we then should only cancel the first creation task.
        path = path.replace(/\/$/, '') + '/' + event.uid + '.ics';
        gracePeriodService.cancel(event.gracePeriodTaskId);
      }

      var taskId = null;

      return event.getModifiedMaster().then(function(mastershell) {
        event = mastershell;
        return eventAPI.modify(path, event.vcalendar, etag);
      }).then(function(id) {
        taskId = id;
        keepChangeDuringGraceperiod.registerUpdate(event);
        calendarEventEmitter.fullcalendar.emitModifiedEvent(event);
      }).then(function() {
        return gracePeriodService.grace(taskId, 'You are about to modify the event (' + event.title + ').', 'Cancel it', CALENDAR_GRACE_DELAY, event);
      }).then(function(data) {
        var task = data;
        if (task.cancelled) {
          return gracePeriodService.cancel(taskId).then(function() {
            keepChangeDuringGraceperiod.deleteRegistration(event);
            if (oldEvent) {
              calendarEventEmitter.fullcalendar.emitModifiedEvent(oldEvent);
            } else {
              onCancel = onCancel || function() {};
              onCancel();
            }
            task.success();
            return $q.when(false);
          }, function(err) {
            task.error('Unexpected error. Cannot cancel the event modification', err.statusText);
            return $q.when(false);
          });
        } else {
          return getEvent(path).then(function(shell) {
            gracePeriodService.remove(taskId);
            calendarEventEmitter.fullcalendar.emitModifiedEvent(shell);
            calendarEventEmitter.websocket.emitUpdatedEvent(shell);
            return shell;
          }, function(response) {
            if (response.status === 404) {
              // Silently fail here because it is due to
              // the task being cancelled by another method.
              return;
            } else {
              return response;
            }
          });
        }
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
     * @param  {Boolean}                  emitEvents it is used
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

      return eventAPI.changeParticipation(eventPath, event.vcalendar, etag)
        .then(function(response) {
          if (response.status === 200) {
            return CalendarShell.from(response.data, {path: eventPath, etag: response.headers('ETag')});
          } else if (response.status === 204) {
            return getEvent(eventPath).then(function(shell) {

              if (emitEvents) {
                calendarEventEmitter.fullcalendar.emitModifiedEvent(shell);
                calendarEventEmitter.websocket.emitUpdatedEvent(shell);
              }
              return shell;
            });
          }
        })
        .catch(function(response) {
          if (response.status === 412) {
            return getEvent(eventPath).then(function(shell) {
              // A conflict occurred. We've requested the event data in the
              // response, so we can retry the request with this data.
              return changeParticipation(eventPath, shell, emails, status, shell.etag);
            });
          } else {
            return $q.reject(response);
          }
        });
    }

    return {
      listEvents: listEvents,
      listCalendars: listCalendars,
      createEvent: createEvent,
      getCalendar: getCalendar,
      createCalendar: createCalendar,
      modifyCalendar: modifyCalendar,
      removeEvent: removeEvent,
      modifyEvent: modifyEvent,
      changeParticipation: changeParticipation,
      getEvent: getEvent,
      getInvitedAttendees: getInvitedAttendees
    };
  })

  .service('eventUtils', function(session, ICAL, $q, calendarService, $sanitize) {
    var originalEvent = {};
    var editedEvent = {};

    function render(event, element) {
      var timeSpan = element.find('.fc-time span');

      element.find('.fc-content').addClass('ellipsis');

      if (event.location) {
        var title = element.find('.fc-title');
        title.addClass('ellipsis');
        var contentHtml = title.html() + ' (' + $sanitize(event.location) + ')';
        title.html(contentHtml);
      }

      if (event.description) {
        element.attr('title', $sanitize(event.description));
      }

      var invitedAttendee = null;
      if (event.attendees) {
        event.attendees.forEach(function(att) {
          if (att.email in session.user.emailMap) {
            invitedAttendee = att;
          }
        });
      }

      if (event.isInstance()) {
        element.addClass('event-is-instance');
        angular.element('<i class="mdi mdi-sync"/>').insertBefore(timeSpan);
      }

      if (invitedAttendee) {
        event.startEditable = false;
        event.durationEditable = false;
        if (invitedAttendee.partstat === 'NEEDS-ACTION') {
          element.addClass('event-needs-action');
        } else if (invitedAttendee.partstat === 'TENTATIVE') {
          element.addClass('event-tentative');
          angular.element('<i class="mdi mdi-help-circle"/>').insertBefore(timeSpan);
        } else if (invitedAttendee.partstat === 'ACCEPTED') {
          element.addClass('event-accepted');
        } else if (invitedAttendee.partstat === 'DECLINED') {
          element.addClass('event-declined');
        }
      }
    }

    /**
     * Return true or false either the event is new (not in caldav yet) or not.
     * We are using etag which is filled by the caldav server on creation
     * @param  {CalendarShell}  event the event to checkbox
     * @return {Boolean}        true if event is not yet on the server, false otherwise
     */
    function isNew(event) {
      return angular.isUndefined(event.etag);
    }

    function isOrganizer(event) {
      var organizerMail = event && event.organizer && (event.organizer.email || event.organizer.emails[0]);
      return !organizerMail || (organizerMail in session.user.emailMap);
    }

    function isMajorModification(newEvent, oldEvent) {
      return !newEvent.start.isSame(oldEvent.start) || !newEvent.end.isSame(oldEvent.end);
    }

    function setEditedEvent(event) {
      editedEvent = event;
    }

    function getEditedEvent() {
      if (!isNew(editedEvent) && editedEvent.isInstance()) {
        return calendarService.getEvent(editedEvent.path);
      }
      return $q.when(editedEvent);
    }

    return {
      originalEvent: originalEvent,
      editedEvent: editedEvent,
      render: render,
      isNew: isNew,
      isOrganizer: isOrganizer,
      isMajorModification: isMajorModification,
      getEditedEvent: getEditedEvent,
      setEditedEvent: setEditedEvent
    };

  })

  .service('calendarUtils', function(fcMoment) {
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

    return {
      prependMailto: prependMailto,
      removeMailto: removeMailto,
      fullmailOf: fullmailOf,
      displayNameOf: displayNameOf,
      getNewStartDate: getNewStartDate,
      getNewEndDate: getNewEndDate,
      getDateOnCalendarSelect: getDateOnCalendarSelect
    };
  })

  .factory('calendarAttendeeService', function(attendeeService, ICAL_PROPERTIES) {
    function getAttendeeCandidates(query, limit) {
      return attendeeService.getAttendeeCandidates(query, limit).then(function(attendeeCandidates) {
        return attendeeCandidates.map(function(attendeeCandidate) {
          attendeeCandidate.partstat = ICAL_PROPERTIES.partstat.needsaction;
          return attendeeCandidate;
        });
      });
    }

    return {
      getAttendeeCandidates: getAttendeeCandidates
    };
  })

  .factory('calendarCurrentView', function($location, fcMoment) {
    function save(view) {
      var firstDayOfView = view.name === 'month' ? fcMoment(view.start).add(7, 'days').startOf('month') : view.start;
      $location.search({
        viewMode: view.name,
        start: firstDayOfView.format('YYYY-MM-DD')
      });
    }

    function get() {
      var view = {};
      var getParam = $location.search();

      var possibleMode = ['agendaWeek', 'agendaDay', 'month'];
      if (possibleMode.indexOf(getParam.viewMode) !== -1) {
        view.name = getParam.viewMode;
      }

      var day = fcMoment(getParam.start);
      if (getParam.start && day.isValid()) {
        view.start = day;
      }

      return view;
    }

    return {
      get: get,
      save: save
    };
  })

 .factory('keepChangeDuringGraceperiod', function($timeout, CALENDAR_GRACE_DELAY) {
    var changes = {};
    var DELETE = 'delete';
    var UPDATE = 'update';
    var ADD = 'add';

    function deleteRegistration(event) {
      $timeout.cancel(changes[event.id].expirationPromise);
      delete(changes[event.id]);
    }

    function saveChange(action, event, calendarPath) {
      var undo = deleteRegistration.bind(null, event);
      changes[event.id] = {
        expirationPromise: $timeout(undo, CALENDAR_GRACE_DELAY, false),
        event: event,
        calendarPath: calendarPath,
        action: action
      };

      return undo;
    }

    function applyUpdatedAndDeleteEvent(events) {
      return events.reduce(function(previousCleanedEvents, event) {

        var change = changes[event.id];
        if (!change || change.action === ADD) {
          previousCleanedEvents.push(event);
        } else if (change.action === UPDATE) {
          previousCleanedEvents.push(change.event);
        }

        return previousCleanedEvents;
      }, []);
    }

    function addAddedEvent(start, end, calendarPath, events) {

      angular.forEach(changes, function(change) {
        if (change.action === ADD && change.event.start.isBetween(start, end) && change.calendarPath === calendarPath) {
          events.push(change.event);
        }
      });

      return events;
    }

    function wrapEventSource(calendarPath, calendarSource) {
      return function(start, end, timezone, callback) {
        calendarSource(start, end, timezone, function(events) {
          callback(addAddedEvent(start, end, calendarPath, applyUpdatedAndDeleteEvent(events)));
        });
      };
    }

    return {
      registerAdd: saveChange.bind(null, ADD),
      registerDelete: saveChange.bind(null, DELETE),
      registerUpdate: saveChange.bind(null, UPDATE),
      deleteRegistration: deleteRegistration,
      wrapEventSource: wrapEventSource
    };
  });
