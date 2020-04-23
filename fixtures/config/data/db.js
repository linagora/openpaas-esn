'use strict';

module.exports = function(dbHost = 'localhost', dbPort = 27017, dbName = 'esn', connectionString) {
  connectionString = connectionString || `mongodb://${dbHost}:${dbPort}/${dbName}`;

  return {
    connectionOptions: {
      w: 1,
      fsync: true,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
      keepAlive: 10000,
      connectTimeoutMS: 10000,
      auto_reconnect: true,
      poolSize: 10
    },
    connectionString
  };
};
