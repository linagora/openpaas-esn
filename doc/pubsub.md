# Pubsub

The ESN comes with two types of publish/subscribe feature:

- Local: Inside an ESN instance (using event emitter)
- Remote: Between several ESN nodes (using redis)

## Topics

Here is a list of the available topics with their associated data.

### Local

- login:failure(user). Fired each time a user login is not successful.
- login:success(user). Fired each time a user login is successful.
- mongodb:configurationAvailable. Fired when the mongodb configuration is available.