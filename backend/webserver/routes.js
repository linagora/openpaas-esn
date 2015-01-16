'use strict';

var authorize = require('./middleware/authorization');
var cookielifetime = require('./middleware/cookie-lifetime');
var link = require('./middleware/link');
var requestMW = require('./middleware/request');
var config = require('../core').config('default');
var cors = require('cors');
var startupBuffer = require('./middleware/startup-buffer')(config.webserver.startupBufferTimeout);

exports = module.exports = function(application) {
  application.all('/api/*', cors());
  application.use(startupBuffer);
  application.use(require('./middleware/modules'));

  var oauth2 = require('../oauth2');
  application.get('/oauth/authorize', authorize.loginAndContinue, oauth2.authorization, oauth2.dialog);
  application.post('/oauth/authorize/decision', authorize.requiresAPILogin, oauth2.decision);
  application.post('/oauth/token', oauth2.token);

  var oauthclients = require('./controllers/oauthclients');
  application.get('/api/oauth/clients', authorize.requiresAPILogin, oauthclients.list);
  application.post('/api/oauth/clients', authorize.requiresAPILogin, oauthclients.create);
  application.get('/api/oauth/clients/:id', authorize.requiresAPILogin, oauthclients.get);
  application.delete('/api/oauth/clients/:id', authorize.requiresAPILogin, oauthclients.remove);
  application.get('/api/user/oauth/clients', authorize.requiresAPILogin, oauthclients.created);

  var companies = require('./controllers/companies');
  var domains = require('./controllers/domains');
  var domainMiddleware = require('./middleware/domain');
  application.get('/api/companies', companies.search);
  application.get('/api/domains/:uuid/members', authorize.requiresAPILogin, domainMiddleware.load, authorize.requiresDomainMember, domains.getMembers);
  application.get('/api/domains/:uuid', authorize.requiresAPILogin, domainMiddleware.load, authorize.requiresDomainMember, domains.getDomain);
  application.post('/api/domains', domains.createDomain);
  application.post('/api/domains/:uuid/invitations', authorize.requiresAPILogin, domainMiddleware.load, authorize.requiresDomainMember, domains.sendInvitations);
  application.get('/api/domains/:uuid/manager', authorize.requiresAPILogin, domainMiddleware.load, authorize.requiresDomainManager, domains.getDomain);

  var activitystreams = require('./controllers/activitystreams');
  var asMiddleware = require('./middleware/activitystream');
  application.get('/api/activitystreams/:uuid', authorize.requiresAPILogin, requestMW.requireRouteParams('uuid'), asMiddleware.findStreamResource, requestMW.assertRequestElementNotNull('activity_stream'), activitystreams.get);
  application.get('/api/activitystreams/:uuid/unreadcount', authorize.requiresAPILogin, requestMW.requireRouteParams('uuid'), asMiddleware.findStreamResource, requestMW.assertRequestElementNotNull('activity_stream'), activitystreams.getUnreadCount);
  application.get('/api/user/activitystreams', authorize.requiresAPILogin, activitystreams.getMine);
  application.get('/api/activitystreams/:uuid/resource', authorize.requiresAPILogin, requestMW.requireRouteParams('uuid'), asMiddleware.findStreamResource, activitystreams.getResource);

  var users = require('./controllers/users');
  application.get('/logout', users.logout);
  application.get('/api/users/:uuid/profile', authorize.requiresAPILogin, link.trackProfileView, users.profile);
  application.get('/api/user', authorize.requiresAPILogin, users.user);

  application.get('/api/users/:uuid/profile/avatar', users.load, users.getProfileAvatar);
  application.get('/api/users/:uuid', authorize.requiresAPILogin, users.profile);
  application.get('/api/user/profile', authorize.requiresAPILogin, users.user);
  application.put('/api/user/profile/:attribute', authorize.requiresAPILogin, users.updateProfile);
  application.post('/api/user/profile/avatar', authorize.requiresAPILogin, users.postProfileAvatar);
  application.get('/api/user/profile/avatar', authorize.requiresAPILogin, users.getProfileAvatar);

  var messages = require('./controllers/messages');
  var messageMiddleware = require('./middleware/message');
  application.get('/api/messages', authorize.requiresAPILogin, messages.getMessages);
  application.post('/api/messages', authorize.requiresAPILogin, messageMiddleware.canReplyTo, asMiddleware.requiresWritableTargets,
    messageMiddleware.checkTargets, messageMiddleware.checkMessageModel, messages.createOrReplyToMessage);
  application.get('/api/messages/:id', authorize.requiresAPILogin, messages.getMessage);
  application.post('/api/messages/:id/shares', authorize.requiresAPILogin, messages.copy);
  application.post('/api/messages/email', authorize.requiresAPILogin, asMiddleware.isValidStream, messages.createMessageFromEmail);

  var files = require('./controllers/files');
  var fileMiddleware = require('./middleware/file');
  application.post('/api/files',
                   authorize.requiresAPILogin,
                   requestMW.requireBody,
                   requestMW.requireQueryParams('mimetype', 'size'),
                   files.create);
  application.get('/api/files/:id', authorize.requiresAPILogin, files.get);
  application.delete('/api/files/:id', authorize.requiresAPILogin, requestMW.castParamToObjectId('id'), fileMiddleware.loadMeta, fileMiddleware.isOwner, files.remove);

  var views = require('./controllers/views');
  var templates = require('./middleware/templates');
  application.get('/views/*', templates.alterViewsFolder, views.views);

  require('./middleware/setup-routes')(application);

  var home = require('./controllers/home');
  application.get('/', home.index);

  application.get('/api/monitoring', require('./controllers/monitoring'));

  var caldav = require('./controllers/caldavserver');
  application.get('/api/caldavserver', authorize.requiresAPILogin, caldav.getCaldavUrl);

  var documentstore = require('./controllers/document-store');
  application.put('/api/document-store/connection', documentstore.store);
  application.put('/api/document-store/connection/:hostname/:port/:dbname', documentstore.test);

  var invitation = require('./controllers/invitation');
  application.post('/api/invitations', invitation.create);
  application.put('/api/invitations/:uuid', invitation.load, invitation.finalize);
  application.get('/api/invitations/:uuid', invitation.load, invitation.get);
  application.get('/invitation/signup', invitation.signup);
  application.get('/invitation/:uuid', invitation.load, invitation.confirm);

  var locale = require('./controllers/locale');
  application.get('/api/locales', locale.getAll);
  application.get('/api/locales/current', locale.get);
  application.get('/api/locales/:locale', locale.set);

  var loginController = require('./controllers/login');
  var loginRules = require('./middleware/login-rules');
  var recaptcha = require('./middleware/verify-recaptcha');
  application.get('/login', loginController.index);
  application.post('/api/login', loginRules.checkLoginCount, cookielifetime.set, recaptcha.verify, loginController.login);

  var authentication = require('./controllers/authtoken');
  application.get('/api/authenticationtoken', authorize.requiresAPILogin, authentication.getNewToken);
  application.get('/api/authenticationtoken/:token', authorize.requiresAPILogin, authentication.getToken);
  application.get('/api/authenticationtoken/:token/user', authentication.authenticateByToken);

  var conferenceController = require('./controllers/conferences');
  var liveConferenceController = require('./controllers/live-conference');
  var conferenceMiddleware = require('./middleware/conference');
  application.get('/conferences/:id', authorize.requiresAPILogin, liveConferenceController.open);
  application.get('/api/conferences/:id', authorize.requiresAPILogin, conferenceController.load, conferenceController.get);
  application.get('/api/conferences', authorize.requiresAPILogin, conferenceController.list);
  application.post('/api/conferences', authorize.requiresAPILogin, conferenceController.create);
  application.get('/api/conferences/:id/attendees', authorize.requiresAPILogin, conferenceController.loadWithAttendees, conferenceMiddleware.canJoin, conferenceController.getAttendees);
  application.put('/api/conferences/:id/attendees', authorize.requiresAPILogin, conferenceController.load, conferenceMiddleware.canJoin, conferenceController.updateAttendee);
  application.put('/api/conferences/:id/attendees/:user_id', authorize.requiresAPILogin, conferenceController.load, conferenceMiddleware.canAddAttendee, conferenceController.addAttendee);

  var contactsController = require('./controllers/contacts');
  var googleImportController = require('./controllers/import/google');
  application.get('/api/contacts', authorize.requiresAPILogin, contactsController.getContacts);
  application.get('/api/contacts/google/oauthurl', authorize.requiresAPILogin, googleImportController.getGoogleOAuthURL);
  application.get('/api/contacts/google/callback', authorize.requiresAPILogin, googleImportController.fetchGoogleContacts);
  application.post('/api/contacts/:id/invitations', authorize.requiresAPILogin, contactsController.load, contactsController.sendInvitation);
  application.get('/api/contacts/:id/invitations', authorize.requiresAPILogin, contactsController.load, contactsController.getContactInvitations);
  application.get('/api/contacts/invitations', authorize.requiresAPILogin, contactsController.getInvitations);

  var addressbooks = require('./controllers/addressbooks');
  application.get('/api/addressbooks', authorize.requiresAPILogin, addressbooks.getAddressBooks);

  var notifications = require('./controllers/notifications');
  var notificationMiddleware = require('./middleware/notification');
  application.get('/api/notifications', authorize.requiresAPILogin, notifications.list);
  application.get('/api/notifications/created', authorize.requiresAPILogin, notifications.created);
  application.get('/api/notifications/:id', authorize.requiresAPILogin, notifications.load, notificationMiddleware.userCanReadNotification, notifications.get);
  application.post('/api/notifications', authorize.requiresAPILogin, notifications.create);
  application.put('/api/notifications/:id', authorize.requiresAPILogin, notifications.load, notificationMiddleware.userCanWriteNotification, notifications.setAsRead);

  var usernotifications = require('./controllers/usernotifications');
  var usernotificationsAsMiddleware = require('./middleware/usernotifications');
  application.get('/api/user/notifications', authorize.requiresAPILogin, usernotifications.list);
  application.get('/api/user/notifications/unread', authorize.requiresAPILogin, usernotifications.getUnreadCount);
  application.put('/api/user/notifications/:id/read', authorize.requiresAPILogin, usernotifications.load, usernotificationsAsMiddleware.userCanWriteNotification, usernotifications.setRead);
  application.put('/api/user/notifications/:id/acknowledged', authorize.requiresAPILogin, usernotifications.load, usernotificationsAsMiddleware.userCanWriteNotification, usernotifications.setAcknowledged);
  application.put('/api/user/notifications/read', authorize.requiresAPILogin, usernotifications.loadAll, usernotificationsAsMiddleware.userCanReadAllNotifications, usernotifications.setAllRead);

  var communities = require('./controllers/communities');
  var communityMiddleware = require('./middleware/community');
  application.get('/api/communities', authorize.requiresAPILogin, domainMiddleware.loadFromDomainIdParameter, authorize.requiresDomainMember, communities.list);
  application.get('/api/communities/:id', authorize.requiresAPILogin, communities.load, communities.get);
  application.get('/api/communities/:id/avatar', authorize.requiresAPILogin, communities.load, communities.getAvatar);
  application.post('/api/communities', authorize.requiresAPILogin, communities.loadDomainForCreate, authorize.requiresDomainMember, communities.create);
  application.post('/api/communities/:id/avatar', authorize.requiresAPILogin, communities.load, authorize.requiresCommunityCreator, communities.uploadAvatar);
  application.delete('/api/communities/:id', authorize.requiresAPILogin, communities.load, authorize.requiresCommunityCreator, communities.delete);

  application.get('/api/user/communities', authorize.requiresAPILogin, communities.getMine);
  application.get('/api/communities/:id/members', authorize.requiresAPILogin, communities.load, communityMiddleware.canRead, communities.getMembers);
  application.put('/api/communities/:id/members/:user_id',
    authorize.requiresAPILogin,
    communities.load,
    requestMW.castParamToObjectId('user_id'),
    communityMiddleware.flagCommunityManager,
    communities.join
  );
  application.delete('/api/communities/:id/members/:user_id',
    authorize.requiresAPILogin,
    communities.load,
    requestMW.castParamToObjectId('user_id'),
    communityMiddleware.checkUserIdParameterIsCurrentUser,
    communityMiddleware.requiresCommunityMember,
    communityMiddleware.canLeave,
    communities.leave
  );
  application.get('/api/communities/:id/members/:user_id',
    authorize.requiresAPILogin,
    communities.load,
    communityMiddleware.canRead,
    requestMW.castParamToObjectId('user_id'),
    communities.getMember
  );
  application.get('/api/communities/:id/membership', authorize.requiresAPILogin, communities.load, communityMiddleware.flagCommunityManager, communities.getMembershipRequests);
  application.delete('/api/communities/:id/membership/:user_id', authorize.requiresAPILogin, communities.load, communityMiddleware.flagCommunityManager, communities.removeMembershipRequest);

  var collaborations = require('./controllers/collaborations');
  var collaborationMW = require('./middleware/collaboration');
  application.get('/api/collaborations/membersearch',
    authorize.requiresAPILogin,
    collaborations.searchWhereMember);
  application.get('/api/collaborations/:objectType/:id/members',
    authorize.requiresAPILogin,
    collaborationMW.load,
    collaborationMW.canRead,
    collaborations.getMembers);
  application.get('/api/collaborations/:objectType/:id/externalcompanies',
    authorize.requiresAPILogin,
    collaborationMW.load,
    collaborationMW.canRead,
    collaborations.getExternalCompanies
  );
  application.get('/api/collaborations/:objectType/:id/invitablepeople',
    authorize.requiresAPILogin,
    collaborationMW.load,
    collaborations.getInvitablePeople);
  application.put('/api/collaborations/:objectType/:id/membership/:user_id',
    authorize.requiresAPILogin,
    collaborationMW.load,
    requestMW.castParamToObjectId('user_id'),
    collaborationMW.checkUserParamIsNotMember,
    collaborationMW.flagCollaborationManager,
    collaborationMW.ifNotCollaborationManagerCheckUserIdParameterIsCurrentUser,
    collaborations.addMembershipRequest
  );

  var avatars = require('./controllers/avatars');
  application.get('/api/avatars', authorize.requiresAPILogin, avatars.get);

  var feedback = require('./controllers/feedback');
  var feedbackMiddleware = require('./middleware/feedback');
  application.post('/api/feedback', authorize.requiresAPILogin, feedbackMiddleware.checkFeedbackForm, feedback.createFeedback);

  var calendars = require('./controllers/calendars');
  application.post('/api/calendars/:objectType/:id/events',
    authorize.requiresAPILogin,
    collaborationMW.load,
    collaborationMW.requiresCollaborationMember,
    calendars.dispatchEvent);
};
