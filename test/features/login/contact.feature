Feature: Contact module into the ESN
  As a known user of OpenPaas
  I should be able to use the contact module

  Scenario: OR-1224 As a user, I want to create a new contact
    Given I am authenticated
    When I change the url location to "/"
    Then I should be redirected to "/communities"
