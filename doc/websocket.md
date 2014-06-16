# Sockets & Namespaces

This documents sums up every websockets opened between a browser and the ESN.

## Namespaces

- /activitystreams : Forward every  \*:activity messages from the globalpubsub.
                     Several rooms (of name activitystream_uuid) are created
                     to separate notifications sent to the clients.

- /conferences : Forward every conference:* messages from the globalpubsub.
                 Several rooms (of name conference_id) are created for each new
                 conferences.

## Events

- notification. Fired each time a new notification is sent after subscribing to a chosen room, for a given namespace.
- invitation. Fired each time a new user is invited to a specific conferences.
