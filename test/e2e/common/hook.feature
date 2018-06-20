Feature: As a developer who writes E2E test for OpenPaaS,
  I want to be logged out after each E2E test scenario

  Scenario: Login to OpenPaaS in 1st scenario
    Given I logged in to OpenPaaS
    Then the location url should equal "/unifiedinbox/inbox"

  Scenario: Logged out OpenPaaS in 2nd senario
    Then the location url should equal "/"
