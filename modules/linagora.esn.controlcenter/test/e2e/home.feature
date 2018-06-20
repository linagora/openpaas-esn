Feature: As a user of Open-Paas,
  I want to be able to interact with the control center page

  Background:
    Given I logged in to OpenPaaS

  Scenario: Go to general page by default
    When I go on "/#/controlcenter"
    Then the location url should equal "/controlcenter/general"

  Scenario: Show sidebar on desktop
    Given I use a desktop screen
    When I go on "/#/controlcenter"
    Then I see the control center sidebar

  Scenario: Hide sidebar on mobile
    Given I use a mobile screen
    When I go on "/#/controlcenter"
    Then I do not see the control center sidebar
