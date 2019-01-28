(function() {
  'use strict';

  angular.module('esn.datetime')
    .constant('ESN_DATETIME_TIMEZONE', [
      {
        name: '(GMT-11:00) Niue Time',
        value: 'Pacific/Niue'
      }, {
        name: '(GMT-11:00) Samoa Standard Time',
        value: 'Pacific/Pago_Pago'
      }, {
        name: '(GMT-10:00) Hawaii-Aleutian Time',
        value: 'America/Adak'
      }, {
          name: '(GMT-10:00) Hawaii-Aleutian Standard Time',
          value: 'Pacific/Honolulu'
      }, {
          name: '(GMT-10:00) Cook Islands Standard Time',
          value: 'Pacific/Rarotonga'
      }, {
          name: '(GMT-10:00) Tahiti Time',
          value: 'Pacific/Tahiti'
      }, {
          name: '(GMT-09:30) Marquesas Time',
          value: 'Pacific/Marquesas'
      }, {
          name: '(GMT-09:00) Alaska Time - Anchorage',
          value: 'America/Anchorage'
      }, {
          name: '(GMT-09:00) Alaska Time - Juneau',
          value: 'America/Juneau'
      }, {
          name: '(GMT-09:00) Alaska Time - Nome',
          value: 'America/Nome'
      }, {
          name: '(GMT-09:00) Alaska Time - Sitka',
          value: 'America/Sitka'
      }, {
          name: '(GMT-09:00) Alaska Time - Yakutat',
          value: 'America/Yakutat'
      }, {
          name: '(GMT-09:00) Gambier Time',
          value: 'Pacific/Gambier'
      }, {
          name: '(GMT-08:00) Pacific Time - Dawson',
          value: 'America/Dawson'
      }, {
          name: '(GMT-08:00) Pacific Time - Los Angeles',
          value: 'America/Los_Angeles'
      }, {
          name: '(GMT-08:00) Pacific Time - Metlakatla',
          value: 'America/Metlakatla'
      }, {
          name: '(GMT-08:00) Pacific Time - Tijuana',
          value: 'America/Tijuana'
      }, {
          name: '(GMT-08:00) Pacific Time - Vancouver',
          value: 'America/Vancouver'
      }, {
          name: '(GMT-08:00) Pacific Time - Whitehorse',
          value: 'America/Whitehorse'
      }, {
          name: '(GMT-08:00) Pitcairn Time',
          value: 'Pacific/Pitcairn'
      }, {
          name: '(GMT-07:00) Mountain Time - Boise',
          value: 'America/Boise'
      }, {
          name: '(GMT-07:00) Mountain Time - Cambridge Bay',
          value: 'America/Cambridge_Bay'
      }, {
          name: '(GMT-07:00) Mexican Pacific Time - Chihuahua',
          value: 'America/Chihuahua'
      }, {
          name: '(GMT-07:00) Mountain Standard Time - Creston',
          value: 'America/Creston'
      }, {
          name: '(GMT-07:00) Mountain Standard Time - Dawson Creek',
          value: 'America/Dawson_Creek'
      }, {
          name: '(GMT-07:00) Mountain Time - Denver',
          value: 'America/Denver'
      }, {
          name: '(GMT-07:00) Mountain Time - Edmonton',
          value: 'America/Edmonton'
      }, {
          name: '(GMT-07:00) Mountain Standard Time - Fort Nelson',
          value: 'America/Fort_Nelson'
      }, {
          name: '(GMT-07:00) Mexican Pacific Standard Time',
          value: 'America/Hermosillo'
      }, {
          name: '(GMT-07:00) Mountain Time - Inuvik',
          value: 'America/Inuvik'
      }, {
          name: '(GMT-07:00) Mexican Pacific Time - Mazatlan',
          value: 'America/Mazatlan'
      }, {
          name: '(GMT-07:00) Mountain Time - Ojinaga',
          value: 'America/Ojinaga'
      }, {
          name: '(GMT-07:00) Mountain Standard Time - Phoenix',
          value: 'America/Phoenix'
      }, {
          name: '(GMT-07:00) Mountain Time - Yellowknife',
          value: 'America/Yellowknife'
      }, {
          name: '(GMT-06:00) Central Time - Bahia Banderas',
          value: 'America/Bahia_Banderas'
      }, {
          name: '(GMT-06:00) Central Standard Time - Belize',
          value: 'America/Belize'
      }, {
          name: '(GMT-06:00) Central Time - Chicago',
          value: 'America/Chicago'
      }, {
          name: '(GMT-06:00) Central Standard Time - Costa Rica',
          value: 'America/Costa_Rica'
      }, {
          name: '(GMT-06:00) Central Standard Time - El Salvador',
          value: 'America/El_Salvador'
      }, {
          name: '(GMT-06:00) Central Standard Time - Guatemala',
          value: 'America/Guatemala'
      }, {
          name: '(GMT-06:00) Central Time - Knox, Indiana',
          value: 'America/Indiana/Knox'
      }, {
          name: '(GMT-06:00) Central Time - Tell City, Indiana',
          value: 'America/Indiana/Tell_City'
      }, {
          name: '(GMT-06:00) Central Standard Time - Managua',
          value: 'America/Managua'
      }, {
          name: '(GMT-06:00) Central Time - Matamoros',
          value: 'America/Matamoros'
      }, {
          name: '(GMT-06:00) Central Time - Menominee',
          value: 'America/Menominee'
      }, {
          name: '(GMT-06:00) Central Time - Merida',
          value: 'America/Merida'
      }, {
          name: '(GMT-06:00) Central Time - Mexico City',
          value: 'America/Mexico_City'
      }, {
          name: '(GMT-06:00) Central Time - Monterrey',
          value: 'America/Monterrey'
      }, {
          name: '(GMT-06:00) Central Time - Beulah, North Dakota',
          value: 'America/North_Dakota/Beulah'
      }, {
          name: '(GMT-06:00) Central Time - Center, North Dakota',
          value: 'America/North_Dakota/Center'
      }, {
          name: '(GMT-06:00) Central Time - New Salem, North Dakota',
          value: 'America/North_Dakota/New_Salem'
      }, {
          name: '(GMT-06:00) Central Time - Rainy River',
          value: 'America/Rainy_River'
      }, {
          name: '(GMT-06:00) Central Time - Rankin Inlet',
          value: 'America/Rankin_Inlet'
      }, {
          name: '(GMT-06:00) Central Standard Time - Regina',
          value: 'America/Regina'
      }, {
          name: '(GMT-06:00) Central Time - Resolute',
          value: 'America/Resolute'
      }, {
          name: '(GMT-06:00) Central Standard Time - Swift Current',
          value: 'America/Swift_Current'
      }, {
          name: '(GMT-06:00) Central Standard Time - Tegucigalpa',
          value: 'America/Tegucigalpa'
      }, {
          name: '(GMT-06:00) Central Time - Winnipeg',
          value: 'America/Winnipeg'
      }, {
          name: '(GMT-06:00) Galapagos Time',
          value: 'Pacific/Galapagos'
      }, {
          name: '(GMT-05:00) Eastern Standard Time - Atikokan',
          value: 'America/Atikokan'
      }, {
          name: '(GMT-05:00) Colombia Standard Time',
          value: 'America/Bogota'
      }, {
          name: '(GMT-05:00) Eastern Standard Time - Cancun',
          value: 'America/Cancun'
      }, {
          name: '(GMT-05:00) Eastern Time - Detroit',
          value: 'America/Detroit'
      }, {
          name: '(GMT-05:00) Acre Standard Time - Eirunepe',
          value: 'America/Eirunepe'
      }, {
          name: '(GMT-05:00) Eastern Time - Grand Turk',
          value: 'America/Grand_Turk'
      }, {
          name: '(GMT-05:00) Ecuador Time',
          value: 'America/Guayaquil'
      }, {
          name: '(GMT-05:00) Cuba Time',
          value: 'America/Havana'
      }, {
          name: '(GMT-05:00) Eastern Time - Indianapolis',
          value: 'America/Indiana/Indianapolis'
      }, {
          name: '(GMT-05:00) Eastern Time - Marengo, Indiana',
          value: 'America/Indiana/Marengo'
      }, {
          name: '(GMT-05:00) Eastern Time - Petersburg, Indiana',
          value: 'America/Indiana/Petersburg'
      }, {
          name: '(GMT-05:00) Eastern Time - Vevay, Indiana',
          value: 'America/Indiana/Vevay'
      }, {
          name: '(GMT-05:00) Eastern Time - Vincennes, Indiana',
          value: 'America/Indiana/Vincennes'
      }, {
          name: '(GMT-05:00) Eastern Time - Winamac, Indiana',
          value: 'America/Indiana/Winamac'
      }, {
          name: '(GMT-05:00) Eastern Time - Iqaluit',
          value: 'America/Iqaluit'
      }, {
          name: '(GMT-05:00) Eastern Standard Time - Jamaica',
          value: 'America/Jamaica'
      }, {
          name: '(GMT-05:00) Eastern Time - Louisville',
          value: 'America/Kentucky/Louisville'
      }, {
          name: '(GMT-05:00) Eastern Time - Monticello, Kentucky',
          value: 'America/Kentucky/Monticello'
      }, {
          name: '(GMT-05:00) Peru Standard Time',
          value: 'America/Lima'
      }, {
          name: '(GMT-05:00) Eastern Time - Nassau',
          value: 'America/Nassau'
      }, {
          name: '(GMT-05:00) Eastern Time - New York',
          value: 'America/New_York'
      }, {
          name: '(GMT-05:00) Eastern Time - Nipigon',
          value: 'America/Nipigon'
      }, {
          name: '(GMT-05:00) Eastern Standard Time - Panama',
          value: 'America/Panama'
      }, {
          name: '(GMT-05:00) Eastern Time - Pangnirtung',
          value: 'America/Pangnirtung'
      }, {
          name: '(GMT-05:00) Eastern Time - Port-au-Prince',
          value: 'America/Port-au-Prince'
      }, {
          name: '(GMT-05:00) Acre Standard Time - Rio Branco',
          value: 'America/Rio_Branco'
      }, {
          name: '(GMT-05:00) Eastern Time - Thunder Bay',
          value: 'America/Thunder_Bay'
      }, {
          name: '(GMT-05:00) Eastern Time - Toronto',
          value: 'America/Toronto'
      }, {
          name: '(GMT-05:00) Easter Island Time',
          value: 'Pacific/Easter'
      }, {
          name: '(GMT-04:00) Atlantic Standard Time - Barbados',
          value: 'America/Barbados'
      }, {
          name: '(GMT-04:00) Atlantic Standard Time - Blanc-Sablon',
          value: 'America/Blanc-Sablon'
      }, {
          name: '(GMT-04:00) Amazon Standard Time - Boa Vista',
          value: 'America/Boa_Vista'
      }, {
          name: '(GMT-04:00) Venezuela Time',
          value: 'America/Caracas'
      }, {
          name: '(GMT-04:00) Atlantic Standard Time - Curaçao',
          value: 'America/Curacao'
      }, {
          name: '(GMT-04:00) Atlantic Time - Glace Bay',
          value: 'America/Glace_Bay'
      }, {
          name: '(GMT-04:00) Atlantic Time - Goose Bay',
          value: 'America/Goose_Bay'
      }, {
          name: '(GMT-04:00) Guyana Time',
          value: 'America/Guyana'
      }, {
          name: '(GMT-04:00) Atlantic Time - Halifax',
          value: 'America/Halifax'
      }, {
          name: '(GMT-04:00) Bolivia Time',
          value: 'America/La_Paz'
      }, {
          name: '(GMT-04:00) Amazon Standard Time - Manaus',
          value: 'America/Manaus'
      }, {
          name: '(GMT-04:00) Atlantic Standard Time - Martinique',
          value: 'America/Martinique'
      }, {
          name: '(GMT-04:00) Atlantic Time - Moncton',
          value: 'America/Moncton'
      }, {
          name: '(GMT-04:00) Atlantic Standard Time - Port of Spain',
          value: 'America/Port_of_Spain'
      }, {
          name: '(GMT-04:00) Amazon Standard Time - Porto Velho',
          value: 'America/Porto_Velho'
      }, {
          name: '(GMT-04:00) Atlantic Standard Time - Puerto Rico',
          value: 'America/Puerto_Rico'
      }, {
          name: '(GMT-04:00) Atlantic Standard Time - Santo Domingo',
          value: 'America/Santo_Domingo'
      }, {
          name: '(GMT-04:00) Atlantic Time - Thule',
          value: 'America/Thule'
      }, {
          name: '(GMT-04:00) Atlantic Time - Bermuda',
          value: 'Atlantic/Bermuda'
      }, {
          name: '(GMT-03:30) Newfoundland Time',
          value: 'America/St_Johns'
      }, {
          name: '(GMT-03:00) Brasilia Standard Time - Araguaina',
          value: 'America/Araguaina'
      }, {
          name: '(GMT-03:00) Argentina Standard Time - Buenos Aires',
          value: 'America/Argentina/Buenos_Aires'
      }, {
          name: '(GMT-03:00) Argentina Standard Time - Catamarca',
          value: 'America/Argentina/Catamarca'
      }, {
          name: '(GMT-03:00) Argentina Standard Time - Cordoba',
          value: 'America/Argentina/Cordoba'
      }, {
          name: '(GMT-03:00) Argentina Standard Time - Jujuy',
          value: 'America/Argentina/Jujuy'
      }, {
          name: '(GMT-03:00) Argentina Standard Time - La Rioja',
          value: 'America/Argentina/La_Rioja'
      }, {
          name: '(GMT-03:00) Argentina Standard Time - Mendoza',
          value: 'America/Argentina/Mendoza'
      }, {
          name: '(GMT-03:00) Argentina Standard Time - Rio Gallegos',
          value: 'America/Argentina/Rio_Gallegos'
      }, {
          name: '(GMT-03:00) Argentina Standard Time - Salta',
          value: 'America/Argentina/Salta'
      }, {
          name: '(GMT-03:00) Argentina Standard Time - San Juan',
          value: 'America/Argentina/San_Juan'
      }, {
          name: '(GMT-03:00) Western Argentina Standard Time',
          value: 'America/Argentina/San_Luis'
      }, {
          name: '(GMT-03:00) Argentina Standard Time - Tucuman',
          value: 'America/Argentina/Tucuman'
      }, {
          name: '(GMT-03:00) Argentina Standard Time - Ushuaia',
          value: 'America/Argentina/Ushuaia'
      }, {
          name: '(GMT-03:00) Paraguay Time',
          value: 'America/Asuncion'
      }, {
          name: '(GMT-03:00) Brasilia Standard Time - Bahia',
          value: 'America/Bahia'
      }, {
          name: '(GMT-03:00) Brasilia Standard Time - Belem',
          value: 'America/Belem'
      }, {
          name: '(GMT-03:00) Amazon Time (Campo Grande)',
          value: 'America/Campo_Grande'
      }, {
          name: '(GMT-03:00) French Guiana Time',
          value: 'America/Cayenne'
      }, {
          name: '(GMT-03:00) Amazon Time (Cuiaba)',
          value: 'America/Cuiaba'
      }, {
          name: '(GMT-03:00) Brasilia Standard Time - Fortaleza',
          value: 'America/Fortaleza'
      }, {
          name: '(GMT-03:00) West Greenland Time',
          value: 'America/Godthab'
      }, {
          name: '(GMT-03:00) Brasilia Standard Time - Maceio',
          value: 'America/Maceio'
      }, {
          name: '(GMT-03:00) St. Pierre & Miquelon Time',
          value: 'America/Miquelon'
      }, {
          name: '(GMT-03:00) Uruguay Standard Time',
          value: 'America/Montevideo'
      }, {
          name: '(GMT-03:00) Suriname Time',
          value: 'America/Paramaribo'
      }, {
          name: '(GMT-03:00) Punta Arenas Time',
          value: 'America/Punta_Arenas'
      }, {
          name: '(GMT-03:00) Brasilia Standard Time - Recife',
          value: 'America/Recife'
      }, {
          name: '(GMT-03:00) Brasilia Standard Time - Santarem',
          value: 'America/Santarem'
      }, {
          name: '(GMT-03:00) Chile Time',
          value: 'America/Santiago'
      }, {
          name: '(GMT-03:00) Palmer Time',
          value: 'Antarctica/Palmer'
      }, {
          name: '(GMT-03:00) Rothera Time',
          value: 'Antarctica/Rothera'
      }, {
          name: '(GMT-03:00) Falkland Islands Standard Time',
          value: 'Atlantic/Stanley'
      }, {
          name: '(GMT-02:00) Fernando de Noronha Standard Time',
          value: 'America/Noronha'
      }, {
          name: '(GMT-02:00) Brasilia Time',
          value: 'America/Sao_Paulo'
      }, {
          name: '(GMT-02:00) South Georgia Time',
          value: 'Atlantic/South_Georgia'
      }, {
          name: '(GMT-01:00) East Greenland Time',
          value: 'America/Scoresbysund'
      }, {
          name: '(GMT-01:00) Azores Time',
          value: 'Atlantic/Azores'
      }, {
          name: '(GMT-01:00) Cape Verde Standard Time',
          value: 'Atlantic/Cape_Verde'
      }, {
          name: '(GMT+00:00) Greenwich Mean Time - Abidjan',
          value: 'Africa/Abidjan'
      }, {
          name: '(GMT+00:00) Greenwich Mean Time - Accra',
          value: 'Africa/Accra'
      }, {
          name: '(GMT+00:00) Greenwich Mean Time - Bissau',
          value: 'Africa/Bissau'
      }, {
          name: '(GMT+00:00) Greenwich Mean Time - Monrovia',
          value: 'Africa/Monrovia'
      }, {
          name: '(GMT+00:00) Greenwich Mean Time - São Tomé',
          value: 'Africa/Sao_Tome'
      }, {
          name: '(GMT+00:00) Greenwich Mean Time - Danmarkshavn',
          value: 'America/Danmarkshavn'
      }, {
          name: '(GMT+00:00) Troll Time',
          value: 'Antarctica/Troll'
      }, {
          name: '(GMT+00:00) Western European Time - Canary',
          value: 'Atlantic/Canary'
      }, {
          name: '(GMT+00:00) Western European Time - Faroe',
          value: 'Atlantic/Faroe'
      }, {
          name: '(GMT+00:00) Western European Time - Madeira',
          value: 'Atlantic/Madeira'
      }, {
          name: '(GMT+00:00) Greenwich Mean Time - Reykjavik',
          value: 'Atlantic/Reykjavik'
      }, {
          name: '(GMT+00:00) Greenwich Mean Time',
          value: 'Etc/GMT'
      }, {
          name: '(GMT+00:00) Ireland Time',
          value: 'Europe/Dublin'
      }, {
          name: '(GMT+00:00) Western European Time - Lisbon',
          value: 'Europe/Lisbon'
      }, {
          name: '(GMT+00:00) United Kingdom Time',
          value: 'Europe/London'
      }, {
          name: '(GMT+00:00) Coordinated Universal Time',
          value: 'UTC'
      }, {
          name: '(GMT+01:00) Central European Standard Time - Algiers',
          value: 'Africa/Algiers'
      }, {
          name: '(GMT+01:00) Morocco Time',
          value: 'Africa/Casablanca'
      }, {
          name: '(GMT+01:00) Central European Time - Ceuta',
          value: 'Africa/Ceuta'
      }, {
          name: '(GMT+01:00) Western Sahara Time',
          value: 'Africa/El_Aaiun'
      }, {
          name: '(GMT+01:00) West Africa Standard Time - Lagos',
          value: 'Africa/Lagos'
      }, {
          name: '(GMT+01:00) West Africa Standard Time - Ndjamena',
          value: 'Africa/Ndjamena'
      }, {
          name: '(GMT+01:00) Central European Standard Time - Tunis',
          value: 'Africa/Tunis'
      }, {
          name: '(GMT+01:00) Central European Time - Amsterdam',
          value: 'Europe/Amsterdam'
      }, {
          name: '(GMT+01:00) Central European Time - Andorra',
          value: 'Europe/Andorra'
      }, {
          name: '(GMT+01:00) Central European Time - Belgrade',
          value: 'Europe/Belgrade'
      }, {
          name: '(GMT+01:00) Central European Time - Berlin',
          value: 'Europe/Berlin'
      }, {
          name: '(GMT+01:00) Central European Time - Brussels',
          value: 'Europe/Brussels'
      }, {
          name: '(GMT+01:00) Central European Time - Budapest',
          value: 'Europe/Budapest'
      }, {
          name: '(GMT+01:00) Central European Time - Copenhagen',
          value: 'Europe/Copenhagen'
      }, {
          name: '(GMT+01:00) Central European Time - Gibraltar',
          value: 'Europe/Gibraltar'
      }, {
          name: '(GMT+01:00) Central European Time - Luxembourg',
          value: 'Europe/Luxembourg'
      }, {
          name: '(GMT+01:00) Central European Time - Madrid',
          value: 'Europe/Madrid'
      }, {
          name: '(GMT+01:00) Central European Time - Malta',
          value: 'Europe/Malta'
      }, {
          name: '(GMT+01:00) Central European Time - Monaco',
          value: 'Europe/Monaco'
      }, {
          name: '(GMT+01:00) Central European Time - Oslo',
          value: 'Europe/Oslo'
      }, {
          name: '(GMT+01:00) Central European Time - Paris',
          value: 'Europe/Paris'
      }, {
          name: '(GMT+01:00) Central European Time - Prague',
          value: 'Europe/Prague'
      }, {
          name: '(GMT+01:00) Central European Time - Rome',
          value: 'Europe/Rome'
      }, {
          name: '(GMT+01:00) Central European Time - Stockholm',
          value: 'Europe/Stockholm'
      }, {
          name: '(GMT+01:00) Central European Time - Tirane',
          value: 'Europe/Tirane'
      }, {
          name: '(GMT+01:00) Central European Time - Vienna',
          value: 'Europe/Vienna'
      }, {
          name: '(GMT+01:00) Central European Time - Warsaw',
          value: 'Europe/Warsaw'
      }, {
          name: '(GMT+01:00) Central European Time - Zurich',
          value: 'Europe/Zurich'
      }, {
          name: '(GMT+02:00) Eastern European Standard Time - Cairo',
          value: 'Africa/Cairo'
      }, {
          name: '(GMT+02:00) South Africa Standard Time',
          value: 'Africa/Johannesburg'
      }, {
          name: '(GMT+02:00) Central Africa Time - Khartoum',
          value: 'Africa/Khartoum'
      }, {
          name: '(GMT+02:00) Central Africa Time - Maputo',
          value: 'Africa/Maputo'
      }, {
          name: '(GMT+02:00) Eastern European Standard Time - Tripoli',
          value: 'Africa/Tripoli'
      }, {
          name: '(GMT+02:00) Central Africa Time - Windhoek',
          value: 'Africa/Windhoek'
      }, {
          name: '(GMT+02:00) Eastern European Time - Amman',
          value: 'Asia/Amman'
      }, {
          name: '(GMT+02:00) Eastern European Time - Beirut',
          value: 'Asia/Beirut'
      }, {
          name: '(GMT+02:00) Eastern European Time - Damascus',
          value: 'Asia/Damascus'
      }, {
          name: '(GMT+02:00) Famagusta Time',
          value: 'Asia/Famagusta'
      }, {
          name: '(GMT+02:00) Eastern European Time - Gaza',
          value: 'Asia/Gaza'
      }, {
          name: '(GMT+02:00) Eastern European Time - Hebron',
          value: 'Asia/Hebron'
      }, {
          name: '(GMT+02:00) Israel Time',
          value: 'Asia/Jerusalem'
      }, {
          name: '(GMT+02:00) Eastern European Time - Nicosia',
          value: 'Asia/Nicosia'
      }, {
          name: '(GMT+02:00) Eastern European Time - Athens',
          value: 'Europe/Athens'
      }, {
          name: '(GMT+02:00) Eastern European Time - Bucharest',
          value: 'Europe/Bucharest'
      }, {
          name: '(GMT+02:00) Eastern European Time - Chisinau',
          value: 'Europe/Chisinau'
      }, {
          name: '(GMT+02:00) Eastern European Time - Helsinki',
          value: 'Europe/Helsinki'
      }, {
          name: '(GMT+02:00) Eastern European Standard Time - Kaliningrad',
          value: 'Europe/Kaliningrad'
      }, {
          name: '(GMT+02:00) Eastern European Time - Kiev',
          value: 'Europe/Kiev'
      }, {
          name: '(GMT+02:00) Eastern European Time - Riga',
          value: 'Europe/Riga'
      }, {
          name: '(GMT+02:00) Eastern European Time - Sofia',
          value: 'Europe/Sofia'
      }, {
          name: '(GMT+02:00) Eastern European Time - Tallinn',
          value: 'Europe/Tallinn'
      }, {
          name: '(GMT+02:00) Eastern European Time - Uzhhorod',
          value: 'Europe/Uzhgorod'
      }, {
          name: '(GMT+02:00) Eastern European Time - Vilnius',
          value: 'Europe/Vilnius'
      }, {
          name: '(GMT+02:00) Eastern European Time - Zaporozhye',
          value: 'Europe/Zaporozhye'
      }, {
          name: '(GMT+03:00) East Africa Time - Juba',
          value: 'Africa/Juba'
      }, {
          name: '(GMT+03:00) East Africa Time - Nairobi',
          value: 'Africa/Nairobi'
      }, {
          name: '(GMT+03:00) Syowa Time',
          value: 'Antarctica/Syowa'
      }, {
          name: '(GMT+03:00) Arabian Standard Time - Baghdad',
          value: 'Asia/Baghdad'
      }, {
          name: '(GMT+03:00) Arabian Standard Time - Qatar',
          value: 'Asia/Qatar'
      }, {
          name: '(GMT+03:00) Arabian Standard Time - Riyadh',
          value: 'Asia/Riyadh'
      }, {
          name: '(GMT+03:00) Turkey Time',
          value: 'Europe/Istanbul'
      }, {
          name: '(GMT+03:00) Kirov Time',
          value: 'Europe/Kirov'
      }, {
          name: '(GMT+03:00) Moscow Standard Time - Minsk',
          value: 'Europe/Minsk'
      }, {
          name: '(GMT+03:00) Moscow Standard Time - Moscow',
          value: 'Europe/Moscow'
      }, {
          name: '(GMT+03:00) Moscow Standard Time - Simferopol',
          value: 'Europe/Simferopol'
      }, {
          name: '(GMT+03:30) Iran Time',
          value: 'Asia/Tehran'
      }, {
          name: '(GMT+04:00) Azerbaijan Standard Time',
          value: 'Asia/Baku'
      }, {
          name: '(GMT+04:00) Gulf Standard Time',
          value: 'Asia/Dubai'
      }, {
          name: '(GMT+04:00) Georgia Standard Time',
          value: 'Asia/Tbilisi'
      }, {
          name: '(GMT+04:00) Armenia Standard Time',
          value: 'Asia/Yerevan'
      }, {
          name: '(GMT+04:00) Astrakhan Time',
          value: 'Europe/Astrakhan'
      }, {
          name: '(GMT+04:00) Samara Standard Time',
          value: 'Europe/Samara'
      }, {
          name: '(GMT+04:00) Saratov Time',
          value: 'Europe/Saratov'
      }, {
          name: '(GMT+04:00) Ulyanovsk Time',
          value: 'Europe/Ulyanovsk'
      }, {
          name: '(GMT+04:00) Volgograd Standard Time',
          value: 'Europe/Volgograd'
      }, {
          name: '(GMT+04:00) Seychelles Time',
          value: 'Indian/Mahe'
      }, {
          name: '(GMT+04:00) Mauritius Standard Time',
          value: 'Indian/Mauritius'
      }, {
          name: '(GMT+04:00) Réunion Time',
          value: 'Indian/Reunion'
      }, {
          name: '(GMT+04:30) Afghanistan Time',
          value: 'Asia/Kabul'
      }, {
          name: '(GMT+05:00) Mawson Time',
          value: 'Antarctica/Mawson'
      }, {
          name: '(GMT+05:00) West Kazakhstan Time - Aqtau',
          value: 'Asia/Aqtau'
      }, {
          name: '(GMT+05:00) West Kazakhstan Time - Aqtobe',
          value: 'Asia/Aqtobe'
      }, {
          name: '(GMT+05:00) Turkmenistan Standard Time',
          value: 'Asia/Ashgabat'
      }, {
          name: '(GMT+05:00) West Kazakhstan Time - Atyrau',
          value: 'Asia/Atyrau'
      }, {
          name: '(GMT+05:00) Tajikistan Time',
          value: 'Asia/Dushanbe'
      }, {
          name: '(GMT+05:00) Pakistan Standard Time',
          value: 'Asia/Karachi'
      }, {
          name: '(GMT+05:00) West Kazakhstan Time - Oral',
          value: 'Asia/Oral'
      }, {
          name: '(GMT+05:00) West Kazakhstan Time - Qyzylorda',
          value: 'Asia/Qyzylorda'
      }, {
          name: '(GMT+05:00) Uzbekistan Standard Time - Samarkand',
          value: 'Asia/Samarkand'
      }, {
          name: '(GMT+05:00) Uzbekistan Standard Time - Tashkent',
          value: 'Asia/Tashkent'
      }, {
          name: '(GMT+05:00) Yekaterinburg Standard Time',
          value: 'Asia/Yekaterinburg'
      }, {
          name: '(GMT+05:00) French Southern & Antarctic Time',
          value: 'Indian/Kerguelen'
      }, {
          name: '(GMT+05:00) Maldives Time',
          value: 'Indian/Maldives'
      }, {
          name: '(GMT+05:30) India Standard Time - Colombo',
          value: 'Asia/Colombo'
      }, {
          name: '(GMT+05:30) India Standard Time - Kolkata',
          value: 'Asia/Kolkata'
      }, {
          name: '(GMT+05:45) Nepal Time',
          value: 'Asia/Kathmandu'
      }, {
          name: '(GMT+06:00) Vostok Time',
          value: 'Antarctica/Vostok'
      }, {
          name: '(GMT+06:00) East Kazakhstan Time - Almaty',
          value: 'Asia/Almaty'
      }, {
          name: '(GMT+06:00) Kyrgyzstan Time',
          value: 'Asia/Bishkek'
      }, {
          name: '(GMT+06:00) Bangladesh Standard Time',
          value: 'Asia/Dhaka'
      }, {
          name: '(GMT+06:00) Omsk Standard Time',
          value: 'Asia/Omsk'
      }, {
          name: '(GMT+06:00) East Kazakhstan Time - Qostanay',
          value: 'Asia/Qostanay'
      }, {
          name: '(GMT+06:00) Bhutan Time',
          value: 'Asia/Thimphu'
      }, {
          name: '(GMT+06:00) Urumqi Time',
          value: 'Asia/Urumqi'
      }, {
          name: '(GMT+06:00) Indian Ocean Time',
          value: 'Indian/Chagos'
      }, {
          name: '(GMT+06:30) Myanmar Time',
          value: 'Asia/Yangon'
      }, {
          name: '(GMT+06:30) Cocos Islands Time',
          value: 'Indian/Cocos'
      }, {
          name: '(GMT+07:00) Davis Time',
          value: 'Antarctica/Davis'
      }, {
          name: '(GMT+07:00) Indochina Time - Bangkok',
          value: 'Asia/Bangkok'
      }, {
          name: '(GMT+07:00) Barnaul Time',
          value: 'Asia/Barnaul'
      }, {
          name: '(GMT+07:00) Indochina Time - Ho Chi Minh City',
          value: 'Asia/Ho_Chi_Minh'
      }, {
          name: '(GMT+07:00) Hovd Standard Time',
          value: 'Asia/Hovd'
      }, {
          name: '(GMT+07:00) Western Indonesia Time - Jakarta',
          value: 'Asia/Jakarta'
      }, {
          name: '(GMT+07:00) Krasnoyarsk Standard Time - Krasnoyarsk',
          value: 'Asia/Krasnoyarsk'
      }, {
          name: '(GMT+07:00) Krasnoyarsk Standard Time - Novokuznetsk',
          value: 'Asia/Novokuznetsk'
      }, {
          name: '(GMT+07:00) Novosibirsk Standard Time',
          value: 'Asia/Novosibirsk'
      }, {
          name: '(GMT+07:00) Western Indonesia Time - Pontianak',
          value: 'Asia/Pontianak'
      }, {
          name: '(GMT+07:00) Tomsk Time',
          value: 'Asia/Tomsk'
      }, {
          name: '(GMT+07:00) Christmas Island Time',
          value: 'Indian/Christmas'
      }, {
          name: '(GMT+08:00) Australian Western Standard Time - Casey',
          value: 'Antarctica/Casey'
      }, {
          name: '(GMT+08:00) Brunei Darussalam Time',
          value: 'Asia/Brunei'
      }, {
          name: '(GMT+08:00) Choibalsan Standard Time',
          value: 'Asia/Choibalsan'
      }, {
          name: '(GMT+08:00) Hong Kong Standard Time',
          value: 'Asia/Hong_Kong'
      }, {
          name: '(GMT+08:00) Irkutsk Standard Time',
          value: 'Asia/Irkutsk'
      }, {
          name: '(GMT+08:00) Malaysia Time - Kuala Lumpur',
          value: 'Asia/Kuala_Lumpur'
      }, {
          name: '(GMT+08:00) Malaysia Time - Kuching',
          value: 'Asia/Kuching'
      }, {
          name: '(GMT+08:00) China Standard Time - Macau',
          value: 'Asia/Macau'
      }, {
          name: '(GMT+08:00) Central Indonesia Time',
          value: 'Asia/Makassar'
      }, {
          name: '(GMT+08:00) Philippine Standard Time',
          value: 'Asia/Manila'
      }, {
          name: '(GMT+08:00) China Standard Time - Shanghai',
          value: 'Asia/Shanghai'
      }, {
          name: '(GMT+08:00) Singapore Standard Time',
          value: 'Asia/Singapore'
      }, {
          name: '(GMT+08:00) Taipei Standard Time',
          value: 'Asia/Taipei'
      }, {
          name: '(GMT+08:00) Ulaanbaatar Standard Time',
          value: 'Asia/Ulaanbaatar'
      }, {
          name: '(GMT+08:00) Australian Western Standard Time - Perth',
          value: 'Australia/Perth'
      }, {
          name: '(GMT+08:45) Australian Central Western Standard Time',
          value: 'Australia/Eucla'
      }, {
          name: '(GMT+09:00) Yakutsk Standard Time - Chita',
          value: 'Asia/Chita'
      }, {
          name: '(GMT+09:00) East Timor Time',
          value: 'Asia/Dili'
      }, {
          name: '(GMT+09:00) Eastern Indonesia Time',
          value: 'Asia/Jayapura'
      }, {
          name: '(GMT+09:00) Yakutsk Standard Time - Khandyga',
          value: 'Asia/Khandyga'
      }, {
          name: '(GMT+09:00) Korean Standard Time - Pyongyang',
          value: 'Asia/Pyongyang'
      }, {
          name: '(GMT+09:00) Korean Standard Time - Seoul',
          value: 'Asia/Seoul'
      }, {
          name: '(GMT+09:00) Japan Standard Time',
          value: 'Asia/Tokyo'
      }, {
          name: '(GMT+09:00) Yakutsk Standard Time - Yakutsk',
          value: 'Asia/Yakutsk'
      }, {
          name: '(GMT+09:00) Palau Time',
          value: 'Pacific/Palau'
      }, {
          name: '(GMT+09:30) Australian Central Standard Time',
          value: 'Australia/Darwin'
      }, {
          name: '(GMT+10:00) Dumont-d’Urville Time',
          value: 'Antarctica/DumontDUrville'
      }, {
          name: '(GMT+10:00) Vladivostok Standard Time - Ust-Nera',
          value: 'Asia/Ust-Nera'
      }, {
          name: '(GMT+10:00) Vladivostok Standard Time - Vladivostok',
          value: 'Asia/Vladivostok'
      }, {
          name: '(GMT+10:00) Australian Eastern Standard Time - Brisbane',
          value: 'Australia/Brisbane'
      }, {
          name: '(GMT+10:00) Australian Eastern Standard Time - Lindeman',
          value: 'Australia/Lindeman'
      }, {
          name: '(GMT+10:00) Chuuk Time',
          value: 'Pacific/Chuuk'
      }, {
          name: '(GMT+10:00) Chamorro Standard Time',
          value: 'Pacific/Guam'
      }, {
          name: '(GMT+10:00) Papua New Guinea Time',
          value: 'Pacific/Port_Moresby'
      }, {
          name: '(GMT+10:30) Central Australia Time - Adelaide',
          value: 'Australia/Adelaide'
      }, {
          name: '(GMT+10:30) Central Australia Time - Broken Hill',
          value: 'Australia/Broken_Hill'
      }, {
          name: '(GMT+11:00) Macquarie Island Time',
          value: 'Antarctica/Macquarie'
      }, {
          name: '(GMT+11:00) Magadan Standard Time',
          value: 'Asia/Magadan'
      }, {
          name: '(GMT+11:00) Sakhalin Standard Time',
          value: 'Asia/Sakhalin'
      }, {
          name: '(GMT+11:00) Srednekolymsk Time',
          value: 'Asia/Srednekolymsk'
      }, {
          name: '(GMT+11:00) Eastern Australia Time - Currie',
          value: 'Australia/Currie'
      }, {
          name: '(GMT+11:00) Eastern Australia Time - Hobart',
          value: 'Australia/Hobart'
      }, {
          name: '(GMT+11:00) Lord Howe Time',
          value: 'Australia/Lord_Howe'
      }, {
          name: '(GMT+11:00) Eastern Australia Time - Melbourne',
          value: 'Australia/Melbourne'
      }, {
          name: '(GMT+11:00) Eastern Australia Time - Sydney',
          value: 'Australia/Sydney'
      }, {
          name: '(GMT+11:00) Bougainville Time',
          value: 'Pacific/Bougainville'
      }, {
          name: '(GMT+11:00) Vanuatu Standard Time',
          value: 'Pacific/Efate'
      }, {
          name: '(GMT+11:00) Solomon Islands Time',
          value: 'Pacific/Guadalcanal'
      }, {
          name: '(GMT+11:00) Kosrae Time',
          value: 'Pacific/Kosrae'
      }, {
          name: '(GMT+11:00) Norfolk Island Time',
          value: 'Pacific/Norfolk'
      }, {
          name: '(GMT+11:00) New Caledonia Standard Time',
          value: 'Pacific/Noumea'
      }, {
          name: '(GMT+11:00) Ponape Time',
          value: 'Pacific/Pohnpei'
      }, {
          name: '(GMT+12:00) Anadyr Standard Time',
          value: 'Asia/Anadyr'
      }, {
          name: '(GMT+12:00) Petropavlovsk-Kamchatski Standard Time',
          value: 'Asia/Kamchatka'
      }, {
          name: '(GMT+12:00) Fiji Time',
          value: 'Pacific/Fiji'
      }, {
          name: '(GMT+12:00) Tuvalu Time',
          value: 'Pacific/Funafuti'
      }, {
          name: '(GMT+12:00) Marshall Islands Time - Kwajalein',
          value: 'Pacific/Kwajalein'
      }, {
          name: '(GMT+12:00) Marshall Islands Time - Majuro',
          value: 'Pacific/Majuro'
      }, {
          name: '(GMT+12:00) Nauru Time',
          value: 'Pacific/Nauru'
      }, {
          name: '(GMT+12:00) Gilbert Islands Time',
          value: 'Pacific/Tarawa'
      }, {
          name: '(GMT+12:00) Wake Island Time',
          value: 'Pacific/Wake'
      }, {
          name: '(GMT+12:00) Wallis & Futuna Time',
          value: 'Pacific/Wallis'
      }, {
          name: '(GMT+13:00) New Zealand Time',
          value: 'Pacific/Auckland'
      }, {
          name: '(GMT+13:00) Phoenix Islands Time',
          value: 'Pacific/Enderbury'
      }, {
          name: '(GMT+13:00) Tokelau Time',
          value: 'Pacific/Fakaofo'
      }, {
          name: '(GMT+13:00) Tonga Standard Time',
          value: 'Pacific/Tongatapu'
      }, {
          name: '(GMT+13:45) Chatham Time',
          value: 'Pacific/Chatham'
      }, {
          name: '(GMT+14:00) Apia Time',
          value: 'Pacific/Apia'
      }, {
          name: '(GMT+14:00) Line Islands Time',
          value: 'Pacific/Kiritimati'
      }
    ]);
})();
