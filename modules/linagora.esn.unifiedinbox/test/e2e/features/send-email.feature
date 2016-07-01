@unifiedinbox
Feature: As a user of Open-Paas, on the Unified Inbox module,
  I want to be able to send emails

  Scenario: user1 sends a txt email to user2
    Given I use a desktop screen
      And "user2" is an existing james user
      And I logged in to OpenPaas with "user1" account
      And Display Unified Inbox
      And Unified Inbox composer opened
      And "To" recipient list contains "user2" email
      And Subject is "user1 sends email to user2"
      And Body is "Hi, did you receive my email. Cheers, user1"
    When I press "Send" button and wait for the message to be sent
      And I log in to OpenPaas with "user2" account
      And Display Unified Inbox
    Then I see a message from "user1" with subject "user1 sends email to user2" and preview contains "Cheers, user1"
