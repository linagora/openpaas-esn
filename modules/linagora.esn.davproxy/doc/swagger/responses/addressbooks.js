/**
  * @swagger
  * response:
  *   davproxy_addressbook_contact:
  *     description: OK. With detail of contact
  *     examples:
  *       application/json:
  *           {
  *             "_links": {
  *               "self": {
  *                 "href": "/addressbooks/5375de4bd684db7f6fbd4f97/contacts.json?search=bruce"
  *                }
  *             },
  *             "dav:syncToken": 6,
  *             "_embedded": {
  *               "dav:item": [
  *                 {
  *                   "_links": {
  *                   "self": "/addressbooks/5375de4bd684db7f6fbd4f97/contacts/myuid.vcf"
  *                   },
  *                   "etag": "6464fc058586fff85e3522de255c3e9f",
  *                   "data": [
  *                     "vcard",
  *                     [
  *                       ["version", {}, "text", "4.0"],
  *                       ["uid", {}, "text", "myuid"],
  *                       ["n", {}, "text", ["Bruce", "Willis", "", "", ""]]
  *                     ]
  *                   ]
  *                 }
  *               ]
  *             }
  *           }
  *   davproxy_addressbook_address_books:
  *     description: OK. With all address of books
  *     examples:
  *       application/json:
  *         {
  *           "_links": {
  *             "self": {
  *               "href": "/addressbooks/5948ef3081c09f0cdb02c4c2.json"
  *             }
  *           },
  *           "_embedded": {
  *             "dav:addressbook": [
  *               {
  *                 "_links": {
  *                   "self": {
  *                     "href": "/addressbooks/5948ef3081c09f0cdb02c4c2/contacts.json"
  *                   }
  *                 },
  *                 "dav:name": "",
  *                 "carddav:description": "",
  *                 "dav:acl": [
  *                   "dav:read",
  *                   "dav:write"
  *                 ],
  *                 "type": ""
  *               }
  *             ]
  *           }
  *         }
  *   davproxy_addressbook_update:
  *     description: OK. with content of vcard
  *     examples:
  *       application/json:
  *         ["vcard",
  *           [
  *             ["version", {}, "text", "4.0"],
  *             ["n", {}, "text", ["Gump", "Forrest", "", "Mr.", ""]],
  *             ["fn", {}, "text", "Forrest Gump"],
  *             ["org", {}, "text", "Bubba Gump Shrimp Co."],
  *             ["title", {} ,"text", "Shrimp Man"],
  *             ["email", {}, "text", "forrestgump@example.com"],
  *             ["rev", {}, "timestamp", "2008-04-24T19:52:43Z"]
  *           ]
  *         ]
  *   davproxy_addressbook_create:
  *     description: OK. with content of addressbook
  *     examples:
  *       application/json:
  *         {
  *           "id": "addressbook name",
  *           "dav:name": "addressbook name",
  *           "carddav:description": "addressbook description",
  *           "dav:acl": ["dav:read", "dav:write"],
  *           "type": "user"
  *         }
  */
