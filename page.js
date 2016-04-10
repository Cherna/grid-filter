document.addEventListener('DOMContentLoaded', function() {
  
  var firstFilter = new SimpleGridFilter({
    'input': '#first-example-input',
    'container': 'first-table',
    'row': '.table-row',
    'matchContainer': ['.name', '.tel-number', '.occupation'],
    'wrapTag': '',
    'caseSensitive': false,
    onReady: function() {
      // console.log('ready 1');
    },
    onInputChange: function(e) {
      // console.log('input event');
    },
    onSearchEmpty: function() {
      // console.log('empty search');
    },
    onSearchNonEmpty: function() {
      // console.log('non empty search')
    },
    onInputCleared: function(e) {
      // console.log('input cleared')
    }
  });

  var secondFilter = new SimpleGridFilter({
    'input': '#second-example-input',
    'container': 'second-table',
    'row': '.table-row',
    'matchContainer': '.occupation',
    'matchText': '',
    'wrapTag': 'strong'
  });

});