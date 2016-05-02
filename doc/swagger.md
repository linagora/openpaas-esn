# Swagger documentation

## swagger-generate grunt task
swagger-generate is a grunt task to generate an OpenAPI specification file for the OpenPaaS API.
(see https://openapis.org/ for more details)

Based on jsdoc, it allows developpers to describe their RESTFUL API.
(see https://github.com/Surnet/swagger-jsdoc/blob/master/example/routes.js for an example)
(see http://swagger.io/specification/ for complete documentation on how to do so)

Both JSON and YAML formats are possible.
For now, the file is generated as « doc/REST_API/swagger.json »

Once generated, the file can be exposed through dedicated server and a clean documentation can be viewed through dedicated client.
http://editor.swagger.io/#/ provides a way to test it.
The File menu allows to import the specification file. Several methods are possible (copy/paste, file import from disk or url import if exposed)
Then it's possible to have a preview, to create the backend side (via the menu Generate Server), and the frontend side (via the menu Generate Client).
You can it locally with swagger-editor : http://swagger.io/swagger-editor/
It's also possible to run it with docker:
docker pull swaggerapi/swagger-editor
Then to map the port 8080 with the port 4000:
docker run -p 4000:8080 swaggerapi/swagger-editor

The main files to be aware of are :
 
- tasks/swagger.js:
    - defines the swagger-generate grunt task
    - defines general informations for the OpenPaaS API
     
- doc/REST_API/swagger:
    - the swagger-generate grunt task generates a swagger.json file in this folder
    - definitions files: common.js, communities.js, users.js, according to the resources
        definitions are the way to factorize schemas, not to describe multiple times for each endpoint
         
- In backend/webserver/route.js
    - routes are defined with eventually a jsdoc-based swagger specification for each path
