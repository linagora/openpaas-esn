(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .factory('inboxJmapHelper', function(jmap, session, emailBodyService, userUtils, withJmapClient, _, JMAP_GET_MESSAGES_VIEW) {
      return {
        getMessageById: getMessageById,
        toOutboundMessage: toOutboundMessage
      };

      /////

      function getMessageById(id) {
        return withJmapClient(function(client) {
          return client.getMessages({ ids: [id], properties: JMAP_GET_MESSAGES_VIEW }).then(_.head);
        });
      }

      function toOutboundMessage(jmapClient, emailState) {
        var message = {
          from: new jmap.EMailer({
            email: session.user.preferredEmail,
            name: userUtils.displayNameOf(session.user)
          }),
          subject: emailState.subject,
          to: _mapToEMailer(emailState.to),
          cc: _mapToEMailer(emailState.cc),
          bcc: _mapToEMailer(emailState.bcc)
        };
        var bodyProperty = emailState.htmlBody ? 'htmlBody' : emailBodyService.bodyProperty;

        message[bodyProperty] = emailState[bodyProperty];

        if (emailState.attachments) {
          message.attachments = (emailState.attachments || []).filter(function(attachment) {
            return attachment.blobId;
          });
        }

        return new jmap.OutboundMessage(jmapClient, message);
      }

      function _mapToEMailer(recipients) {
        return (recipients || []).map(function(recipient) {
          return new jmap.EMailer({
            name: recipient.name,
            email: recipient.email
          });
        });
      }
    });

})();
