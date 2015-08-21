'use strict';

var initialized = false;
var NAMESPACE = '/contacts';
var CONTACT_ADDED = 'contacts:contact:add';
var CONTACT_DELETED = 'contacts:contact:delete';
var contactNamespace;

function init(dependencies) {
    var logger = dependencies('logger');
    var pubsub = dependencies('pubsub').local;
    var io = dependencies('wsserver').io;

    function synchronizeContactLists(event, data) {
        if (contactNamespace) {
            contactNamespace.to(data.bookId).emit(event, {room: data.bookId, data: data});
        }
    }

    if (initialized) {
        logger.warn('The contact notification service is already initialized');
        return;
    }

    pubsub.topic(CONTACT_DELETED).subscribe(function(data) {
        logger.info('Notifying contact delete');
        synchronizeContactLists('contact:deleted', data);
    });

    pubsub.topic(CONTACT_ADDED).subscribe(function(data) {
        logger.info('Notifying contact creation');
        synchronizeContactLists('contact:created', data);
    });

    contactNamespace = io.of(NAMESPACE);
    contactNamespace.on('connection', function(socket) {
        logger.info('New connection on ' + NAMESPACE);

        socket.on('subscribe', function(bookId) {
            logger.info('Joining contact room', bookId);
            socket.join(bookId);
        });

        socket.on('unsubscribe', function(bookId) {
            logger.info('Leaving contact room', bookId);
            socket.leave(bookId);
        });
    });

    initialized = true;
}

module.exports.init = init;
