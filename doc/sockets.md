# Sockets & Namespaces

This documents sums up every websockets opened between a browser and the ESN.

- /activitystreams : Forward every *:activity messages from the globalpubsub.
                     Several rooms (of name activitystream_uuid) are created
                     to separate notifications sent to the clients.
