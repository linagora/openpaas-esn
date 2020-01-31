const join = require('path').join;
const CORE_JS_URIPATH = '/js/modules';
const CORE_JS_BASEPATH = join(__dirname, '../../frontend', CORE_JS_URIPATH);

const injections = [
  {angular: 'esn.core', files: ['core.js'], innerApps: ['esn']},
  {angular: 'esn.chips', files: [
    'chips/chips.module.js',
    'chips/chips.run.js'
  ], innerApps: ['esn']},
  {angular: 'esn.datepickerUtils', files: ['datepicker-utils.js'], innerApps: ['esn']},
  {angular: 'esn.cache', files: ['cache.js'], innerApps: ['esn']},
  {angular: 'esn.scroll', files: ['scroll.js'], innerApps: ['esn']},
  {angular: 'esn.onscroll', files: [
    'onscroll/on-scroll.module.js',
    'onscroll/on-scroll.directive.js'
  ], innerApps: ['esn']},
  {angular: 'esn.multi-input', files: ['multi-input.js'], innerApps: ['esn']},
  {angular: 'esn.http', files: ['http.js'], innerApps: ['esn', 'welcome']},
  {angular: 'esn.header', files: [
    'header/header.js',
    'header/header-featureflip.run.js',
    'header/sticky/header-sticky.directive.js'
  ], innerApps: ['esn']},
  {angular: 'esn.profile-menu', files: [
    'header/profile-menu/profile-menu.module.js',
    'header/profile-menu/profile-menu.component.js',
    'header/profile-menu/profile-menu.controller.js',
    'header/profile-menu/profile-menu.config.js'
  ], innerApps: ['esn']},
  {angular: 'esn.subheader', files: [
    'subheader/subheader.module.js',
    'subheader/subheader.constants.js',
    'subheader/sub-header.service.js',
    'subheader/sub-header.directive.js',
    'subheader/sub-header-container.directive.js',
    'subheader/sub-header-aware.directive.js',
    'subheader/save-button/save-button.controller.js',
    'subheader/save-button/save-button.component.js'
  ], innerApps: ['esn']},
  {angular: 'esn.socketio', files: ['socketio.js'], innerApps: ['esn']},
  {angular: 'esn.domain', files: ['domain.js'], innerApps: ['esn', 'welcome']},
  {angular: 'esn.member', files: ['member.js', 'member/member-resolver-registry.service.js'], innerApps: ['esn']},
  {angular: 'esn.module-registry', files: ['module-registry/module-registry.module.js', 'module-registry/module-registry.service.js'], innerApps: ['esn']},
  {angular: 'esn.search', files: [
    'search/search.module.js',
    'search/search.constants.js',
    'search/search.router.js',
    'search/search.service.js',
    'search/context/search-context.service.js',
    'search/form/search-form.directive.js',
    'search/form/advanced/search-advanced-form.component.js',
    'search/form/advanced/search-advanced-form.controller.js',
    'search/form/advanced/search-advanced-toggle-button.component.js',
    'search/form/advanced/search-advanced-toggle-button.controller.js',
    'search/header/search-header.component.js',
    'search/header/search-header.controller.js',
    'search/result/search-result-size-formatter.service.js',
    'search/result/search-result.controller.js',
    'search/result/search-result.component.js',
    'search/result/search-result-item.component.js',
    'search/result/search-result-item.controller.js',
    'search/sub-header/sub-header.directive.js',
    'search/application-menu.directive.js',
    'search/search-providers.service.js',
    'search/provider-select/search-provider-select.component.js',
    'search/provider-select/search-provider-select.controller.js',
    'search/query/search-query.service.js',
    'search/search-provider.service.js'
  ], innerApps: ['esn']},
  {angular: 'esn.infinite-list', files: [
    'infinite-list/infinite-list.module.js',
    'infinite-list/infinite-list-scroll-helper-builder.service.js',
    'infinite-list/infinite-list-scroll-helper.service.js',
    'infinite-list/infinite-list-scroll-on-groups-helper.service.js',
    'infinite-list/infinite-list.config.js',
    'infinite-list/infinite-list.constants.js',
    'infinite-list/infinite-list.directive.js',
    'infinite-list/infinite-list.service.js'
  ], innerApps: ['esn']},

  {angular: 'esn.sidebar', files: ['sidebar.js'], innerApps: ['esn']},
  {angular: 'esn.avatar', files: [
    'avatar.js',
    'avatar/list/avatar-list.component.js',
    'avatar/list/avatar-list.controller.js',
    'avatar/avatar-url.service.js'
  ], innerApps: ['esn']},
  {angular: 'esn.user', files: [
    'user/user.module.js',
    'user/user.constants.js',
    'user/user-api.service.js',
    'user/user-utils.service.js',
    'user/username.service.js',
    'user/users-autocomplete-input/users-autocomplete-input.directive.js',
    'user/user.run.js'
  ], innerApps: ['esn', 'welcome']},
  {angular: 'esn.message', files: [
    'message/message.module.js',
    'attachment-alternative-uploader-modal-no-uploader/attachment-alternative-uploader-modal-no-uploader.constants.js',
    'attachment-alternative-uploader-modal-no-uploader/attachment-alternative-uploader-modal-no-uploader.controller.js',
    'message.js',
    'message/actions/message-actions-dropdown.component.js',
    'message/actions/message-actions.controller.js',
    'message/message-helpers.service.js',
    'message/message-registry.service.js',
    'message/message.service.js'
  ], innerApps: ['esn']},
  {angular: 'esn.session', files: ['session.js'], innerApps: ['esn', 'welcome']},
  {angular: 'esn.oauth-application', files: [
    'oauth-application/oauth-application.module.js',
    'oauth-application/oauth-application.config.js',
    'oauth-application/oauth-application.router.js',
    'oauth-application/oauth-application-client.service.js',
    'oauth-application/card/oauth-application-card.component.js',
    'oauth-application/form/add/oauth-application-add-form-modal.component.js',
    'oauth-application/form/add/oauth-application-add-form.component.js',
    'oauth-application/form/add/oauth-application-add-form.controller.js',
    'oauth-application/form/edit/oauth-application-edit-form.component.js',
    'oauth-application/form/edit/oauth-application-edit-form.controller.js',
    'oauth-application/list/oauth-application-list.component.js',
    'oauth-application/list/oauth-application-list.controller.js',
    'oauth-application/menu/oauth-application-menu-controlcenter.directive.js',
    'oauth-application/view/oauth-application-view.component.js',
    'oauth-application/view/oauth-application-view.controller.js'
  ], innerApps: ['esn']},
  {angular: 'esn.authentication', files: ['authentication.js'], innerApps: ['esn']},
  {angular: 'esn.notification', files: ['notification.js'], innerApps: ['esn', 'welcome']},
  {angular: 'esn.api-notification', files: ['api-notification.js'], innerApps: ['esn']},
  {angular: 'esn.community', files: [
    'community/community.module.js',
    'community/community.constants.js',
    'community/community.run.js',
    'community/community-registry.run.js',
    'community/community.config.js',
    'community/community.router.js',
    'community/community-configuration.service.js',
    'community/about/community-about.component.js',
    'community/about/community-about.controller.js',
    'community/members/members/community-members.component.js',
    'community/members/members/community-members.controller.js',
    'community/members/tabs/community-members-tabs.component.js',
    'community/members/tabs/community-members-tabs.controller.js',
    'community/members/invitations/community-members-invitations.component.js',
    'community/members/invitations/community-members-invitations.controller.js',
    'community/members/requests/community-members-requests.component.js',
    'community/members/requests/community-members-requests.controller.js',
    'community/pending-invitation/community-pending-invitation-list.component.js',
    'community/pending-invitation/community-pending-invitation-list.controller.js',
    'community/pending-invitation/community-pending-invitation-display.component.js',
    'community/pending-invitation/community-pending-invitation-display.controller.js',
    'community/remove/community-remove-modal.service.js',
    'community/view/community-view.controller.js',
    'community/view/header/community-view-header.directive.js',
    'community/view/tabs/community-view-tabs.component.js',
    'community/list/community-list.controller.js',
    'community/list/item/community-list-item.directive.js',
    'community/application-menu/application-menu.directive.js',
    'community/community.js'
  ], innerApps: ['esn']},
  {angular: 'esn.rest.helper', files: ['rest-helper.js'], innerApps: ['esn']},
  {angular: 'esn.activitystream', files: [
    'activitystream.js',
    'activitystream/services.js',
    'activitystream/controllers.js',
    'activitystream/directives.js'
  ], innerApps: ['esn']},
  {angular: 'esn.websocket', files: ['websocket.js'], innerApps: ['esn']},
  {angular: 'esn.collaboration', files: [
    'collaboration/collaboration.module.js',
    'collaboration/collaboration.run.js',
    'collaboration/collaboration.constants.js',
    'collaboration/create/collaboration-create-button.component.js',
    'collaboration/invite/collaboration-invite-users.directive.js',
    'collaboration/member/collaboration-member-avatar.component.js',
    'collaboration/member/collaboration-member-avatar.controller.js',
    'collaboration/member/collaboration-member.component.js',
    'collaboration/member/collaboration-member.controller.js',
    'collaboration/members/list/collaboration-members-list.component.js',
    'collaboration/members/list/collaboration-members-list.controller.js',
    'collaboration/members/collaboration-members-widget.directive.js',
    'collaboration/members/collaboration-members.component.js',
    'collaboration/members/add/collaboration-members-add.component.js',
    'collaboration/members/add/collaboration-members-add.controller.js',
    'collaboration/members/add/add-item/collaboration-members-add-item.component.js',
    'collaboration/members/add/add-item/collaboration-members-add-item.controller.js',
    'collaboration/membership/collaboration-membership-requests-actions.controller.js',
    'collaboration/membership/collaboration-membership-requests-actions.component.js',
    'collaboration/membership/collaboration-membership-requests-widget.controller.js',
    'collaboration/membership/collaboration-membership-requests-widget.component.js',
    'collaboration/services/collaboration-registry.service.js',
    'collaboration/services/collaboration-client.service.js',
    'collaboration/services/collaboration-listener.service.js',
    'collaboration/services/collaboration.service.js',
    'collaboration/services/collaboration-member-pagination-provider.service.js',
    'collaboration/services/collaboration-membership-requests-pagination-provider.service.js',
    'collaboration/user-notifications/collaboration-invitation-accept-button.directive.js',
    'collaboration/user-notifications/collaboration-invitation-decline-button.directive.js',
    'collaboration/user-notifications/collaboration-join.directive.js',
    'collaboration/user-notifications/collaboration-membership-invitation.directive.js',
    'collaboration/user-notifications/collaboration-membership-request-accepted.component.js',
    'collaboration/user-notifications/collaboration-membership-request-declined.component.js',
    'collaboration/user-notifications/collaboration-request-membership-action.controller.js'
  ], innerApps: ['esn']},
  {angular: 'esn.feedback', files: ['feedback.js'], innerApps: ['esn']},
  {angular: 'esn.maps', files: ['maps.js'], innerApps: ['esn']},
  {angular: 'esn.activitystreams-tracker', files: ['activitystreams-tracker.js'], innerApps: ['esn']},
  {angular: 'esn.paginate', files: ['paginate.js'], innerApps: ['esn']},
  {angular: 'esn.pagination', files: [
    'pagination/pagination.module.js',
    'pagination/pagination.constants.js',
    'pagination/pagination-provider-builder.service.js',
    'pagination/pagination-provider.service.js'
  ], innerApps: ['esn']},
  {angular: 'esn.object-type', files: ['object-type.js'], innerApps: ['esn', 'welcome']},
  {angular: 'esn.file', files: ['file.js'], innerApps: ['esn']},
  {angular: 'esn.background', files: ['background.js'], innerApps: ['esn']},
  {angular: 'esn.parser', files: ['parser.js'], innerApps: ['esn']},
  {angular: 'esn.parser', files: ['markdown-parser.js'], innerApps: ['esn']},
  {angular: 'esn.parser', files: ['markdown-parser.js'], innerApps: ['esn']},
  {angular: 'esn.widget.helper', files: ['widget-helper.js'], innerApps: ['esn']},
  {angular: 'esn.twitter', files: ['twitter.js'], innerApps: ['esn']},
  {angular: 'esn.oembed', files: ['oembed/oembed.js'], innerApps: ['esn']},
  {angular: 'esn.oembed.youtube', files: ['oembed/youtube.js'], innerApps: ['esn']},
  {angular: 'esn.oembed.instagram', files: ['oembed/instagram.js'], innerApps: ['esn']},
  {angular: 'esn.oembed.soundcloud', files: ['oembed/soundcloud.js'], innerApps: ['esn']},
  {angular: 'esn.oembed.deezer', files: ['oembed/deezer.js'], innerApps: ['esn']},
  {angular: 'esn.oembed.vimeo', files: ['oembed/vimeo.js'], innerApps: ['esn']},
  {angular: 'esn.oembed.slideshare', files: ['oembed/slideshare.js'], innerApps: ['esn']},
  {angular: 'esn.oembed.codepen', files: ['oembed/codepen.js'], innerApps: ['esn']},
  {angular: 'esn.oembed.gist', files: ['oembed/gist.js'], innerApps: ['esn']},
  {angular: 'esn.oembed.twitter', files: ['oembed/twitter.js'], innerApps: ['esn']},
  {angular: 'esn.oembed.image', files: ['oembed/image.js'], innerApps: ['esn']},
  {angular: 'esn.injection', files: ['injection.js'], innerApps: ['esn']},
  {angular: 'esn.localstorage', files: ['localstorage.js'], innerApps: ['esn']},
  {angular: 'esn.profile', files: ['profile.js'], innerApps: ['esn']},
  {angular: 'esn.profile-popover-card', files: [
      'profile-popover-card/profile-popover-card.module.js',
      'profile-popover-card/profile-popover-card.service.js',
      'profile-popover-card/profile-popover-card.directive.js',
      'profile-popover-card/profile-popover-content/profile-popover-content.component.js',
      'profile-popover-card/profile-popover-content/profile-popover-content.controller.js'
  ], innerApps: ['esn']},
  {angular: 'esn.summernote-wrapper', files: ['esn.summernote.js'], innerApps: ['esn']},
  {angular: 'esn.poll', files: ['poll.js'], innerApps: ['esn']},
  {angular: 'esn.array-helper', files: ['array-helper.js'], innerApps: ['esn']},
  {angular: 'esn.alphalist', files: ['alphalist.js'], innerApps: ['esn']},
  {angular: 'esn.ui', files: ['ui.js'], innerApps: ['esn', 'welcome']},
  {angular: 'esn.attendee', files: [
    'attendee/attendee.module.js',
    'attendee/attendee.run.js',
    'attendee/attendee.constants.js',
    'attendee/attendee.service.js'
  ], innerApps: ['esn', 'welcome']},
  {angular: 'esn.availability', files: [
    'availability/availability.module.js',
    'availability/availability.constants.js',
    'availability/availability.service.js'
  ], innerApps: ['esn']},
  {angular: 'esn.jmap-client-wrapper', files: ['jmap-client-wrapper.js'], innerApps: ['esn']},
  {angular: 'esn.iframe-resizer-wrapper', files: ['iframe-resizer-wrapper.js'], innerApps: ['esn']},
  {angular: 'esn.email-addresses-wrapper', files: ['email-addresses-wrapper.js'], innerApps: ['esn']},
  {angular: 'esn.box-overlay', files: [
    'box-overlay/box-overlay.module.js',
    'box-overlay/box-overlay.constants.js',
    'box-overlay/box-overlay-container.directive.js',
    'box-overlay/box-overlay-opener.service.js',
    'box-overlay/box-overlay-state-manager.service.js',
    'box-overlay/box-overlay.directive.js',
    'box-overlay/box-overlay.provider.js',
    'box-overlay/box-overlay-manager.service.js'
  ], innerApps: ['esn']},
  {angular: 'esn.back-detector', files: ['back-detector.js'], innerApps: ['esn']},
  {angular: 'esn.fullscreen-edit-form', files: ['fullscreen-edit-form.js'], innerApps: ['esn']},
  {angular: 'esn.offline-wrapper', files: ['esn.offline.js'], innerApps: ['esn']},
  {angular: 'esn.router', files: ['esn.router.js'], innerApps: ['esn']},
  {angular: 'esn.url', files: ['url.js'], innerApps: ['esn']},
  {angular: 'esn.actionList', files: ['action-list.js'], innerApps: ['esn']},
  {angular: 'esn.lodash-wrapper', files: ['lodash-wrapper.js'], innerApps: ['esn', 'welcome']},
  {angular: 'esn.aggregator', files: ['aggregator.js'], innerApps: ['esn']},
  {angular: 'esn.provider', files: ['provider.js'], innerApps: ['esn']},
  {angular: 'esn.application-menu', files: ['application-menu.js'], innerApps: ['esn']},
  {angular: 'esn.settings-overlay', files: ['settings-overlay.js'], innerApps: ['esn']},
  {angular: 'esn.desktop-utils', files: ['desktop-utils.js'], innerApps: ['esn']},
  {angular: 'esn.beforeunload', files: ['beforeunload.js'], innerApps: ['esn']},
  {angular: 'esn.configuration', files: [
    'config/config.module.js',
    'config/config.constants.js',
    'config/config.service.js',
    'config/config-api.service.js'
  ], innerApps: ['esn', 'welcome']},
  {angular: 'esn.highlight', files: ['highlight.js'], innerApps: ['esn']},
  {angular: 'esn.dragndrop', files: ['dragndrop.js'], innerApps: ['esn']},
  {angular: 'esn.autolinker-wrapper', files: ['esn.autolinker-wrapper.js'], innerApps: ['esn', 'welcome']},
  {angular: 'esn.like', files: ['like.js'], innerApps: ['esn']},
  {angular: 'esn.resource-link', files: ['resource-link.js'], innerApps: ['esn']},
  {angular: 'esn.timeline', files: [
    'timeline/timeline.module.js',
    'timeline/timeline.constants.js',
    'timeline/timeline-api.service.js',
    'timeline/timeline-entries-helper.service.js',
    'timeline/timeline-entries.component.js',
    'timeline/timeline-entries.controller.js',
    'timeline/timeline-entry-displayer.component.js',
    'timeline/providers/timeline-entry-providers.service.js',
    'timeline/providers/timeline-pagination-provider.service.js',
    'timeline/controlcenter/timeline-controlcenter-menu.directive.js',
    'timeline/controlcenter/timeline-controlcenter.config.js'
  ], innerApps: ['esn']},
  {angular: 'esn.follow', files: [
    'follow/follow.module.js',
    'follow/follow.run.js',
    'follow/follow.constants.js',
    'follow/follow-api-client.service.js',
    'follow/button/follow-button.directive.js',
    'follow/card/follow-card.directive.js',
    'follow/list/follower-list.directive.js',
    'follow/list/follower-list.controller.js',
    'follow/list/following-list.directive.js',
    'follow/list/following-list.controller.js',
    'follow/pagination/follow-pagination-helper.service.js',
    'follow/pagination/follow-pagination-provider.service.js',
    'follow/pagination/follow-scroll-builder.service.js'
  ], innerApps: ['esn']},
  {angular: 'esn.escape-html', files: ['escape-html.js'], innerApps: ['esn', 'welcome']},
  {angular: 'esn.dropdownList', files: ['dropdown-list.js'], innerApps: ['esn']},
  {angular: 'esn.async-action', files: ['async-action.js'], innerApps: ['esn']},
  {angular: 'esn.touchscreen-detector', files: ['touchscreen-detector.js'], innerApps: ['esn']},
  {angular: 'esn.previous-page', files: ['previous-page.js'], innerApps: ['esn']},
  {angular: 'esn.file-saver', files: ['file-saver.js'], innerApps: ['esn']},
  {angular: 'esn.media.query', files: ['media-query.js'], innerApps: ['esn']},
  {angular: 'esn.ldap', files: ['ldap.js'], innerApps: ['esn']},
  {angular: 'esn.registry', files: ['registry.js'], innerApps: ['esn', 'welcome']},
  {angular: 'esn.attachment', files: [
    'attachment/attachment.module.js',
    'attachment/attachment-icon.component.js',
    'attachment/attachment-icon.controller.js',
    'attachment/attachment.constant.js',
    'attachment/attachment.component.js',
    'attachment/attachment.controller.js',
    'attachment/attachment-registry.service.js',
    'attachment/preview/default-preview/default-preview.constant.js',
    'attachment/preview/default-preview/default-preview.component.js',
    'attachment/preview/image-preview/image-preview.constant.js',
    'attachment/preview/image-preview/image-preview.run.js',
    'attachment/preview/image-preview/image-preview.component.js',
    'attachment/viewer/attachment-viewer.service.js',
    'attachment/viewer/attachment-viewer-gallery.service.js',
    'attachment/viewer/attachment-viewer.directive.js',
    'attachment/viewer/default-viewer/default-viewer.constant.js',
    'attachment/viewer/default-viewer/default-viewer.directive.js',
    'attachment/viewer/video-viewer/video-viewer.constant.js',
    'attachment/viewer/video-viewer/video-viewer.run.js',
    'attachment/viewer/video-viewer/video-viewer.directive.js',
    'attachment/viewer/image-viewer/image-viewer.constant.js',
    'attachment/viewer/image-viewer/image-viewer.run.js',
    'attachment/viewer/image-viewer/image-viewer.directive.js'
  ], innerApps: ['esn']},
  {angular: 'esn.attachment-list', files: [
    'attachment/list/attachment-list.module.js',
    'attachment/list/attachment-list-providers.service.js',
    'attachment/list/attachment-list.component.js',
    'attachment/list/attachment-list.controller.js',
    'attachment/list/item/attachment-list-item.component.js'
  ], innerApps: ['esn']},
  {angular: 'esn.user-notification', files: [
    'user-notification/user-notification.module.js',
    'user-notification/list/item/user-notification-list-item.directive.js',
    'user-notification/list/user-notification-list.component.js',
    'user-notification/list/user-notification-list.controller.js',
    'user-notification/services/user-notification-counter.service.js',
    'user-notification/services/user-notification-severity.service.js',
    'user-notification/services/user-notification-state.service.js',
    'user-notification/services/user-notification.service.js',
    'user-notification/services/websocket/listener.service.js',
    'user-notification/subheader/user-notification-subheader.component.js',
    'user-notification/templates/external/user-notification-external-template.directive.js',
    'user-notification/templates/simple/user-notification-simple-template.directive.js',
    'user-notification/templates/user-notification-template-provider-registry.service.js',
    'user-notification/toggler/user-notification-toggler.controller.js',
    'user-notification/toggler/user-notification-toggler.directive.js',
    'user-notification/user-notification-featureflip.run.js',
    'user-notification/user-notification.constants.js',
    'user-notification/user-notification.run.js',
    'user-notification/user-notification.router.js',
    'user-notification/services/user-notification.js',
    'user-notification/services/providers/user-notification-default-provider.service.js',
    'user-notification/services/providers/user-notification-providers.service.js',
    'user-notification/services/providers/user-notification-default.js'
  ], innerApps: ['esn']},
  {angular: 'esn.user-configuration', files: [
    'user-configuration/user-configuration.module.js',
    'user-configuration/user-configuration.service.js',
    'user-configuration/user-configuration.constants.js'
  ], innerApps: ['esn']},
  {angular: 'esn.waves', files: ['esn.waves.js'], innerApps: ['esn', 'welcome']},
  {angular: 'esn.mutation-observer', files: ['esn.mutation-observer.js'], innerApps: ['esn']},
  {angular: 'esn.textarea-autosize', files: ['textarea-autosize.js'], innerApps: ['esn', 'welcome']},
  {angular: 'esn.login', files: ['login.js', 'login/login-success.service.js'], innerApps: ['esn', 'welcome', 'password-reset']},
  {angular: 'esn.material', files: [
    'material/material.module.js',
    'material/material-colors.config.js'
  ], innerApps: ['esn']},
  {angular: 'esn.company', files: ['company.js'], innerApps: ['welcome']},
  {angular: 'esn.invitation', files: ['invitation.js'], innerApps: ['welcome']},
  {angular: 'esn.i18n', files: [
    'i18n/i18n.module.js',
    'i18n/i18n.run.js',
    'i18n/i18n.service.js',
    'i18n/i18n.constants.js',
    'i18n/i18n.config.js',
    'i18n/i18n-dateformat.service.js',
    'i18n/i18n-loader.service.js',
    'i18n/i18n-interpolator.service.js',
    'i18n/i18n-string.service.js',
    'i18n/i18n.filter.js',
    'i18n/language-selector/i18n-language-selector.component.js',
    'i18n/language-selector/i18n-language-selector.controller.js'
  ], innerApps: ['esn', 'welcome']},
  {angular: 'esn.datetime', files: [
    'datetime/datetime.module.js',
    'datetime/datetime.component.js',
    'datetime/datetime-date-formater.filter.js',
    'datetime/datetime.constants.js',
    'datetime/datetime.service.js',
    'datetime/datetime.run.js',
    'datetime/timeformat-selector/timeformat-selector.component.js',
    'datetime/timeformat-selector/timeformat-selector.controller.js',
    'datetime/time-zone-selector/time-zone-selector.component.js',
    'datetime/time-zone-selector/time-zone-selector.controller.js',
    'datetime/time-zone-selector/time-zone-selector.constants.js'
  ], innerApps: ['esn']},
  {angular: 'esn.business-hours', files: [
    'business-hours/business-hours.module.js',
    'business-hours/working-days/working-days.component.js',
    'business-hours/working-days/working-days.controller.js',
    'business-hours/working-hours/working-hours.component.js',
    'business-hours/working-hours/working-hours.controller.js',
    'business-hours/business-hours.component.js',
    'business-hours/business-hours.controller.js'
  ], innerApps: ['esn']},
  {angular: 'esn.home-page', files: [
    'home-page/home-page.module.js',
    'home-page/home-page.component.js',
    'home-page/home-page.service.js'
  ], innerApps: ['esn']},
  {angular: 'esn.feature-registry', files: [
    'feature-registry/feature-registry.module.js',
    'feature-registry/feature-registry.service.js'
  ], innerApps: ['esn', 'welcome']},
  {angular: 'esn.shortcuts', files: [
    'shortcuts/shortcuts.module.js',
    'shortcuts/shortcuts.config.js',
    'shortcuts/shortcuts.run.js',
    'shortcuts/shortcuts.constants.js',
    'shortcuts/shortcuts.service.js',
    'shortcuts/shortcuts-registry.service.js',
    'shortcuts/shortcuts-global.service.js',
    'shortcuts/shortcuts-action.service.js',
    'shortcuts/sheet/shortcuts-sheet.service.js',
    'shortcuts/sheet/shortcuts-sheet.controller.js'
  ], innerApps: ['esn']},
  {angular: 'esn.clipboard', files: [
    'clipboard/clipboard.module.js',
    'clipboard/url/clipboard-url.component.js',
    'clipboard/url/clipboard-url.controller.js'
  ], innerApps: ['esn']},
  {angular: 'esn.promise', files: [
    'promise/promise.module.js',
    'promise/promise.service.js',
    'promise/promise.constants.js'
  ], innerApps: ['esn']},
  {angular: 'esn.template', files: [
    'template/template.module.js',
    'template/template.provider.js'
  ], innerApps: ['esn', 'welcome']},
  {angular: 'esn.file-browser', files: [
    'file-browser/file-browser.module.js',
    'file-browser/file-browser.component.js',
    'file-browser/file-browser.controller.js'
  ], innerApps: ['esn']},
  {angular: 'esn.form.helper', files: [
    'form-helper/form-helper.module.js',
    'form-helper/form-helper.directives.js',
    'form-helper/email-input/email-input.controller.js',
    'form-helper/email-input/email-input.component.js',
    'form-helper/filter-input/filter-input.component.js',
    'form-helper/filter-input/filter-input.controller.js'
  ], innerApps: ['esn', 'welcome']},
  {angular: 'esn.attachments-selector', files: [
    'attachments-selector/attachments-selector.module.js',
      'attachments-selector/attachments-selector.component.js',
      'attachments-selector/attachments-selector.controller.js',
      'attachments-selector/attachments-selector.service.js'
  ], innerApps: ['esn']},
  {angular: 'esn.people', files: [
    'people/people.module.js',
    'people/people.constant.js',
    'people/people-api-client.service.js'
  ], innerApps: ['esn', 'welcome']},
  {angular: 'esn.app-state', files: [
    'app-state/app-state.module.js',
    'app-state/app-state.run.js',
    'app-state/app-state.constant.js',
    'app-state/services/app-state.service.js'
  ], innerApps: ['esn']},
  {angular: 'esn.themes', files: [
    'themes/themes.module.js',
    'themes/themes.service.js',
    'themes/color-contrast.service.js'
  ], innerApps: ['esn']},
  {angular: 'esn.technicaluser', files: [
    'technicaluser/technicaluser.module.js',
    'technicaluser/technicaluser-api.service.js'
  ], innerApps: ['esn']}
];

if (process.env.NODE_ENV === 'production') { // eslint-disable-line no-process-env
  injections.unshift({
    angular: 'esn.production',
    files: ['production.js'],
    innerApps: ['esn', 'welcome']
  });
}

function coreFrontendInjections(webserverWrapper, innerApps, angularModules) {
  injections.forEach(injection => {
    if (Array.isArray(angularModules) && angularModules.indexOf(injection.angular) === -1) {
      return;
    }

    const localJsFiles = injection.files.map(file => join(CORE_JS_BASEPATH, file));

    webserverWrapper.injectAngularModules('core', injection.files, injection.angular, innerApps || injection.innerApps, {
      localJsFiles
    });
  });
}

module.exports = coreFrontendInjections;
