'use strict';

angular.module('esn.calendar')

  .factory('calendarEventSource', function($log, calendarService) {
    return function(calendarId, errorCallback) {
      return function(start, end, timezone, callback) {
        $log.debug('Getting events for %s', calendarId);
        return calendarService.list(calendarId, start, end, timezone).then(
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

  .factory('calendarEventEmitter', function($rootScope, $q, socket) {
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
          $rootScope.$emit('addedCalendarItem', shell);
        },
        emitRemovedEvent: function(id) {
          $rootScope.$emit('removedCalendarItem', id);
        },
        emitModifiedEvent: function(shell) {
          $rootScope.$emit('modifiedCalendarItem', shell);
        }
      },
      websocket: {
        emitCreatedEvent: function(vcalendar) {
          websocket.emit('event:created', vcalendar);
        },
        emitRemovedEvent: function(vcalendar) {
          websocket.emit('event:deleted', vcalendar);
        },
        emitUpdatedEvent: function(vcalendar) {
          websocket.emit('event:updated', vcalendar);
        }
      }
    };
  })

  .factory('calendarService', function($q, CalendarShell, calendarAPI, eventAPI, calendarEventEmitter, calendarUtils, gracePeriodService, gracePeriodLiveNotification, ICAL, CALENDAR_GRACE_DELAY, CALENDAR_ERROR_DISPLAY_DELAY) {

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

    function getEvent(eventPath) {
      return eventAPI.get(eventPath)
        .then(function(response) {
          return CalendarShell.from(response.data, {path: eventPath, etag: response.headers('ETag')});
        })
        .catch ($q.reject);
    }

    function list(calendarPath, start, end, timezone) {
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
        .catch ($q.reject);
    }

    function create(calendarPath, vcalendar, options) {
      var vevent = vcalendar.getFirstSubcomponent('vevent');
      if (!vevent) {
        return $q.reject(new Error('Missing VEVENT in VCALENDAR'));
      }

      var uid = vevent.getFirstPropertyValue('uid');
      if (!uid) {
        return $q.reject(new Error('Missing UID in VEVENT'));
      }

      var eventPath = calendarPath.replace(/\/$/, '') + '/' + uid + '.ics';
      var taskId = null;
      return eventAPI.create(eventPath, vcalendar, options)
        .then(function(response) {
          if (typeof response !== 'string') {
            return response;
          } else {
            taskId = response;
            calendarEventEmitter.fullcalendar.emitCreatedEvent(new CalendarShell(vcalendar, {gracePeriodTaskId: taskId}));
            return gracePeriodService.grace(taskId, 'You are about to create a new event (' + vevent.getFirstPropertyValue('summary') + ').', 'Cancel it', CALENDAR_GRACE_DELAY, {id: uid})
              .then(function(task) {
                if (task.cancelled) {
                  gracePeriodService.cancel(taskId).then(function() {
                    calendarEventEmitter.fullcalendar.emitRemovedEvent(uid);
                    task.success();
                  }, function(err) {
                    task.error(err.statusText);
                  });
                } else {
                  // Unfortunately, sabredav doesn't support Prefer:
                  // return=representation on the PUT request,
                  // so we have to retrieve the event again for the etag.
                  return getEvent(eventPath).then(function(shell) {
                    gracePeriodService.remove(taskId);
                    calendarEventEmitter.fullcalendar.emitModifiedEvent(shell);
                    calendarEventEmitter.websocket.emitCreatedEvent(shell.vcalendar);
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
              .catch ($q.reject);
          }
        })
        .catch ($q.reject);
    }

    function remove(eventPath, event, etag) {
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
      var vcalendar = CalendarShell.toICAL(event);
      var shell = new CalendarShell(vcalendar, {path: eventPath, etag: etag});
      return eventAPI.remove(eventPath, etag).then(function(id) {
        taskId = id;
        calendarEventEmitter.fullcalendar.emitRemovedEvent(shell.id);
      })
      .then(function() {
        gracePeriodLiveNotification.registerListeners(taskId, function() {
          gracePeriodService.remove(taskId);
          $.notify({
            message: 'Could not find the event to delete. Please refresh your calendar.'
          }, {
            type: 'danger',
            placement: {
              from: 'bottom',
              align: 'center'
            },
            delay: CALENDAR_ERROR_DISPLAY_DELAY
          });
          calendarEventEmitter.fullcalendar.emitCreatedEvent(shell);
        });
        return gracePeriodService.grace(taskId, 'You are about to delete the event (' + event.title + ').', 'Cancel it', CALENDAR_GRACE_DELAY, event);
      })
      .then(function(data) {
        var task = data;
        if (task.cancelled) {
          return gracePeriodService.cancel(taskId).then(function() {
            calendarEventEmitter.fullcalendar.emitCreatedEvent(shell);
            task.success();
            return $q.when(false);
          }, function(err) {
            task.error(err.statusText);
            return $q.when(false);
          });
        } else {
          if (gracePeriodService.hasTask(taskId)) {
            gracePeriodService.remove(taskId);
            calendarEventEmitter.websocket.emitRemovedEvent(vcalendar);
          }
          return $q.when(true);
        }
      })
      .catch ($q.reject);
    }

    function modify(path, event, oldEvent, etag, majorModification, onCancel) {
      if (majorModification) {
        event.attendees.forEach(function(attendee) {
          attendee.partstat = 'NEEDS-ACTION';
        });
      }

      if (!etag) {
        // This is a create event because the event is not created yet in sabre/dav,
        // we then should only cancel the first creation task.
        path = path.replace(/\/$/, '') + '/' + event.uid + '.ics';
        gracePeriodService.cancel(event.gracePeriodTaskId);
      }

      var taskId = null;
      var vcalendar = CalendarShell.toICAL(event);
      var shell = new CalendarShell(vcalendar, {path: path, etag: etag});
      if (oldEvent) {
        var oldVcalendar = CalendarShell.toICAL(oldEvent);
        var oldShell = new CalendarShell(oldVcalendar, {path: path, etag: etag});
      }
      return eventAPI.modify(path, vcalendar, etag).then(function(id) {
        taskId = id;
        calendarEventEmitter.fullcalendar.emitModifiedEvent(shell);
      })
      .then(function() {
        return gracePeriodService.grace(taskId, 'You are about to modify the event (' + event.title + ').', 'Cancel it', CALENDAR_GRACE_DELAY, event);
      })
      .then(function(data) {
        var task = data;
        if (task.cancelled) {
          gracePeriodService.cancel(taskId).then(function() {
            if (oldShell) {
              calendarEventEmitter.fullcalendar.emitModifiedEvent(oldShell);
            } else {
              onCancel = onCancel || function() {};
              onCancel();
            }
            task.success();
          }, function(err) {
            task.error(err.statusText);
          });
        } else {
          return getEvent(path).then(function(shell) {
            gracePeriodService.remove(taskId);
            calendarEventEmitter.fullcalendar.emitModifiedEvent(shell);
            calendarEventEmitter.websocket.emitUpdatedEvent(shell.vcalendar);
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
      .catch ($q.reject);
    }

    function _applyPartstatToSpecifiedAttendees(event, emails, status) {
      var emailMap = {};
      var needsModify = false;

      emails.forEach(function(email) { emailMap[email.toLowerCase()] = true; });
      event.attendees.forEach(function(attendee) {
        if ((attendee.email.toLowerCase() in emailMap) && attendee.partstat !== status) {
          attendee.partstat = status;
          needsModify = true;
        }
      });

      return needsModify;
    }

    function changeParticipation(eventPath, event, emails, status, etag, emitEvents) {
      emitEvents = emitEvents || true;
      if (!angular.isArray(event.attendees)) {
        return $q.when(null);
      }

      if (!_applyPartstatToSpecifiedAttendees(event, emails, status)) {
        return $q.when(null);
      }

      var vcalendar = CalendarShell.toICAL(event);
      return eventAPI.changeParticipation(eventPath, vcalendar, etag)
        .then(function(response) {
          if (response.status === 200) {
            return CalendarShell.from(response.data, {path: eventPath, etag: response.headers('ETag')});
          } else if (response.status === 204) {
            return getEvent(eventPath).then(function(shell) {

              if (emitEvents) {
                calendarEventEmitter.fullcalendar.emitModifiedEvent(shell);
                calendarEventEmitter.websocket.emitUpdatedEvent(shell.vcalendar);
              }
              return shell;
            });
          }
        })
        .catch (function(response) {
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
      list: list,
      create: create,
      remove: remove,
      modify: modify,
      changeParticipation: changeParticipation,
      getEvent: getEvent,
      getInvitedAttendees: getInvitedAttendees
    };
  })

  .service('eventService', function(session, ICAL, $q, calendarService) {
    var originalEvent = {};
    var editedEvent = {};

    function render(event, element) {
      var timeSpan = element.find('.fc-time span');

      element.find('.fc-content').addClass('ellipsis');

      if (event.location) {
        var title = element.find('.fc-title');
        title.addClass('ellipsis');
        var contentHtml = title.html() + ' (' + event.location + ')';
        title.html(contentHtml);
      }

      if (event.description) {
        element.attr('title', event.description);
      }

      var invitedAttendee = null;
      if (event.attendees) {
        event.attendees.forEach(function(att) {
          if (att.email in session.user.emailMap) {
            invitedAttendee = att;
          }
        });
      }

      if (event.isInstance) {
        element.addClass('event-is-instance');
        angular.element('<i class="mdi mdi-sync"/>').insertBefore(timeSpan);
      }

      element.addClass('event-common');

      if (invitedAttendee) {
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

    function _extractICALObject(source, property) {
      var value;
      if (source[property]) {
        value = ICAL.helpers.clone(source[property]);
        source[property] = null;
        return value;
      }
    }

    function copyEventObject(src, dest) {
      var vcal = _extractICALObject(src, 'vcalendar');
      var vevent = _extractICALObject(src, 'vevent');
      angular.copy(src, dest);
      if (vcal) {
        src.vcalendar = vcal;
        dest.vcalendar = vcal;
      }
      if (vevent) {
        src.vcalendar = vevent;
        dest.vcalendar = vevent;
      }
    }

    function isNew(event) {
      return angular.isUndefined(event.id);
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
      if (!isNew(editedEvent) && editedEvent.isInstance) {
        return calendarService.getEvent(editedEvent.path);
      }
      return $q.when(editedEvent);
    }

    return {
      originalEvent: originalEvent,
      editedEvent: editedEvent,
      render: render,
      copyEventObject: copyEventObject,
      isNew: isNew,
      isOrganizer: isOrganizer,
      isMajorModification: isMajorModification,
      getEditedEvent: getEditedEvent,
      setEditedEvent: setEditedEvent
    };

  })

  .service('calendarUtils', function(FCMoment) {
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
     * Return a FCMoment representing (the next hour) starting from Date.now()
     */
    function getNewStartDate() {
      return FCMoment().endOf('hour').add(1, 'seconds');
    }

    /**
     * Return a FCMoment representing (the next hour + 1 hour) starting from Date.now()
     */
    function getNewEndDate() {
      return getNewStartDate().add(1, 'hours');
    }

    /**
     * Return true if start is the same day than end
     * @param {Date} start
     * @param {Date} end
     */
    function isSameDay(start, end) {
      return start.isSame(end, 'day');
    }

    /**
     * When selecting a single cell, ensure that the end date is 1 hours more than the start date at least.
     * @param {Date} start
     * @param {Date} end
     */
    function getDateOnCalendarSelect(start, end) {
      if (end.diff(start, 'minutes') === 30) {
        var newStart = start.startOf('hour');
        var newEnd = FCMoment(newStart).add(1, 'hours');
        return { start: newStart, end: newEnd };
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
      isSameDay: isSameDay,
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
  });
