'use strict';

const esnConfig = require('../../core/esn-config');
const _ = require('lodash');
const path = require('path');
const url = require('url');
const urlJoin = require('url-join');
const Q = require('q');
const request = require('request');
const token = require('../../core/auth').token;

module.exports = {
  getServices
};

function getServices(req, res) {
  //jmap, imap, smtp, caldav (un endpoint par calendrier),
  const config = new esnConfig.EsnConfig();
  const userId = req.user._id;

  config.getMultiple(['mail', 'davserver', 'jmap', 'imap'])
    .then(domainConfs => Q.all([
      Q.when(domainConfs),
      getCaldavCalendars(domainConfs, userId)
    ]))
    .spread((domainConfs, calendars) => Q.all([
      Q.when(domainConfs),
      getCalendarLinks(domainConfs, calendars)
    ]))
    .spread((domainConfs, calendarLinks) => {
      const davconf = _.find(domainConfs, { name: 'davserver' });
      const davserver = davconf && davconf.value.frontend ? davconf.value.frontend.url : davconf.value.backend.url;
      const mail = _.find(domainConfs, { name: 'mail' }) && _.find(domainConfs, { name: 'mail' }).value;
      const jmap = _.find(domainConfs, { name: 'jmap' }) && _.find(domainConfs, { name: 'jmap' }).value;
      const imap = _.find(domainConfs, { name: 'imap' }) && _.find(domainConfs, { name: 'imap' }).value;

      return res.status(200).json({
        mail,
        jmap,
        imap,
        davserver,
        calendarLinks
      });
    })
    .catch(error => {
      res.status(400).json({
        error
      });
    });
}

function getCaldavCalendars(domainConf, userId) {
  const calConfig = _.find(domainConf, {name: 'davserver'});
  const homeCalUrl = urlJoin(calConfig.value.backend.url, 'calendars', String(userId));

  return Q.nfcall(token.getNewToken, {user: userId}).then(token =>
    Q.nfcall(request, {
      method: 'GET',
      url: homeCalUrl,
      headers: {
        ESNToken: token.token
      },
      json: true
    })
  );
}

function getCalendarLinks(domainConfs, calendars) {
  const davCalendars = _.find(calendars[0].body, 'dav:calendar')['dav:calendar'];
  const hrefs = davCalendars.map(davCalendar => _.find(davCalendar._links, 'href'));

  return hrefs.map(href => {
    const calConfig = _.find(domainConfs, {name: 'davserver'});
    const calUrl = url.parse(calConfig.value.backend.url);
    const newUrl = url.format({
      protocol: calUrl.protocol,
      slashes: true,
      host: calUrl.host,
      pathname: href.href
    });
    return newUrl.slice(0, -path.parse(newUrl).ext.length);
  });
}
