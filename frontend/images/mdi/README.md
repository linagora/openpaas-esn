## Icons
To use Material Design icons.

- Download 'mdi.svg' from here [1][1].
- Add an icon provider to your module.
```javascript
   .config(function($mdIconProvider) {
     $mdIconProvider.defaultIconSet('images/mdi/mdi.svg', 24);
   })

```

- Then you can use icons this way.
```jade
md-icon(md-svg-icon="account",aria-label="Account Icon")
```

## Resources

1. [https://materialdesignicons.com/getting-started][1]

[1]: https://materialdesignicons.com/getting-started