Email synchronization
----------------

We'll use the IMAP protocol for synchronizing email messages with your devices

### Set up a new email account using IMAP

Please be aware these steps may vary between manufacturers.

1. In your Android App list, tap the **Settings** gear icon.

![go to Settings](/sync/images/en/android_settings_icon.png)

2. Depending on the phone, tap `Accounts & sync` or `Accounts`.

![go to Accounts](/sync/images/en/android_settings_accounts.png)

3. Tap `Add account`.

![go to Accounts](/sync/images/en/android_add_account.png)

4. This will bring you to a page with the type of accounts you can create, 
tap `Personal (IMAP)`.

![go to Personal IMAP](/sync/images/en/android_add_imap_account.png)

5. Enter your **Email address** : `<%= user.preferredEmail %>`  

![add your email address](/sync/images/en/android_add_imap_account_1.png)
6. Tap `Manual setup`  (*slide down keyboard overlay first, if the link is hidden*).
    - Tap `Personal (IMAP)`

    ![select IMAP](/sync/images/en/android_add_imap_account_2.png)
    - Type your password

    ![input password](/sync/images/en/android_add_imap_account_3_password.png)
    - Set **Incoming Server Settings** to (or check) :    
        - __Username__: `<%= user.preferredEmail %>`
        - __Password__: domain password (or OpenPaaS password)
        - __Server__: `<%= config.accounts[0].imap.hostName %>`
        - __Port__: `<%= config.accounts[0].imap.port %>`
        - __Security type__: STARTTLS

    ![incoming server](/sync/images/en/android_add_imap_account_4_incoming.png)
    - Tap `Next`
    - Set **Outgoing Server Settings** to :
        - __Require signin__: *Checked*
        - __Username__: `<%= config.accounts[0].smtp.hostname %>`
        - __Server__: set to `<%= config.accounts[0].smtp.hostname %>`
        - __Port__: `<%= config.accounts[0].smtp.port %>`
        - __Security type__: STARTTLS

    ![outgoing server](/sync/images/en/android_add_imap_account_5_outgoing.png)
    - Tap `Next`
    - Select your synchronization preferences or **leave default settings**
    - Set your display name (used when sending messages)

    ![outgoing server](/sync/images/en/android_add_imap_account_6.png)

7. Your account set up is complete, you can access your mail using your preferred Email app now (eg google Gmail) .

Contacts & Calendar synchronization
----------------

### Pre-requisites

As Android OS cannot access remote calendars & address books using CalDAV and CardDAV natively,
you must install an application (`DAVdroid`) for synchronizing events and contacts.

> Note that the application requires version 4.0.3 as a minimum of `Android` os

- Install `DAVdroid` by following the steps below:
1. Make sure your phone can install apps from `Unknown Sources` by enabling it in `Settings | Security`.
![enable unknown sources](/sync/images/en/android_davdroid_unknown_src.png)
2. Download the [DAVdroid apk] file.
3. Open the `Downloads` app
4. Find and tap **most recent item** (ie open downloaded item).
5. Scroll down to the bottom.
6. Tap `Install`
![install DAVdroid](/sync/images/en/android_davdroid_installed.png)
7. Tap `Open`
8. Skip to the welcome screen (ie pass license warnings) 

### Configure calendar and address books synchronization

1. Tap the `+` button
![empty DAVdroid](/sync/images/en/android_davdroid_empty.png)
2. Input your email address `<%= user.preferredEmail %>` and domain password
![DAV domain credentials](/sync/images/en/android_davdroid_add_account.png)
3. Tap `Login`
4. Tap `Create Account` then tap *added yellow item*
![DAV yellow button](/sync/images/en/android_davdroid_accounts_list.png)
5. Tick both left hand side of CardDAV and CalDAV cards to enable synchronization.
![DAV enable automated sync](/sync/images/en/android_davdroid_enable_autosync.png)
6. (Optionally) Tap *gear icon* for adjusting synchronization settings

[DAVdroid apk]: https://f-droid.org/repo/at.bitfire.davdroid_136.apk

