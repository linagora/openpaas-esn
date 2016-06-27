@unifiedinbox
Feature: As a user of Open-Paas, on the Unified Inbox module,
  I want to be able to create folders

  Background:
    Given I logged in to OpenPaas with "user1" account
    And I use a desktop screen

  Scenario: user1 creates a custom folder
    Given Display Unified Inbox
    When I click on the "New folder" item on Inbox sidebar
      And I write "custom folder" in the Name field
      And I set "Unified Inbox" in the "Is located under" field
      And I press "Save" button on Inbox subheader
    Then I have two notifications "Creation of folder custom folder in progress...", then "Creation of folder custom folder succeeded"
      And the location url should equal "/unifiedinbox/inbox"
      And I have "custom folder" in the sidebar at the root level
