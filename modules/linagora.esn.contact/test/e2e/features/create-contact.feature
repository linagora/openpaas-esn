@contact
Feature: As a user of Open-Paas, on the linagora.esn.contact module,
  I want to be able to see my homepage

  Background:
    Given I logged in to OpenPaaS
    And I use a desktop screen

  Scenario: User creates a new contact
    Given I am on the Contact module page
    When I click on the contact FAB button
      And I fill firstname with "Chuck"
      And I fill lastname with "Norris"
      And I click on the create button
    Then I am redirected to contact show page
      And I see contact "Chuck Norris" in the contact show page
