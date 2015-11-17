Feature: As a developer who writes E2E test for OpenPaas,
  I want to be logged out after each E2E test scenario

  Scenario: Login to OpenPaas in 1st scenario
    Given I logged in to OpenPaas
    Then the location url should equal "/unifiedinbox/inbox"

  Scenario: Logged out OpenPaas in 2nd senario
    Then the location url should equal "/"
