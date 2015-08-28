Feature: Authenticate into the ESN
  As a known user of OpenPaas
  I should be able to use authenticate
  to the ESN

  Scenario: Wrapping WebDriver
    Given I go on "index.html"
    Given I enter my credentials
    When I submit the form
    Then I should be redirected to "/communities"
