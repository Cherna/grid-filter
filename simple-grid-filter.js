(function($) {

  function SimpleGridFilter (options) {

    var defaults = {
      'debounce': 60
    }

    this.opts = $.extend(defaults, options);

    console.log(this.opts);

    this.mainTable = $(this.opts.container);
    this.mainListItems = $(this.opts.container).find(this.opts.row);
    this.init(this.opts);

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
    if (!selector) return;
    var $input = $(selector);

    $input.on('input', this.debounce(onInputEvent, this.opts.debounce) );

    function onInputEvent(e) {
      e.preventDefault();
      var currVal = $(e.target).val();
      self.matchGridElements(currVal);
    }
  }

  SimpleGridFilter.prototype.saveGridItems = function() {
    this.mainListItems = this.mainListItems.length ? this.mainListItems : $(this.opts.container).find(this.opts.row);
  }

  SimpleGridFilter.prototype.matchGridElements = function (matcher) {
    var self = this;
    this.saveGridItems();
    var regExMatcher = new RegExp(matcher, 'i');
    var newListItems = self.mainListItems.filter(function(i, el) {
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
    });
    if (!newListItems.length) {
      // Callback to empty search
    } else {
      // Callback to non-empty search
    }
    this.mainListItems.detach();
    this.mainTable.append(newListItems);
  }

  SimpleGridFilter.prototype.highlightMatchedElement = function (result) {
    var resMatch = result[0];
    var resLength = result[0].length;
    var resStartIndex = result.index;
    var resString = result.input;
    return resString.replace(resMatch, '<strong>' + resMatch + '</strong>');
  }

  SimpleGridFilter.prototype.loadGrid = function () {
    
  }

  $.SimpleGridFilter = $.fn.SimpleGridFilter = SimpleGridFilter;

})(jQuery);