Demonstrate issue with rollup (or any commonjs) and zen-observable-ts in apollo-link

See compiled [rollup-graph-link.umd.js](https://github.com/acoreyj/apollo-link-observable-rollup-issue/blob/master/rollup-graph-link.umd.js) which is compiled by rollup (`npm run build`) for browsers has a require (`var Observable = require('zen-observable');`) statement which will error. This is because zenObservable.js (node_modules/zen-observable-ts/lib) combines a require and export (`export var Observable = require('zen-observable');` which makes commonjs ignore it.



## Update 

in the (https://github.com/apollographql/apollo-link/issues/558) Pull Request I added the allowSyntheticDefaultImports to the tsConfig so now the fixed zenObservable.js will look more normal

```
import zenObservable from 'zen-observable';
export var Observable = zenObservable;
```


## Original

If we change zenObservable.js to import/export like so it works.

```
import * as zenObservable from 'zen-observable';
export var Observable = zenObservable['default'];
```

See [rollup-graph-link-fixed.umd.js](https://github.com/acoreyj/apollo-link-observable-rollup-issue/blob/master/rollup-graph-link-fixed.umd.js) which is compiled with this change.

Note this looks strange as we are importing * and exporting default but TypeScript (which this zenObservable.js is compiled from) doesn't see that zen-observable has a default so errors on a default import like `import zenObservable from 'zen-observable';`
But on doing a * import the result actually ends up with a property default which is the constructor we want. So what we can do is set the export to the default property of the * import. Normal ES modules see the default fine, just TypeScript doesn't. I'm not familiar enough with any of this to know why this strange behavior of default is happening, something do with how zen-observable is handling it's exports I'm guessing. Perhaps it is fixed in the latest zen-observable though? 

Should be fixed by this PR

https://github.com/apollographql/apollo-link/pull/559