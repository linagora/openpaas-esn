# Pubsub

The ESN comes with two types of publish/subscribe feature:

- Local: Inside an ESN instance (using event emitter)
- Remote: Between several ESN nodes (using redis)

## API

    var pubsub = require(_pathToPubsub_).local(|global);
    pubsub.topic(_channel_).subscribe(callback);
    pubsub.topic(_channel_).publish(data);

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

- webserver:mongosessionstoreEnabled. Fires when the webserver session store is switched from in-memory (the one on startup) to mongodb.

- redis:configurationAvailable. Fired when the redis configuration is available.

- domain:invitations:sent({user, domain, emails}). Fired when domain invitations have been sent.

- message:stored(message). Fired when a new message is stored in the datastore layer.
- message:comment(message). Fired when a new comment is added to a message responses attribut in the datastore layer.
                            Note that the message (which is the comment) contains a new 'inReplyTo' field.
- message:activity({source, targets, message, date, verb}). Fired when there is an activity on a message (create, comment, ...).
- conference:join({conference_id, user_id}). Fired when a user joins a conference.
- conference:leave({conference_id, user_id}). Fired when a user leaves a conference.

- community:join({author, target, community}). Fired when a user joins a community.
- community:leave({author, target, community}). Fired when a user leaves a community.
- community:membership:invitation:cancel({author = manager _id, target = attendee _id, membership = membership data structure, community = community _id}).
Fired when a community manager removes the invitation sent to an attendee
- community:membership:invitation:decline({author = attendee _id, target = community _id, membership = membership data structure, community = community _id}).
Fired when an attendee decline an invitation to join a community
- community:membership:request:refuse({author = manager _id, target = attendee _id, membership = membership data structure, community = community _id}).
Fired when a community manager refuses the request sent by a user to join a community
- community:membership:request:cancel({author = attendee _id, target = community _id, membership = membership data structure, community = community _id}).
Fired when an attendee removes its request to join a community
- community:membership:invite({author, target, community}). Fired when a manager invite a user in a community.
- community:membership:request({author, target, community}). Fired when a user send a membership request to a community.

#### message:stored

A message has been persisted in the datastore.
The notification data contains the message object (ie the one which has been persisted with its id).

    pubsub.topic('message:stored').publish(message);

#### message:activity

Some resource (user,bot,...), called the author did some activity on the message. This activity **may** be specific to some targets.
The notification data contains a timelineentry compliant message.

For example, when a user 123 has sent a message 456 to the user 789:

    pubsub.topic('message:activity').publish({
      verb: 'post',
      language: 'en',
      published: Date.now(),
      actor: {
        objectType: 'user',
        _id: 123,
        image: 987654321,
        displayName: 'Awesome User'
      },
      object: {
        objectType: 'whatsup',
        _id: 456
      },
      target: [
        {
          objectType: 'user',
          _id: 798
        }
      ]
    });

*Use cases*

- A message is posted by a user on a domain stream: 1 source and 1 target.
- A message is sent by a user to another user: 1 source and 1 target.
- A message is sent by a user to two users: 1 source and 2 targets

### Global

- message:activity({source, targets, message, date, verb}). Fired when there is an activity on a message (create, comment, ...).

### Summary

|                 | Local                                   |                             | Global  |           | Notes |
|-----------------|-----------------------------------------|-----------------------------|---------|-----------|-------|
|                 | Publish                                 | Subscribe                   | Publish | Subscribe |       |
| Modules         |                                         |                             |         |           |       |
| activitystreams |                                         | message:activity            |         |           |       |
|                 |                                         | community:join              |         |           |       |
| conference      | conference:join                         |                             |         |           |       |
|                 | conference:leave                        |                             |         |           |       |
| community       | community:join                          |                             |         |           |       |
|                 | community:leave                         |                             |         |           |       |
|                 | community:membership:invitation:cancel  |                             |         |           |       |
|                 | community:membership:invitation:decline |                             |         |           |       |
|                 | community:membership:request:refuse     |                             |         |           |       |
|                 | community:membership:request:cancel     |                             |         |           |       |
|                 | community:membership:invite             |                             |         |           |       |
|                 | community:membership:request            |                             |         |           |       |
| user/login      | login:success                           |                             |         |           |       |
|                 | login:failure                           |                             |         |           |       |
| invitation      | invitation:init:failure                 |                             |         |           |       |
|                 | invitation:init:success                 |                             |         |           |       |
|                 | invitation:finalize:failure             |                             |         |           |       |
|                 | invitation:finalize:success             |                             |         |           |       |
|                 | invitation:process:failure              |                             |         |           |       |
|                 | invitation:process:success              |                             |         |           |       |
| db/redis        |                                         | mongodb:connectionAvailable |         |           |       |
| db/mongo        | mongodb:connectionAvailable             |                             |         |           |       |
| configured      | mongodb:connectionAvailable             |                             |         |           |       |
| templates       |                                         | mongodb:connectionAvailable |         |           |       |
| pubsub/global   |                                         | globalpubsub:config         |         |           |       |
|                 |                                         |                             |         |           |       |
| Controllers     |                                         |                             |         |           |       |
| domains         | domain:invitations:sent                 |                             |         |           |       |
| messages        | message:activity                        | message:activity            |         |           |       |
|                 |                                         |                             |         |           |       |
| Middleware      |                                         |                             |         |           |       |
| setup-sessions  |                                         | mongodb:connectionAvailable |         |           |       |
