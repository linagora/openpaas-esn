pref('extensions.op.autoconf.rootUrl', '<%= web.base_url %>');
pref('extensions.op.autoconf.username', '<%= user.preferredEmail %>');

pref('extensions.op.autoconf.interval', 3600000); // 1h
pref('extensions.op.autoconf.log.level', 'DEBUG');
pref('extensions.op.autoconf.log.file', 'op-tb-autoconf.log');
