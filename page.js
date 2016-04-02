$(document).ready(function() {

  var firstFilter = new $.SimpleGridFilter({
    'input': '#first-example-input',
    'container': 'first-table',
    'row': '.table-row',
    'matchContainer': '.name',
    'matchText': ''
  });

  var secondFilter = new $.SimpleGridFilter({
    'input': '#second-example-input',
    'container': 'second-table',
    'row': '.table-row',
    'matchContainer': '.occupation',
    'matchText': ''
  });

})