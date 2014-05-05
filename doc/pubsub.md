# Pubsub

The ESN comes with two types of publish/subscribe feature:

- Local: Inside an ESN instance (using event emitter)
- Remote: Between several ESN nodes (using redis)

## Topics

Here is a list of the available topics with their associated data.

### Local

- invitation:init:failure({invitation, error}). Fired each time an invitation initialization fails.
- invitation:init:success(invitation). Fired each time an invitation initialization is successful.
- invitation:finalize:failure({invitation, error}). Fired each time an invitation finalization fails.
- invitation:finalize:success(invitation). Fired each time an invitation finalization is successful.
- invitation:process:failure({invitation, error}). Fired each time an invitation process fails.
- invitation:process:success(invitation). Fired each time an invitation process is successful.
- login:failure(user). Fired each time a user login is not successful.
- login:success(user). Fired each time a user login is successful.
- mongodb:configurationAvailable. Fired when the mongodb configuration is available.
- mongodb:connexionAvailable. Fired every time the connection to the mongodb server is established.
- domain:invitations:sent({user, domain, emails}). Fired when domain invitations have been sent.
