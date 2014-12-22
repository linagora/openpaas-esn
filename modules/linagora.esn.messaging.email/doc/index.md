# linagora.esn.messaging.email module

This module manages the reply-to-message by email feature.

A user may reply to an ESN message by sending back a response to an email delivered by the platform.
This is made possible by integrating a custom mail server which is able to detect message responses and route them to the current module.

In order to achieve that, the platform is able to send email from generated email addresses to user email inbox.
By sending back an email to this generated email address, the platform transforms the email into an ESN message and adds it as response to the original ESN message.

The current module is part of the platform services. This means that users are not able to access to it directly but the other platform services can.

## Authentication

As all platform services, the current module API needs authentication. We use the token based authentication.
Since the current module have to post the message response on behalf of the user, it have to 'login' first (ie fill the HTTP request with valid data). This is currently achieved like this:

1. Get a token for the user from its email address. Will not get any token if the user is not valid or unknown.
2. Set the token and the user in the next HTTP requests so the module can validate the token and inject the user in the HTTP request.

Then, the request behaves exactly like if the user is logged into the platform.



