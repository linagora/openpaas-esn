(function() {
  'use strict';

  angular.module('linagora.esn.unifiedinbox')

    .factory('inboxJmapHelper', function($q, jmap, emailBodyService, withJmapClient, inboxIdentitiesService, _, JMAP_GET_MESSAGES_VIEW) {
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
        return $q.when(emailState.identity || inboxIdentitiesService.getDefaultIdentity())
          .then(function(identity) {
            var message = {
              from: new jmap.EMailer({
                email: identity.email,
                name: identity.name
              }),
              replyTo: identity.replyTo ? [new jmap.EMailer({ email: identity.replyTo })] : null,
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
          });
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
