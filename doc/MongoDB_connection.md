This file describe the content of `config/db.json`.

* The key `connectionOptions` is used to give the `option` parameter of `mongoose.connect`.
* The key `connectionString` is the first parameter of `mongoose.connect`.

Single instance setup
=====================

ConnexionString syntax :

       mongodb://[username:password@]host[:port][/database]

ConnexionString example :

       mongodb://myVM1/test

Replica set setup
==================

ConnexionString syntax :

       mongodb://[username:password@]host1[:port1][/database],[,host2[:port2][/database],...[,hostN[:portN][/database]]][?replicaSet=replicaName]

ConnexionString example :

       mongodb://myVM1/test,myVM2:27018/test,myVM3:27019/test?replicaSet=rs0

Sharding setup (single mongos)
==============================

ConnexionString syntax :

       mongodb://[username:password@]host[:port][/database]

ConnexionString example :

       mongodb://myVM1/test


Sharding setup (multiple mongos)
================================

ConnexionString syntax :

       mongodb://[username:password@]host1[:port1][/database],[,host2[:port2][/database],...[,hostN[:portN][/database]]]

ConnexionString example :

       mongodb://myVM1/test,myVM2:27018/test

With option `mongos` to `true`. (You must add `"mongos":true` as a parameter of `connectionOptions`)