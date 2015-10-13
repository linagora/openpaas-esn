'use strict';

angular.module('esn.calendar')

  .factory('calendarEventSource', function($log, calendarService) {
    return function(calendarId, errorCallback) {
      return function(start, end, timezone, callback) {
        $log.debug('Getting events for %s', calendarId);
        var path = '/calendars/' + calendarId + '/events';
        return calendarService.list(path, start, end, timezone).then(
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

  .factory('request', function($http, $q, DAV_PATH) {
    function ensurePathToProxy(path) {
      return path.substring(path.indexOf('/calendars'), path.length);
    }

    function _configureRequest(method, path, headers, body, params) {
      var url = DAV_PATH;

      headers = headers || {};

      var config = {
        url: url + ensurePathToProxy(path),
        method: method,
        headers: headers,
        params: params
      };

      if (body) {
        config.data = body;
      }

      return $q.when(config);
    }

    function request(method, path, headers, body, params) {
      return _configureRequest(method, path, headers, body, params).then($http);
    }

    return request;
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

  .factory('calendarService', function($rootScope, $q, FCMoment, request, jstz, uuid4, socket, calendarEventEmitter, calendarUtils, gracePeriodService, gracePeriodLiveNotification, ICAL, ICAL_PROPERTIES, CALENDAR_GRACE_DELAY, CALENDAR_ERROR_DISPLAY_DELAY) {
    /**
     * A shell that wraps an ical.js VEVENT component to be compatible with
     * fullcalendar's objects.
     *
     * @param {ICAL.Component} vcalendar     The ical.js VCALENDAR component.
     * @param {String} path                  The path on the caldav server.
     * @param {String} etag                  The ETag of the event.
     * @param {String} gracePeriodTaskId     The gracePeriodTaskId of the event.
     */
    function CalendarShell(vcomponent, path, etag, gracePeriodTaskId) {
      var vcalendar, vevent;
      if (vcomponent.name === 'vcalendar') {
        vevent = vcomponent.getFirstSubcomponent('vevent');
        vcalendar = vcomponent;
      } else if (vcomponent.name === 'vevent') {
        vevent = vcomponent;
        vcalendar = vevent.parent;
      }

      this.uid = vevent.getFirstPropertyValue('uid');
      this.title = vevent.getFirstPropertyValue('summary');
      this.location = vevent.getFirstPropertyValue('location');
      this.description = vevent.getFirstPropertyValue('description');
      this.allDay = vevent.getFirstProperty('dtstart').type === 'date';
      this.isInstance = !!vevent.getFirstProperty('recurrence-id');
      this.start = FCMoment(vevent.getFirstPropertyValue('dtstart').toJSDate());
      this.end = FCMoment(vevent.getFirstPropertyValue('dtend').toJSDate());
      this.formattedDate = this.start.format('MMMM D, YYYY');
      this.formattedStartTime = this.start.format('h');
      this.formattedStartA = this.start.format('a');
      this.formattedEndTime = this.end.format('h');
      this.formattedEndA = this.end.format('a');

      var status = vevent.getFirstPropertyValue('status');
      if (status) {
        this.status = status;
      }

      var recId = vevent.getFirstPropertyValue('recurrence-id');
      this.isInstance = !!recId;
      this.id = recId ? this.uid + '_' + recId.convertToZone(ICAL.Timezone.utcTimezone) : this.uid;

      var attendees = this.attendees = [];

      vevent.getAllProperties('attendee').forEach(function(att) {
        var id = att.getFirstValue();
        if (!id) {
          return;
        }
        var cn = att.getParameter('cn');
        var mail = calendarUtils.removeMailto(id);
        var partstat = att.getParameter('partstat');
        attendees.push({
          fullmail: calendarUtils.fullmailOf(cn, mail),
          email: mail,
          name: cn || mail,
          partstat: partstat,
          displayName: cn || mail
        });
      });

      var organizer = vevent.getFirstProperty('organizer');
      if (organizer) {
        var mail = calendarUtils.removeMailto(organizer.getFirstValue());
        var cn = organizer.getParameter('cn');
        this.organizer = {
          fullmail: calendarUtils.fullmailOf(cn, mail),
          email: mail,
          name: cn || mail,
          displayName: cn || mail
        };
      }

      // NOTE: changing any of the above properties won't update the vevent, or
      // vice versa.
      this.vcalendar = vcalendar;
      this.vevent = vevent;
      this.path = path;
      this.etag = etag;
      this.gracePeriodTaskId = gracePeriodTaskId;
    }

    var timezoneLocal = this.timezoneLocal || jstz.determine().name();

    function shellToICAL(shell) {
      var uid = shell.uid || uuid4.generate();
      var vcalendar = new ICAL.Component('vcalendar');
      var vevent = new ICAL.Component('vevent');
      vevent.addPropertyWithValue('uid', uid);
      vevent.addPropertyWithValue('summary', shell.title);

      var dtstart = ICAL.Time.fromJSDate(shell.start.toDate());
      var dtend = ICAL.Time.fromJSDate(shell.end.toDate());

      dtstart.isDate = shell.allDay;
      dtend.isDate = shell.allDay;

      if (shell.organizer) {
        var organizer = vevent.addPropertyWithValue('organizer', calendarUtils.prependMailto(shell.organizer.email || shell.organizer.emails[0]));
        organizer.setParameter('cn', shell.organizer.displayName || calendarUtils.displayNameOf(shell.organizer.firstname, shell.organizer.lastname));
      }

      vevent.addPropertyWithValue('dtstart', dtstart).setParameter('tzid', timezoneLocal);
      vevent.addPropertyWithValue('dtend', dtend).setParameter('tzid', timezoneLocal);
      vevent.addPropertyWithValue('transp', shell.allDay ? 'TRANSPARENT' : 'OPAQUE');

      if (shell.location) {
        vevent.addPropertyWithValue('location', shell.location);
      }

      if (shell.description) {
        vevent.addPropertyWithValue('description', shell.description);
      }

      if (shell.attendees && shell.attendees.length) {
        shell.attendees.forEach(function(attendee) {
          var mail = attendee.email || attendee.emails[0];
          var mailto = calendarUtils.prependMailto(mail);
          var property = vevent.addPropertyWithValue('attendee', mailto);
          property.setParameter('partstat', attendee.partstat || ICAL_PROPERTIES.partstat.needsaction);
          property.setParameter('rsvp', ICAL_PROPERTIES.rsvp.true);
          property.setParameter('role', ICAL_PROPERTIES.role.reqparticipant);
          if (attendee.displayName && attendee.displayName !== mail) {
            property.setParameter('cn', attendee.displayName);
          }
        });
      }

      vcalendar.addSubcomponent(vevent);
      return vcalendar;
    }

    function icalToShell(ical) {
      return new CalendarShell(new ICAL.Component(ical));
    }

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

    function getEvent(path) {
      var headers = { Accept: 'application/calendar+json' };
      return request('get', path, headers).then(function(response) {
        if (response.status !== 200) {
          return $q.reject(response);
        }
        var vcalendar = new ICAL.Component(response.data);
        return new CalendarShell(vcalendar, path, response.headers('ETag'));
      });
    }

    function list(calendarPath, start, end, timezone) {
      var req = {
        match: {
          start: FCMoment(start).format('YYYYMMDD[T]HHmmss'),
          end: FCMoment(end).format('YYYYMMDD[T]HHmmss')
        }
      };

      return request('post', calendarPath + '.json', null, req).then(function(response) {
        if (!response.data || !response.data._embedded || !response.data._embedded['dav:item']) {
          return [];
        }
        return response.data._embedded['dav:item'].reduce(function(shells, icaldata) {
          var vcalendar = new ICAL.Component(icaldata.data);
          var vevents = vcalendar.getAllSubcomponents('vevent');
          vevents.forEach(function(vevent) {
            var shell = new CalendarShell(vevent, icaldata._links.self.href, icaldata.etag);
            shells.push(shell);
          });

          return shells;
        }, []);
      });
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
      var headers = { 'Content-Type': 'application/calendar+json' };
      var body = vcalendar.toJSON();

      if (options.graceperiod) {
        var taskId = null;
        return request('put', eventPath, headers, body, { graceperiod: CALENDAR_GRACE_DELAY })
          .then(function(response) {
            if (response.status !== 202) {
              return $q.reject(response);
            }
            taskId = response.data.id;
            calendarEventEmitter.fullcalendar.emitCreatedEvent(new CalendarShell(vcalendar, null, null, taskId));
          })
          .then(function() {
            return gracePeriodService.grace(taskId, 'You are about to create a new event (' + vevent.getFirstPropertyValue('summary') + ').', 'Cancel it', CALENDAR_GRACE_DELAY, {id: uid});
          })
          .then(function(data) {
            var task = data;
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
          });
      } else {
        return request('put', eventPath, headers, body).then(function(response) {
          if (response.status !== 201) {
            return $q.reject(response);
          }
          return response;
        });
      }
    }

    function remove(path, event, etag) {
      var headers = {};
      if (etag) {
        headers['If-Match'] = etag;
      } else {
        // This is a noop and the event is not created yet in sabre/dav,
        // we then should only remove the event from fullcalendar
        // and cancel the taskid corresponding on the event.
        return gracePeriodService.cancel(event.gracePeriodTaskId).then(function() {
          calendarEventEmitter.fullcalendar.emitRemovedEvent(event.id);
          return $q.when(false);
        }, $q.reject);
      }

      var taskId = null;
      var vcalendar = shellToICAL(event);
      var shell = new CalendarShell(vcalendar, path, etag);
      return request('delete', path, headers, null, { graceperiod: CALENDAR_GRACE_DELAY }).then(function(response) {
        if (response.status !== 202) {
          return $q.reject(response);
        }
        taskId = response.data.id;
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
      });
    }

    function modify(path, event, oldEvent, etag, majorModification, onCancel) {
      if (majorModification) {
        event.attendees.forEach(function(attendee) {
          attendee.partstat = 'NEEDS-ACTION';
        });
      }

      var headers = {
        'Content-Type': 'application/calendar+json',
        'Prefer': 'return=representation'
      };
      var body = shellToICAL(event).toJSON();

      if (etag) {
        headers['If-Match'] = etag;
      } else {
        // This is a create event because the event is not created yet in sabre/dav,
        // we then should only cancel the first creation task.
        path = path.replace(/\/$/, '') + '/' + event.uid + '.ics';
        gracePeriodService.cancel(event.gracePeriodTaskId);
      }

      var taskId = null;
      var vcalendar = shellToICAL(event);
      var shell = new CalendarShell(vcalendar, path, etag);
      if (oldEvent) {
        var oldVcalendar = shellToICAL(oldEvent);
        var oldShell = new CalendarShell(oldVcalendar, path, etag);
      }
      return request('put', path, headers, body, { graceperiod: CALENDAR_GRACE_DELAY }).then(function(response) {
        if (response.status !== 202) {
          return $q.reject(response);
        }
        taskId = response.data.id;
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
      });
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

    function _modifyPartStat(path, event, etag) {
      var headers = {
        'Content-Type': 'application/calendar+json',
        'Prefer': 'return=representation'
      };
      var body = shellToICAL(event).toJSON();

      if (etag) {
        headers['If-Match'] = etag;
      }

      return request('put', path, headers, body);
    }

    function changeParticipation(eventPath, event, emails, status, etag, emitEvents) {
      emitEvents = emitEvents || true;
      if (!angular.isArray(event.attendees)) {
        return $q.when(null);
      }

      if (!_applyPartstatToSpecifiedAttendees(event, emails, status)) {
        return $q.when(null);
      }

      return _modifyPartStat(eventPath, event, etag)
        .then(function(response) {
          if (response.status === 200) {
            var vcalendar = new ICAL.Component(response.data);
            return new CalendarShell(vcalendar, eventPath, response.headers('ETag'));
          } else if (response.status === 204) {
            return getEvent(eventPath).then(function(shell) {
              if (emitEvents) {
                $rootScope.$emit('modifiedCalendarItem', shell);
                socket('/calendars').emit('event:updated', shell.vcalendar);
              }
              return shell;
            });
          } else {
            return $q.reject(response);
          }
        })['catch'](function(response) {
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
      shellToICAL: shellToICAL,
      icalToShell: icalToShell,
      timezoneLocal: timezoneLocal,
      getInvitedAttendees: getInvitedAttendees
    };
  })

  .service('eventService', function(session, ICAL) {
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

    function isOrganizer(event) {
      var organizerMail = event && event.organizer && (event.organizer.email || event.organizer.emails[0]);
      return !organizerMail || (organizerMail in session.user.emailMap);
    }

    function isMajorModification(newEvent, oldEvent) {
      return !newEvent.start.isSame(oldEvent.start) || !newEvent.end.isSame(oldEvent.end);
    }

    return {
      originalEvent: originalEvent,
      editedEvent: editedEvent,
      render: render,
      copyEventObject: copyEventObject,
      isOrganizer: isOrganizer,
      isMajorModification: isMajorModification
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
