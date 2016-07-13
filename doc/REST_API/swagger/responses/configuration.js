/**
  * @swagger
  * response:
  *   cf_config:
  *     description: a domain configuration
  *     schema:
  *       $ref: "#/definitions/cf_config"
  *     examples:
  *       application/json:
  *         {
  *           name: "mail",
  *           config: {
  *             mail : {
  *               noreply: "noreply@open-paas.org"
  *             },
  *             transport: {
  *               module: "nodemailer-browser",
  *               config: {
  *                   dir: "/tmp",
  *                   browser: true
  *               }
  *             }
  *           }
  *         }
  *   cf_configs:
  *     description: an array of domain configuration
  *     schema:
  *       type: array
  *       items:
  *         $ref: "#/definitions/cf_config"
  *     examples:
  *       application/json:
  *         [
  *           {
  *             name: "mail",
  *             config: {
  *               mail: {
  *                 noreply: "noreply@open-paas.org"
  *               },
  *               transport: {
  *                 module: "nodemailer-browser",
  *                 config: {
  *                   dir: "/tmp",
  *                     browser: true
  *                 }
  *               }
  *             }
  *           },
  *           {
  *             name: "davserver",
  *             config: {
  *               backend: {
  *                 url: "http://localhost/esn-sabre/esn.php/"
  *               },
  *               frontend: {
  *                 url: "http://localhost/esn-sabre/esn.php/"
  *               }
  *             }
  *           }
  *         ]
  */