# ElasticSearch

ElasticSearch is an end-to-end search and analytics platform. 

## Prerequisites

First you must [download ElasticSearch](http://www.elasticsearch.org/download).

To communicate with datasource, ElasticSearch need plugins named *river*. You can [download](https://github.com/richardwilly98/elasticsearch-river-mongodb) source code of the river plugin for MongoDB or use the ElasticSearch `plugin` command. This plugin uses MongoDB as datasource to store data in ElasticSearch.

## Launch single server instance

You can start elasticsearch in the foreground with: ([link](http://www.elasticsearch.org/guide/en/elasticsearch/guide/current/_running_elasticsearch.html#_running_elasticsearch))

      ./bin/elasticsearch

Test it out by opening another terminal window and running:

      curl 'http://localhost:9200/?pretty'

Elasticsearch provide a restful api with json over http over port 9200. [link](http://www.elasticsearch.org/guide/en/elasticsearch/guide/current/_talking_to_elasticsearch.html#_restful_api_with_json_over_http)

## Configure indexed data

In Elasticsearch, **all data in every field is indexed by default**. That is, every field has a dedicated inverted index for fast retrieval. And, unlike most other databases, it can use all of those inverted indices in the same query, to return results at breathtaking speed. [source](http://www.elasticsearch.org/guide/en/elasticsearch/guide/current/data-in-data-out.html)

## Other Features

* [Multi-get](http://www.elasticsearch.org/guide/en/elasticsearch/guide/current/_retrieving_multiple_documents.html) : retrieving multiple documents with one request.
* [Bulk request](http://www.elasticsearch.org/guide/en/elasticsearch/guide/current/bulk.html) : the bulk API allows us to make multiple `create`, `index`, `update` or `delete` requests in a single step.