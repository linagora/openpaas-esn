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
  *   davproxy_addressbook_contacts:
  *     description: Ok. With an array of contacts
  *     examples:
  *       application/json:
  *           {
                "_links": {
                  "self": {
                    "href": "/dav/api/addressbooks/5ec7428da3456852827d1ab2.json/contacts?search=%27james%27"
                  }
                },
                "_total_hits": 1,
                "_current_page": "1",
                "_embedded": {
                  "dav:item": [
                    {
                      "_links": {
                        "self": {
                          "href": "http://localhost:8001/addressbooks/5ec7428da3456852827d1ab2/85347de1-006f-44f6-bfc4-b59ad45741b4/74a97209-dac2-4d41-ba43-9d09287d3e84.vcf"
                        }
                      },
                      "data": [
                        "vcard",
                        [
                          ["version", {}, "text", "3.0"],
                          ["prodid", {}, "text", "-//Sabre//Sabre VObject 4.1.3//EN"],
                          ["uid", {}, "text", "74a97209-dac2-4d41-ba43-9d09287d3e84"],
                          ["fn", {}, "text", "james"],
                          ["n", {}, "text", ["", "james", "", "", ""]],
                          ["photo", {}, "uri", "http://localhost:8080/contact/api/contacts/5ec7428da3456852827d1ab2/85347de1-006f-44f6-bfc4-b59ad45741b4/74a97209-dac2-4d41-ba43-9d09287d3e84/avatar"]
                        ],
                        []
                      ]
                    }
                  ]
                }
              }
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
  *     description: Created. With content of addressbook
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
