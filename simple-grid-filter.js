// To do:
// - Filter more times with more inputs: First by name and then by occupation, for example
// - Add ignore symbols. For example, ignore '-' for a particular selector
// - Cambiar funcionalidad por la siguiente: En vez de sacar y meter elementos, mostrarlos y esconderlos,
// usando regex para matchear sus data-values (que se pueden setear al cargar la tabla). Usar una clase para
// mostrarlos y esconderlos.

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

  this.opts.container = '#' + this.opts.container;
  this.mainTable = document.querySelectorAll(this.opts.container)[0];
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
  // console.log(this.opts.input.constructor);
  // if (this.opts.input.constructor === Array) {}
  this.initSearchInput(this.opts.input);
}

/*
 *  Helper functions
 */

SimpleGridFilter.prototype.extend = function(out) {
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

SimpleGridFilter.prototype.makeArray = function (nonArr) {
  return [].slice.call(nonArr);
}

SimpleGridFilter.prototype.showEl = function (el) {
  if (!el) return false;

  el.style.display = el.getAttribute('data-original-display') === 'no-display' ? '' : el.getAttribute('data-original-display');
}

SimpleGridFilter.prototype.hideEl = function (el) {
  if (!el) return false;

  if ( !el.getAttribute('data-original-display') ) {
    el.setAttribute('data-original-display', el.style.display ? el.style.display : 'no-display');
  }
  el.style.display = 'none';
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
  var input = document.querySelector(selector);

  input.addEventListener('input', this.debounce(onInputEvent, this.opts.debounce) );

  function onInputEvent(e) {
    e.preventDefault();
    if (self.inputFunction) {
      self.opts.onInputChange(e);
    }
    var currVal = e.target.value;

    if (self.inputClearFunction && currVal === '') {
      self.opts.onInputCleared(e);
    }

    self.matchGridElements(currVal);
  }
}

SimpleGridFilter.prototype.saveGridItems = function() {
  this.mainListItems = this.mainListItems.length ? this.mainListItems : this.makeArray( this.mainTable.querySelectorAll(this.opts.row) );
}

SimpleGridFilter.prototype.matchGridElements = function (matcher) {
  var self = this;
  // Get new recollection of table items
  this.saveGridItems();

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

  newListItems.forEach(function(el) {
    el.setAttribute('data-to-show', true);
  });

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
  var els = element.querySelectorAll(selector);
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
    if (self.opts.matchText) {
      thisEl.find(matchText).innerHTML = self.highlightMatchedElement(matched);
    } else {
      thisEl.innerHTML = self.highlightMatchedElement(matched);
    }
  }
  return matched;
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