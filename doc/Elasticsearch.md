ElasticSearch is an end-to-end search and analytics platform.

Prerequisites
=============

First you must [download ElasticSearch](http://www.elasticsearch.org/download).

To communicate with datasource, ElasticSearch need plugins named *river*. You can [download](https://github.com/richardwilly98/elasticsearch-river-mongodb) source code of the river plugin for MongoDB or use the ElasticSearch `plugin` command. This plugin uses MongoDB as datasource to store data in ElasticSearch.

Launch single server instance
=============================

You can start elasticsearch in the foreground with: ([link](http://www.elasticsearch.org/guide/en/elasticsearch/guide/current/_running_elasticsearch.html#_running_elasticsearch))

      ./bin/elasticsearch

Test it out by opening another terminal window and running:

      curl 'http://localhost:9200/?pretty'

Elasticsearch provide a restful api with json over http over port 9200. [link](http://www.elasticsearch.org/guide/en/elasticsearch/guide/current/_talking_to_elasticsearch.html#_restful_api_with_json_over_http)

Plug it to a MongoDB instance
=============================

[Install Guide](https://github.com/richardwilly98/elasticsearch-river-mongodb/wiki#install-guide)

Install the plugin `elasticsearch-mapper-attachment`:

      ./bin/plugin -install elasticsearch/elasticsearch-mapper-attachments/2.0.0

Install the river plugin:

      ./bin/plugin --install com.github.richardwilly98.elasticsearch/elasticsearch-river-mongodb/2.0.0

You must configure the river plugin by using `PUT` request.

Syntax:

      curl -XPUT "localhost:9200/_river/${es.river.name}/_meta" -d '
      {
        "type": "mongodb",
        "mongodb": { 
          "servers":
          [
            { "host": ${mongo.instance1.host}, "port": ${mongo.instance1.port} },
            { "host": ${mongo.instance2.host}, "port": ${mongo.instance2.port} }
          ],
          "options": { 
            "secondary_read_preference" : true, 
            "drop_collection": ${mongo.drop.collection}, 
            "exclude_fields": ${mongo.exclude.fields},
            "include_fields": ${mongo.include.fields},
            "include_collection": ${mongo.include.collection},
            "import_all_collections": ${mongo.import.all.collections},
            "initial_timestamp": {
              "script_type": ${mongo.initial.timestamp.script.type},
              "script": ${mongo.initial.timestamp.script}
            },
            "skip_initial_import" : ${mongo.skip.initial.import},
            "store_statistics" : ${mongo.store.statistics},
          },
          "credentials":
          [
            { "db": "local", "user": ${mongo.local.user}, "password": ${mongo.local.password} },
            { "db": "admin", "user": ${mongo.db.user}, "password": ${mongo.db.password} }
          ],
          "db": ${mongo.db.name}, 
          "collection": ${mongo.collection.name}, 
          "gridfs": ${mongo.is.gridfs.collection},
          "filter": ${mongo.filter}
        }, 
        "index": { 
          "name": ${es.index.name}, 
          "throttle_size": ${es.throttle.size},
          "bulk_size": ${es.bulk.size},
          "type": ${es.type.name}
          "bulk": {
            "actions": ${es.bulk.actions},
            "size": ${es.bulk.size},
            "concurrent_requests": ${es.bulk.concurrent.requests},
            "flush_interval": ${es.bulk.flush.interval}
          }
        }

      }'

Example:

      curl -XPUT "localhost:9200/_river/test/_meta" -d '
      {
        "type": "mongodb",
        "mongodb": {
          "servers": [
            { "host": "10.75.9.225", "port": 27017 },
            { "host": "10.75.9.225", "port": 27018 }
          ],
          "options": { "secondary_read_preference": true },
          "db": "test",
          "collection": "users"
        },
        "index": {
          "name": "usersidx",
          "type": "users"
        }
      }'

Limitations
===========

The river plugin for MongoDB need specific version of ElasticSearch and MongoDB. For detail, please read the river plugin readme. [link](https://github.com/richardwilly98/elasticsearch-river-mongodb)

For each collections in MongoDB which needed to be indexed, you must create a `river`. A `river` is created with `PUT` request. So if you change the topology, you must send back `PUT` request for each collections you change.

Configure indexed data
======================

In Elasticsearch, **all data in every field is indexed by default**. That is, every field has a dedicated inverted index for fast retrieval. And, unlike most other databases, it can use all of those inverted indices in the same query, to return results at breathtaking speed. [source](http://www.elasticsearch.org/guide/en/elasticsearch/guide/current/data-in-data-out.html)


Other Features
==============

* [Multi-get](http://www.elasticsearch.org/guide/en/elasticsearch/guide/current/_retrieving_multiple_documents.html) : retrieving multiple documents with one request.
* [Bulk request](http://www.elasticsearch.org/guide/en/elasticsearch/guide/current/bulk.html) : the bulk API allows us to make multiple `create`, `index`, `update` or `delete` requests in a single step.