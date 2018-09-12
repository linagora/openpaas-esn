Email synchronization
----------------

To check your emails, you can use the OpenPaaS web interface or an email application. Here, you will learn how to associate your email account to an email application using the IMAP protocol. This synchronization will allow you to read already received emails, even when you are offline.

### Set up a new email account

> Caution: the following steps may vary from one manufacturer to the other.

1. Swipe down from the top of your screen to reveal the panel and go to **Settings** by tapping the gear-shaped icon.
![go to Settings](/sync/images/en/android_settings_icon.png)

2. Depending on your phone, tap `Accounts & sync` or `Accounts`.
![go to Accounts](/sync/images/en/android_settings_accounts.png)

3. Tap `Add account`.
![go to Accounts](/sync/images/en/android_add_account.png)

4. A new page will appear, showing a list of email account type you can link your phone to. Select `Personal (IMAP)`.
![go to Personal IMAP](/sync/images/en/android_add_imap_account.png)

5. Enter your *OpenPaaS* **Email address** : `<%= user.preferredEmail %>`  
![add your email address](/sync/images/en/android_add_imap_account_1.png)

6. Tap `Manual setup` (*if the link is hidden, slide down the keyboard overlay first*).
    * Tap `Personal (IMAP)` and `Next`.
    ![select IMAP](/sync/images/en/android_add_imap_account_2.png)
    * Type your *OpenPaaS* password
    ![input password](/sync/images/en/android_add_imap_account_3_password.png)
    * Use the following **Incoming Server Settings**:
        * __Username__: `<%= user.preferredEmail %>`
        * __Password__: *OpenPaaS* password
        * __Server__: `<%= config.accounts[0].imap.hostName %>`
        * __Port__: `<%= config.accounts[0].imap.port %>`
        * __Security type__: STARTTLS
    ![incoming server](/sync/images/en/android_add_imap_account_4_incoming.png)
    * Tap `Next`.
    * Set **Outgoing Server Settings** to :
        * __Require signin__: *Checked*
        * __Username__: `<%= config.accounts[0].smtp.hostname %>`
        * __Server__: set to `<%= config.accounts[0].smtp.hostname %>`
        * __Port__: `<%= config.accounts[0].smtp.port %>`
        * __Security type__: STARTTLS
    ![outgoing server](/sync/images/en/android_add_imap_account_5_outgoing.png)
    * Tap `Next`.
    * Set your synchronization preferences.
    * Set your display name, which will be used for sent messages, and tap `Next`.
    ![outgoing server](/sync/images/en/android_add_imap_account_6.png)

7. **Your account is now set up**! You can now access your mail using your favorite email application.

Contacts & Calendars synchronization
----------------

### Prerequisites

By default, Android devices do not natively support the CalDAV and CardDAV protocols. As a result, they cannot display remote calendars locally. In order for you to access your events or contacts on your phone without a web browser, you will need to install `DAVdroid`, an application which will manage this synchronization.

> Caution: in order to work, `DAVdroid` requires at least `Android 4.4`. If your smartphone is less than five years old, you should be ready to go.

1. By default, Android will only allow the installation of applications coming from the Google market. To install DAVdroid, you will need to let your phone install applications coming from "Unknown Sources". To do so, navigate to the menu `Settings > Security` and activate the corresponding option.
![enable unknown sources](/sync/images/en/android_davdroid_unknown_src.png)

2. You can then Download the [DAVdroid apk] file.
3. Open the `Downloads` app, or if missing the `File explorer` app.
4. Within the *Downloads* folder, scroll down to the bottom if necessary.
5. Find and tap the most recent downloaded item.
6. Tap `Install`.
![install DAVdroid](/sync/images/en/android_davdroid_installed.png)
7. Tap `Open`.
8. Go to the welcome screen by skipping licence warnings.
9. Once you have installed DAVdroid, return to the `Settings > Security` menu, and then **disable** the option to allow the installation of applications coming from `Unknown Sources`.
![enable unknown sources](/sync/images/en/android_davdroid_unknown_src.png)

### Configure calendars and address books synchronization

1. Once DAVdroid is open, tap the `+` button.
![empty DAVdroid](/sync/images/en/android_davdroid_empty.png)
2. Set your email address `<%= user.preferredEmail %>` and domain password.
![DAV domain credentials](/sync/images/en/android_davdroid_add_account.png)
3. Tap `Login`.
4. Tap `Create Account` then tap *added yellow item*.
![DAV yellow button](/sync/images/en/android_davdroid_accounts_list.png)
5. At this point, DAVdroid may require further permissions, most notably to access your calendar and contacts. Grant those permissions to DAVdroid.
6. To enable synchronization, make sure to tick boxes located next to the CardDAV and CalDAV cards.
![DAV enable automated sync](/sync/images/en/android_davdroid_enable_autosync.png)
7. You may tap on the *gear icon* to adjust synchronization settings.

[DAVdroid apk]: https://f-droid.org/repo/at.bitfire.davdroid_231.apk
