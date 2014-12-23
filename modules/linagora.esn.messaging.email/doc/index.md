# linagora.esn.messaging.email module

This module manages the reply-to-message by email feature.

A user may reply to an ESN message by sending back a response to an email delivered by the platform.
This is made possible by integrating a custom mail server which is able to detect message responses and route them to the current module.

In order to achieve that, the platform is able to send email from generated email addresses to user email inbox.
By sending back an email to this generated email address, the platform transforms the email into an ESN message and adds it as response to the original ESN message.

The current module is part of the platform services. This means that users are not able to access to it directly but the other platform services can.



