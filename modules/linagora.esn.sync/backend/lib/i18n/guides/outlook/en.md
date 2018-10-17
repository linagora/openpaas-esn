## Email synchronization

To check your emails, you can either use the OpenPaaS web interface or an email client. Here, you will learn how to associate your email account to **Outlook 2016**, an email client. This synchronization will allow you to read already received emails, even when you are offline.

*The following instructions might work with version older than Outlook 2016, but bear in mind that we only support Outlook 2016 and onwards.*

### Set up a new email account

1. First, you need to launch Outlook 2016, by double-clicking on its shortcut, as shown bellow.

    ![The outlook icon](/sync/images/en/windows_home_outlook.png)

2. Then, you need to navigate to the `File` tap, at the top left corner.

    ![The *File* tap](/sync/images/en/windows_setup_outlook_account_0.png)

3. From there, you click on `Add Account`, which will bring a new window.

    ![Add Account](/sync/images/en/windows_setup_outlook_account_1.png)

4. On this new window, write down your email address and click on `Connect`.

    ![Email address field](/sync/images/en/windows_setup_outlook_account_2.png)

5. Now, you need to enter the password associated with your OpenPaaS address and click once again on `Connect`.

    ![Password field](/sync/images/en/windows_setup_outlook_account_3.png)

6. Wait until you are greated with the `Account setup is complete` page and click on `Ok`. That is all! You will now be able to send and receive emails from within Outlook, congratulations!

    ![Processing your request](/sync/images/en/windows_setup_outlook_account_4.png)

    ![Your account setup is now complete!](/sync/images/en/windows_setup_outlook_account_5.png)

## Calendars synchronization

To view your calendar, you can either use the OpenPaaS web interface or any native calendar application compatible with the CalDAV protocol. Unfortunately Outlook is not compatible with CalDAV. In order to use Outlook to view and edit your calendar, the `Outlook CalDav Synchronizer` add-on will have to be installed. Once it is done, you will be able to associate your OpenPaaS-based calendar with Outlook.

*To install the synchronizer add-on, administrator rights are required. If you don't know whether you have them or not, please ask your local IT support team*

### Prerequisite: Outlook CalDav Synchronizer

1. First, open any web browser such as Firefox, Chrome, or Internet Explorer.

    ![Firefox shortcut](/sync/images/en/windows_firefox_shortcut.png)

2. On the address bar, write down or copy and paste the following address and press *Enter*: `https://caldavsynchronizer.org/`.

    ![URL address](/sync/images/en/windows_install_caldavsynchronizer_2.png)

3. Navigate to the `Download` tap located at the top and once you are there, click on the rectangle blue button called `Download [...]`, which will open a file explorer window.

    ![Download section](/sync/images/en/windows_install_caldavsynchronizer_3.png)

4. Select `Ok` on the said window.

    ![File explorer](/sync/images/en/windows_install_caldavsynchronizer_4.png)

5. Once the download is done, a window will open, showing two files. Double-click on the file `CalDavSynchronizer.Setup.msi`, which will trigger the installation.

    ![File explorer](/sync/images/en/windows_install_caldavsynchronizer_5.png)

5. From, there, click on `Next`, and then `Next` again.

    ![Installer: first step](/sync/images/en/windows_install_caldavsynchronizer_6.png)

    ![Installer: second step](/sync/images/en/windows_install_caldavsynchronizer_7.png)

7. A new window will pop up, asking you the following question: `Do you want to allow this to make changes to your device?` Select the `Yes` button.

    ![Changes to your device](/sync/images/en/windows_install_caldavsynchronizer_8.png)

8. Once the installation is done, click on the `Close` button. Congratulations: Cal Dav Synchronizer is now installed!

    ![Done with the installation](/sync/images/en/windows_install_caldavsynchronizer_9.png)

### Set up a new calendar account with CalDav Synchronizer

Cal Dav Synchronizer is now installed. You will now have to associate your OpenPaaS calendar with Outlook.

1. First, double-click on the Outlook 2016 shortcut, as shown in the screenshot bellow.

    ![The outlook icon](/sync/images/en/windows_home_outlook.png)

2. Go the `CalDav Synchronizer` tab, located at the top of your screen. A ribbon will appear, revealing further options. Choose `Sychronization Profiles`.

    ![Outlook CalDav](/sync/images/en/windows_setup_caldavsynchronizer_1.png)

3. Once you are there, select the **Plus symbol**. On the new window, leave the current default settings and click on `OK`.

4. Pick a name for your profile, which can for instance match the name of the Calendar you want to synchronize Outlook with. In our example, the name is `My OpenPaaS main calendar`. Under `Outlook Settings`, at the end of the `Outlook folder` field, click on the **three dots**. From there, select `New...`. A new tiny window will appear. Under the `Folder contains` field, pick `Calendar Items`. Choose under wich folder you would like your calendar to be nested under, and press `Ok`.
*The box `Synchronize items immediately after change` can be checked.*

    ![How to sync](/sync/images/en/windows_setup_caldavsynchronizer_2.png)

5. Under the `Server Settings` section, fill the `DAV URL`. It should match your domain name, to wich you will append `/sdav/`.
        * - **DAV URL**: `<%= user.preferredEmail %>`/sdav/
        * - **Username**: `<%= user.preferredEmail %>`
        * - **Password**: *OpenPaaS* password
        * - **Email address**: `<%= user.preferredEmail %>`
        * Once you are done, click on `OK` at the bottom right corner of the window.

    ![Done with your settings](/sync/images/en/windows_setup_caldavsynchronizer_3.png)

6. A window will open, letting you choose which calendar Outlook will be sync with. Select the desired calendar and click on `OK`. On the other window, click again on `OK`.

    ![The calendar to sync](/sync/images/en/windows_setup_caldavsynchronizer_4.png)

7. That is all, Outlook is now in sync with your OpenPaaS calendar! You can now use your calendar by navigating to the calendar side of Outlook.

    ![Calendar in Outlook](/sync/images/en/windows_setup_caldavsynchronizer_5.png)
