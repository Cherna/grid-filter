var debounce = require('lodash.debounce');

(function($) {

  $.fn.SimpleGridFilter = function(options) {

    var defaults = {

    }

    this.options = $.extend(defaults, options);

    console.log(this.options);

    this.initSearchInput = function (selector) {
      var $input = $(selector);

      $input.on('input', debounce(onInputEvent, 60) );

      function onInputEvent(e) {
        e.preventDefault();
        var currVal = $(e.target).val();
        onInputChanged(currVal);
      }
    }

    return this;

  }

  $.fn.SimpleGridFilter.prototype.matchGridElements = function (matcher) {
    mainListItems = mainListItems.length ? mainListItems : $section.find('.app-item');
    var regExMatcher = new RegExp(matcher, 'i');
    var newListItems = mainListItems.filter(function(i, el) {
      var $el = $(el).find('.app-title');
      var matched = $el.text().trim().match(regExMatcher);
      if (matched) {
        $el.find('a').html( highlightMatchedElement(matched) );
      }
      return matched;
    });
    if (!newListItems.length) {
      toggleEmptyNotice(true, 'results');
    } else {
      toggleEmptyNotice(false);
    }
    mainListItems.detach();
    $section.find('.clients-list-table').append(newListItems);
  }

  $.fn.SimpleGridFilter.prototype.highlightMatchedElement = function (result) {
    var resMatch = result[0];
    var resLength = result[0].length;
    var resStartIndex = result.index;
    var resString = result.input;
    return resString.replace(resMatch, '<strong>' + resMatch + '</strong>');
  }

  $.fn.SimpleGridFilter.prototype.loadGrid = function (clients, grants) {
    var processedClients = processClients(clients, grants);
    var gridTemplate = appsGrid({ clients: processedClients });
    var grantClients = processedClients.filter(function(el) {
      return el.hasGrant;
    });

    $section.find('.clients-grid-container').html(gridTemplate);

    // Put those with grants on top
    var grants = $section.find('.app-item').filter(function() {
      return $(this).attr('data-grant-id');
    })
    // Its important that we don't .remove() the grants and just .detach() them, 
    // to keep the event handlers bound to the elements when re-attaching
    grants.detach().insertBefore( $section.find('.app-item').eq(0) );

    $section.find('.delete-grant').onf('click', onDeleteClientGrant);
    $section.find('.authorize-client').onf('click', onAuthorizeClient);
    // Save new set of available items to check for typeahead
    mainListItems = $section.find('.app-item');

    if ( !processedClients.length ) {
      toggleEmptyNotice(true);
    } else {
      toggleEmptyNotice(false);
    }

    $('.copy-btn', $section).clipboardize();
  }

  $.fn.SimpleGridFilter.prototype.onInputChanged = function (string) {
    matchGridElements(string);
  }

  $.SimpleGridFilter = $.fn.SimpleGridFilter;

})(jQuery);