Feature: Authenticate into the ESN
  As a known user of OpenPaas
  I should be able to authenticate
  to the ESN

  Scenario: By the form
    Given I go on "/"
    Given I enter my credentials
    When I submit the form
    Then I should be redirected to "/communities"

  Scenario: By cookie
    Given I am authenticated
    When I change the url location to "/"
    Then I should be redirected to "/communities"
