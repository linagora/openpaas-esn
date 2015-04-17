# Sockets & Namespaces

This documents sums up every websockets opened between a browser and the ESN.

## Namespaces

- /activitystreams : Forward every  \*:activity messages from the globalpubsub.
                     Several rooms (of name activitystream_uuid) are created
                     to separate notifications sent to the clients.

- /usernotifications : Forward 'usernotification:created' messages from the globalpubsub to the wsserver.
                       It is used to send usernotification.


## Events

- notification. Fired each time a new notification is sent after subscribing to a chosen room, for a given namespace.
