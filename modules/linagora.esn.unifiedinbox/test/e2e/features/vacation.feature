@unifiedinbox
Feature: As a user of Open-Paas, on the Unified Inbox module,
  I want to use vacation feature

  Background:
    Given I use a desktop screen

  Scenario: user2 receives vacation message from user1
    Given I logged in to OpenPaas with "user1" account
      And Display Unified Inbox
      And I click on the "Configuration" item on Inbox sidebar
      And I go to "Vacation" configuration tab
      And I fill start date with "2015/06/20" and message body with "I am on vacation"
      And I press "Save" button on Inbox subheader
      And I see a notification with message "Modification of vacation settings succeeded"
    When I logged in to OpenPaas with "user2" account
      And Display Unified Inbox
      And Unified Inbox composer opened
      And "To" recipient list contains "user1" email
      And Subject is "user2 receives vacation message from user1"
      And Body is "Hi, are you on vacation?"
      And I press "Send" button and wait for the message to be sent
      And I go to "All Mail" folder
    Then I see a message from "user1" with subject "Re: user2 receives vacation message from user1" and preview contains "I am on vacation"
