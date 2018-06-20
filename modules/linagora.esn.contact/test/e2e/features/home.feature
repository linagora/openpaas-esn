@contact
Feature: As a user of Open-Paas, on the linagora.esn.contact module,
  I want to be able to see my homepage

  Background:
    Given I logged in to OpenPaaS
    And I use a desktop screen

  Scenario: User can see the contacts list on the homepage
    Given I am on the Contact module page
    Then I can see the contact list
