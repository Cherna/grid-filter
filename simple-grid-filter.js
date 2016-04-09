// To do:
// - Filter more times with more inputs: First by name and then by occupation, for example
// - Add ignore symbols. For example, ignore '-' for a particular selector
// - Add built-in support for empty search notice ( { template: HTML string or node } )

/*
 * Testing tips:
 *  - Input filter and all events work.
 *  - If theres a form passed, it doesn't submit.
 *  - If SPA leave section then come back and make sure:
 *    - A) The input is blank,
 *    - B) The onInputChange event hasn't been bound twice.
 */

function SimpleGridFilter (options) {

  var defaults = {
    'debounce': 60
  }

  this.opts = this.extend(defaults, options);

  if (!this.opts.input) {
    console.error('You need to specify an input selector.');
  } else if (!this.opts.container) {
    console.error('You need to specify a container selector.');
  } else if (!this.opts.row) {
    console.error('You need to specify a row selector.');
  } else if (!this.opts.matchContainer) {
    console.error('You need to specify a match container selector.');
  }

  this.opts.container = this.opts.container;
  this.mainTable = document.getElementById(this.opts.container);
  if (this.mainTable === null && !this.mainTable) {
    console.error('No table markup available');
  }
  this.mainListItems = this.makeArray( this.mainTable.querySelectorAll(this.opts.row) );
  this.init(this.opts);

  
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
  // To-do: Enable multiple inputs to multi-filter
  // console.log(this.opts.input.constructor);
  // if (this.opts.input.constructor === Array) {}
  this.checkForBindFn();
  this.initSearchInput(this.opts.input);
}

/*
 *  Helper functions
 */

SimpleGridFilter.prototype.checkForBindFn = function () {
  if (!Function.prototype.bind) {
    Function.prototype.bind = function(oThis) {
      if (typeof this !== 'function') {
        // closest thing possible to the ECMAScript 5
        // internal IsCallable function
        throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
      }

      var aArgs   = Array.prototype.slice.call(arguments, 1),
          fToBind = this,
          fNOP    = function() {},
          fBound  = function() {
            return fToBind.apply(this instanceof fNOP && oThis
                   ? this
                   : oThis,
                   aArgs.concat(Array.prototype.slice.call(arguments)));
          };

      fNOP.prototype = this.prototype;
      fBound.prototype = new fNOP();

      return fBound;
    };
  }
}

SimpleGridFilter.prototype.extend = function (out) {
  out = out || {};

  for (var i = 1; i < arguments.length; i++) {
    if (!arguments[i])
      continue;

    for (var key in arguments[i]) {
      if (arguments[i].hasOwnProperty(key))
        out[key] = arguments[i][key];
    }
  }

  return out;
};

SimpleGridFilter.prototype.replaceWithClone = function (node) {
  var oldElement = node;
  var newElement = oldElement.cloneNode(true);
  oldElement.parentNode.replaceChild(newElement, oldElement);
  return newElement;
}

SimpleGridFilter.prototype.makeArray = function (nonArr) {
  return [].slice.call(nonArr);
}

SimpleGridFilter.prototype.showEl = function (el) {
  if (!el) return false;

  el.style.display = el.getAttribute('data-original-display') === 'no-display' ? '' : el.getAttribute('data-original-display');
  el.removeAttribute('data-hidden');
}

SimpleGridFilter.prototype.hideEl = function (el) {
  if (!el) return false;

  if ( !el.getAttribute('data-original-display') ) {
    el.setAttribute('data-original-display', el.style.display ? el.style.display : 'no-display');
  }
  el.style.display = 'none';
  el.setAttribute('data-hidden', true);
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
  var input = document.querySelector(selector);

  if (!input) {
    console.error('No input markup to work with');
    return;
  }

  // To-do: Save previous handlers in some way
  // We need to make sure we're not binding the event more than once
  // so we replace the node with a clone to remove all its listeners
  input = this.replaceWithClone(input);

  input.value = '';

  // We need to bind the context to keep the this throughout the handler
  input.addEventListener('input', this.debounce(this.onInputEvent, this.opts.debounce).bind(this), false);

  if (this.opts.formSelector) {
    this.containerForm = document.querySelector(this.opts.formSelector);

    this.containerForm.addEventListener('submit', function(e) {
      console.log('input trying to submit');
      e.preventDefault();
    })
  }
}

SimpleGridFilter.prototype.onInputEvent = function (e) {
  e.preventDefault();
  var currVal = e.target.value;

  // Trigger onInputChange fn
  if (this.inputFunction) {
    this.opts.onInputChange(currVal, e);
  }
  // Trigger onInputCleared fn
  if (this.inputClearFunction && currVal === '') {
    this.opts.onInputCleared(currVal, e);
  }

  this.matchGridElements(currVal);
}

SimpleGridFilter.prototype.saveGridItems = function() {
  this.mainListItems = this.mainListItems.length ? this.mainListItems : this.makeArray( this.mainTable.querySelectorAll(this.opts.row) );
}

SimpleGridFilter.prototype.matchGridElements = function (matcher) {
  var self = this;
  // Refresh collection of table items
  this.saveGridItems();

  // Catch exceptions in case user inputs special caracters ('\', '^')
  try {
    var newRegEx = new RegExp(matcher);
  } catch (ex) {
    return false;
  }

  this.regExMatcher = new RegExp(matcher, this.opts.caseSensitive ? '' : 'i');
  var newListItems;
  // Build new items based on matching
  if ( self.opts.matchContainer.constructor === Array ) {
    var selector = self.opts.matchContainer.join(', ');
    newListItems = self.mainListItems.filter(function(el) {
      return self.matchForArrays(el, selector);
    });
  } else {
    newListItems = self.mainListItems.filter(function(el) {
      return self.matchForElement(el);
    });
  }

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

  // Set a flag on all items to show next
  newListItems.forEach(function(el) {
    el.setAttribute('data-to-show', true);
  });

  // Hide everything, filter by flagged items and show them
  this.mainListItems.filter(function(el) {
    self.hideEl(el);
    return el.getAttribute('data-to-show');
  }).forEach(function(el) {
    el.removeAttribute('data-to-show');
    self.showEl(el);
  });
}

SimpleGridFilter.prototype.matchForArrays = function (element, selector) {
  var self = this;
  var els = this.makeArray( element.querySelectorAll(selector) );
  var matches = [];
  els.forEach(function(el) {
    var originalString = el.textContent.trim();
    var match = originalString.match(self.regExMatcher);
    if (match) {
      el.innerHTML = self.highlightMatchedElement(match);
      matches.push(match);
    } else {
      // If theres no match then clear old matches in fields that don't match anymore
      el.innerHTML = self.highlightMatchedElement(originalString);
    }
  });
  return matches.length;
}

SimpleGridFilter.prototype.matchForElement = function (element) {
  var self = this;
  var thisEl = element.querySelector(self.opts.matchContainer);
  var matched = thisEl.textContent.trim().match(self.regExMatcher);
  if (matched) {
    thisEl.innerHTML = self.highlightMatchedElement(matched);
  }
  return matched;
}

SimpleGridFilter.prototype.highlightMatchedElement = function (result) {
  // Unless the result is actually an regex result array, return
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