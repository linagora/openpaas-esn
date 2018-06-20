@login
Feature: As a user of Open-Paas,
  I want to be able to interact with the login page

  Background:
    Given I am not logged in to OpenPaaS

  Scenario: OpenPaaS login page should not change url when login fails
    When I go on "/"
    And I log in with "admin@open-paas.org" and "wrong secret"
    Then the error notification should be present
    And the location url should equal "/"

  Scenario: OpenPaaS login page should change url when login success
    When I go on "/"
    And I log in with "admin@open-paas.org" and "secret"
    And I wait for the url redirection
    Then the location url should not equal "/"

  Scenario: OpenPaaS login page should continue to the asked page
    When I go on "/#/?continue=%2Fcontrolcenter%2Faccounts"
    And I log in with "admin@open-paas.org" and "secret"
    And I wait for the url redirection
    Then the location url should equal "/controlcenter/accounts"
