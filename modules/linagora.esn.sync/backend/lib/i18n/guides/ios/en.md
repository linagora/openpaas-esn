## Email synchronization

To check your emails, you can use the OpenPaaS web interface or an email application. Here, you will learn how to associate your email account to an email application using the IMAP protocol. This synchronization will allow you to read already received emails, even when you are offline.

### Set up a new email account

1. On the home screen, go to **Settings** by tapping the gear-shaped icon.

    ![go to Settings](/sync/images/en/ios_home_screen.png)

2. Scroll down until the `Mail` category, which you will open.

    ![go to Mail](/sync/images/en/ios_add_imap_account_1.png)

3. Then, you tap `Accounts`, the first element of the category.

    ![open Accounts](/sync/images/en/ios_add_imap_account_2.png)

4. Select `Add Account`.

    ![Add Account](/sync/images/en/ios_add_imap_account_3.png)

5. Select `Other` at the bottom of the list.

    ![Add Account](/sync/images/en/ios_add_imap_account_4.png)

6. Select `Add Mail Account`.

    ![Add Account](/sync/images/en/ios_add_imap_account_5.png)

7. On the `New Account` page, fill the empty fields with your OpenPaaS account information.
    * - __Name__: `<%= user.preferredEmail %>`
    * - __Username__: `<%= user.preferredEmail %>`
    * - __Password__: *OpenPaaS* password
    * - __Description__: My OpenPaaS Account!

    ![Add Account](/sync/images/en/ios_add_imap_account_6.png)

8. On the next screen, do the following.
    * **Incoming Mail Server** settings:
        * - __Host Name__: `<%= config.accounts[0].imap.hostName %>`
        * - __Username__: `<%= user.preferredEmail %>`
        * - __Password__: *OpenPaaS* password
    * And the following **Ougoing Mail Server** settings:
        * - __Host Name__: `<%= config.accounts[0].imap.hostName %>`
        * - __Username__: *Optionnal*
        * - __Password__: *Optionnal*
    * When it is done, tap `Next`.

    ![Add Account](/sync/images/en/ios_add_imap_account_7.png)

9. When the `Cannot Connect Using SSL` appears, select `Yes`

    ![Add Account](/sync/images/en/ios_add_imap_account_8.png)

10. On the `IMAP` screen, just tap the `Save` button. **Your account is now set up!** You can now access your mail using your favorite email application.

## Calendars synchronization

To view your calendar, you can either use the OpenPaaS web interface or the native calendar application located on your iOS device. Here, you will learn to do the later: how to synchronize your iOS device with OpenPaaS. Most notably, this will allow you to read already received events, even when you are offline.

### Set up a new calendar account

1. On the home screen, go to **Settings** by tapping the gear-shaped icon.

    ![go to Settings](/sync/images/en/ios_home_screen.png)

2. Scroll down until the `Calendar` category, which you will open.

    ![go to Calendar](/sync/images/en/ios_caldav_account_1.png)

3. Then, you tap `Accounts`, the first element of the category.

    ![open Accounts](/sync/images/en/ios_caldav_account_2.png)

4. Select `Add Account`, which is the last item on the list.

    ![Add Account](/sync/images/en/ios_caldav_add_account_1.png)

5. Select `Other` at the bottom of the list.

    ![Other Account](/sync/images/en/ios_caldav_add_account_2.png)

6. Select `Add CalDAV Account`.

    ![CalDAV Account](/sync/images/en/ios_caldav_add_account_3.png)

7. On the `CalDAV` page, fill the empty fields with your OpenPaaS account as being shown bellow, and select `Save`.

    ![CalDAV config](/sync/images/en/ios_caldav_add_account_4.png)

    * Use the following **CalDAV** settings:
        * - __Server__: `<%= config.accounts[0].imap.hostName %>`
        * - __Username__: `<%= user.preferredEmail %>`
        * - __Password__: Your *OpenPaaS* password
        * - __Description__: *Optionnal*

8. Finally, tap `Save`: The synchronization is now in active.

    ![CalDAV config](/sync/images/en/ios_caldav_add_account_5.png)
