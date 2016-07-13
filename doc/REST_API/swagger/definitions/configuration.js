/**
  * @swagger
  * definition:
  *   cf_config_mail_local:
  *     type: object
  *     properties:
  *       "mail":
  *         type: object
  *         properties:
  *           "noreply":
  *             type: string
  *       "transport":
  *         type: object
  *         "module":
  *           type: string
  *         "config":
  *           type: object
  *           properties:
  *             "dir":
  *               type: string
  *             "browser":
  *               type: boolean
  *   cf_config_mail_smtp:
  *     type: object
  *     properties:
  *       "mail":
  *         type: object
  *         properties:
  *           "noreply":
  *             type: string
  *       "transport":
  *         type: object
  *         "config":
  *           type: object
  *           properties:
  *             "host":
  *               type: string
  *             "secure":
  *               type: boolean
  *             "tls":
  *               type: object
  *               properties:
  *                 "rejectUnauthorized":
  *                   type: boolean
  *             "port":
  *               type: integer
  *             "auth":
  *               type: object
  *               properties:
  *                 "user":
  *                   type: string
  *                 "pass":
  *                   type: string
  *   cf_config_mail_gmail:
  *     type: object
  *     properties:
  *       "mail":
  *         type: object
  *         properties:
  *           "noreply":
  *             type: string
  *       "transport":
  *         type: object
  *         "config":
  *           type: object
  *           properties:
  *             "service":
  *               type: string
  *             "auth":
  *               type: object
  *               properties:
  *                 "user":
  *                   type: string
  *                 "pass":
  *                   type: string
  *   cf_config_ldap:
  *     type: object
  *     properties:
  *       "domain_id":
  *         $ref: "#/definitions/cm_tuple_id"
  *       "timestamps":
  *         type: object
  *         properties:
  *           "creation":
  *             $ref: "#/definitions/cm_date"
  *       "autoProvisioning":
  *         type: boolean
  *       "configuration":
  *         type: object
  *         properties:
  *           "url":
  *             type: string
  *           "adminDn":
  *             type: string
  *           "adminPassword":
  *             type: string
  *           "searchBase":
  *             type: string
  *           "searchFilter":
  *             type: string
  *           "mapping":
  *             type: object
  *             properties:
  *               "firstname":
  *                 type: string
  *               "lastname":
  *                 type: string
  *   cf_config_dav:
  *     type: object
  *     properties:
  *       "backend":
  *         type: object
  *         properties:
  *           "url":
  *             type: string
  *       "frontend":
  *         type: object
  *         properties:
  *           "url":
  *             type: string
  *   cf_config:
  *     type: object
  *     properties:
  *       name:
  *         type: string
  *       config:
  *         allOf:
  *           - $ref: "#/definitions/cf_config_mail_local"
  *           - $ref: "#/definitions/cf_config_mail_smtp"
  *           - $ref: "#/definitions/cf_config_mail_gmail"
  *           - $ref: "#/definitions/cf_config_ldap"
  *           - $ref: "#/definitions/cf_config_dav"
  */