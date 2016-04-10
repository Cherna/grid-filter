# Grid-Filter

For a quick view, see the [Demo Page](http://cherna.github.io/simple-grid-filtering/).

## Usage

Include from somewhere somehow.

## API

### Basic Usage

#### Passing options

```
  var gridFilter = new GridFilter({

    input: '#main-input', // selector for input to initialize

    container: 'main-table', // id for main table (Must be an id)

    row: '.table-row', // selector for rows of table to query

    matchContainer: '.name', // selector for text containers to be queried

    wrapTag: 'b', // tag to wrap the matched text in

    caseSensitive: false, // flag to indicate if case-sensitive search should be enabled

    onReady: function() {
      console.log('Main grid filter is ready.');
    },

    onInputChange: function(val, e) {
      console.log('input event fired with ' + val + ' value.');
    },

    onSearchEmpty: function(val) {
      console.log('Search returned no results');
    },

    onSearchNonEmpty: function(results, val) {
      console.log('Search returned this results:');
      console.log(results);
    },

    onInputCleared: function(e) {
      console.log('input was cleared.');
    }

  });
```

#### The matchContainer propery

You can pass a single selector to query a single field:

```
  matchContainer: '.name'
```

Or pass an array to query multiple fields:

```
  matchContainer: ['.name', '.occupation'], // If there are more than one an array should be passed
```

#### Be specific

If your markup is like this:
```
  <div class="table-row">
    <span class="name">
      <a href="#">
        Name LastName
      </a>
    </span>
  </div>
```

then your selector for the `matchContainer` property of the options object should be as follows:
```
  matchContainer: '.name a',
```

## Contribute

Clone repo and run some commands.
