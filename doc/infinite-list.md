# infinite-list

infinite-list is a directive of type element used to add support for infinite lists.
This directive uses ngInfiniteScroll [(more)](http://binarymuse.github.io/ngInfiniteScroll/index.html).

## How to use it

    <div ng-controller="CTRL">
        ...
        <infinite-list load-more-elements='loadMoreElements()'>
            <div ng-repeat="elt in list">...</div>
        </infinite-list>
        ...
    </div>

The directive must be used with a "loadMoreElements" function which will fetch/build and add new elements to the list from the ng-repeat in order to provide infinite scrolling.

## Configuration

The directive has three optional attributes.

* infiniteScrollDistance (int)
* infiniteScrollDisabled (boolean)
* infiniteScrollImmediateCheck (boolean)
* scrollInsideContainer (boolean)

If these properties are not defined in the scope, they are set to their default values (1, false, true).
See [ngInfiniteScroll documentation](http://binarymuse.github.io/ngInfiniteScroll/documentation.html) for properties meaning.

