# ESN modules

**This part is deprecated**

This document describes and lists all anchor points available inside the ESN. Note that for better display, one should
follow the template example pattern.

## Anchor points list

### domainUserRightDropdown

#### Template example

        li: a(href='#/applications') #{__('Applications')}

### domainHeaderNavBar

#### Template example

        .esn-item(data-esn-path='projects')
          span
            a(href='#/projects')
              i.mdi.mdi-briefcase
              span.hidden-xs #{__('Projects')}

### communityPageRightPanel

#### Template example

        div
            ...
        .vertiz-space

### communityPageActionsToolbar

#### Template example

        a.btn.btn-info(ng-href='/#/calendar/communities/{{community._id}}')
          | #{__('Calendar')} &nbsp;
          i.mdi.mdi-calendar

### messageEditionMessageTypeButton

#### Template example

        li(ng-show='::calendarId')
          button.btn.btn-link(type='button', ng-click='show("event")')
            i.mdi.mdi-calendar

### messageEditionMessageTypeSwitch

#### Template example

        poll-edition(data-ng-switch-when='poll', type="type")
