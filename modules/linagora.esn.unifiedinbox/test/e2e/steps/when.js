'use strict';

var messagePage = new (require('../pages/message'))();

var SENDING_MESSAGE = 'Sending of your message in progress...',
    SUCCEED_MESSAGE = 'Sending of your message succeeded';

module.exports = function() {

  this.When('I press "Send" button and wait for the message to be sent', function(next) {
    messagePage.composerSendButton.click();

    this.notifications.messages.each(function(message) {
      message.getText().then(function(notificationMessage) {
        if (notificationMessage !== SENDING_MESSAGE && notificationMessage !== SUCCEED_MESSAGE) {
          next(new Error('Unexpected notification message: ' + notificationMessage));
        }
        if (notificationMessage === SUCCEED_MESSAGE) {
          next();
        }
      });
    });
  });

};
