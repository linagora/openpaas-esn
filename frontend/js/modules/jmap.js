/*global JMAP */

'use strict';

angular.module('esn.jmap-js', ['esn.overture'])
  .service('jmap', function(overture) {

    function login(username, accessToken, jmapServerUrl) {
      JMAP.auth.didAuthenticate(username, '', {
        apiUrl: jmapServerUrl + '/jmap/' + accessToken,
        eventSourceUrl: jmapServerUrl + '/events/' + accessToken,
        uploadUrl: jmapServerUrl + '/upload/' + accessToken,
        downloadUrl: jmapServerUrl + '/raw/' + accessToken + '/{blobId}/{name}'
      });
    }

    function listMailboxes(contentChangedCallback) {
      var observableMailboxes = overture.createObservableArray(
        JMAP.store.getQuery('allMailboxes', overture.O.LiveQuery, {
          Type: JMAP.Mailbox
        }),
        contentChangedCallback
      ).contentDidChange();
      JMAP.store.on(JMAP.Mailbox, observableMailboxes, 'contentDidChange');
    }

    function listEmails(options, contentChangedCallback) {
      var request = {
        query: JMAP.store.getQuery(
          JMAP.MessageList.getId(options),
          JMAP.MessageList,
          options
        ),
        callback: contentChangedCallback
      };
      request.query.addObserverForRange({}, request, 'callback');
      request.query.reset();
      request.query.refresh();
      overture.O.RunLoop.flushAllQueues();
    }

    function getEmail(emailId, updateCallback) {
      var request = {
        record: JMAP.store.getRecord(JMAP.Message, emailId),
        callback: updateCallback
      };

      request.record.addObserverForKey('*', request, 'callback');
      request.record.fetchDetails();
      overture.O.RunLoop.flushAllQueues();

      return request.record;
    }

    return {
      login: login,
      listMailboxes: listMailboxes,
      listEmails: listEmails,
      getEmail: getEmail
    };
  });
