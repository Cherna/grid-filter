(function($) {

  function SimpleGridFilter (options) {

    var defaults = {
      'debounce': 60
    }

    this.opts = $.extend(defaults, options);

    if (!this.opts.input) {
      console.error('You need to specify an input selector.');
    } else if (!this.opts.container) {
      console.error('You need to specify a container selector.');
    } else if (!this.opts.row) {
      console.error('You need to specify a row selector.');
    } else if (!this.opts.matchContainer) {
      console.error('You need to specify a match container selector.');
    }

    this.opts.container = '#' + this.opts.container;
    this.mainTable = $(this.opts.container);
    this.mainListItems = $(this.opts.container).find(this.opts.row);
    this.init(this.opts);

    // onReady callback
    if (this.opts.onReady && typeof this.opts.onReady === 'function') {
      this.opts.onReady();
    }

    if (this.opts.onInputChange && typeof this.opts.onInputChange === 'function') {
      this.inputFunction = true;
    }

    if (this.opts.onSearchEmpty && typeof this.opts.onSearchEmpty === 'function') {
      this.onEmptyFunction = true;
    }

    if (this.opts.onSearchNonEmpty && typeof this.opts.onSearchNonEmpty === 'function') {
      this.onNonEmptyFunction = true;
    }

    if (this.opts.onInputCleared && typeof this.opts.onInputCleared === 'function') {
      this.inputClearFunction = true;
    }

    return this;
  }

  SimpleGridFilter.prototype.init = function () {
    this.initSearchInput(this.opts.input);
  }

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  SimpleGridFilter.prototype.debounce = function (func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  };

  SimpleGridFilter.prototype.initSearchInput = function (selector) {
    var self = this;
    var $input = $(selector);

    $input.on('input', this.debounce(onInputEvent, this.opts.debounce) );

    function onInputEvent(e) {
      e.preventDefault();
      if (self.inputFunction) {
        self.opts.onInputChange(e);
      }
      var currVal = $(e.target).val();

      if (self.inputClearFunction && currVal === '') {
        self.opts.onInputCleared(e);
      }

      self.matchGridElements(currVal);
    }
  }

  SimpleGridFilter.prototype.saveGridItems = function() {
    this.mainListItems = this.mainListItems.length ? this.mainListItems : $(this.opts.container).find(this.opts.row);
  }

  SimpleGridFilter.prototype.matchGridElements = function (matcher) {
    var self = this;
    // Get new recollection of table items
    this.saveGridItems();

    var regExMatcher = new RegExp(matcher, this.opts.caseSensitive ? '' : 'i');

    // Build new items based on matching
    var newListItems = self.mainListItems.filter(function(i, el) {
      if ( self.opts.matchContainer.constructor === Array ) {
        var selector = self.opts.matchContainer.join(', ');
        var $els = $(el).find(selector);
        var matches = [];
        $els.each(function(i, el) {
          var originalString = $(el).text().trim();
          var match = originalString.match(regExMatcher);
          if (match) {
            $(el).html( self.highlightMatchedElement(match) );
            matches.push(match);
          } else {
            // If theres no match then clear old matches in fields that don't match anymore
            $(el).html( self.highlightMatchedElement(originalString) );
          }
        });

        return matches.length;
      } else {
        var $el = $(el).find(self.opts.matchContainer);
        var matched = $el.text().trim().match(regExMatcher);
        if (matched) {
          if (self.opts.matchText) {
            $el.find(matchText).html( self.highlightMatchedElement(matched) );
          } else {
            $el.html( self.highlightMatchedElement(matched) );
          }
        }

        return matched;
      }
    });

    if (!newListItems.length) {
      // Callback to empty search
      if (this.onEmptyFunction) {
        this.opts.onSearchEmpty();
      }
    } else {
      // Callback to non-empty search
      if (this.onNonEmptyFunction) {
        this.opts.onSearchNonEmpty();
      }
    }

    this.mainListItems.detach();
    this.mainTable.append(newListItems);
  }

  SimpleGridFilter.prototype.highlightMatchedElement = function (result) {
    if (typeof result === 'string') {
      return result;
    }
    var resMatch = result[0];
    var resLength = result[0].length;
    var resStartIndex = result.index;
    var resString = result.input;
    var wrapTag = this.opts.wrapTag ? this.opts.wrapTag : 'strong';
    return resString.replace(resMatch, '<' + wrapTag + '>' + resMatch + '</' + wrapTag + '>');
  }

  $.SimpleGridFilter = $.fn.SimpleGridFilter = SimpleGridFilter;

})(jQuery);