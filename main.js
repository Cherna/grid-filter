
  var $ = require('jquery');


  function load (apiId) {
    $section = $('#api-authorized-clients');

    navbar.setRoute(apiId, $section);
    navbar.setActive(navbar.TABS.AUTHORIZED_CLIENTS, $section);

    toggleLoadingIndicator(true);

    var query = [ResourceServer.getById({ id: apiId}), Clients.findNonGlobal(), ApplicationTypes.findAddons()];

    return Q.all(query).spread(onLoadCompleted, redirectOnError);
  }

  function redirectOnError () {
    router.setRoute('apis');
  }

  function onLoadCompleted (api, clients, addons) {
    if (!api || !api.identifier) {
      redirectOnError();
    }

    // section reference to current API
    currentApi = api;

    $section.find('.section-title').html(api.name);

    applicationClients = removeThirdPartyApps(clients, addons);

    initSearchInput('input.authorize-clients-input');

    $section.find('.create-grant').onf('click', onAuthorizeClient);

    refreshGrid();
  }

  function initSearchInput (selector) {
    var $input = $(selector);

    $input.on('input', _.debounce(onInputEvent, 60) );

    function onInputEvent(e) {
      e.preventDefault();
      var currVal = $(e.target).val();
      onInputChanged(currVal);
    }
  }

  function refreshGrid (matcher) {
    toggleLoadingIndicator(true);

    Grants.getByAudience({ audience: encodeURIComponent(currentApi.identifier) }).then(function (grants) {
      toggleLoadingIndicator(false);
      loadGrid(applicationClients, grants);
    }).fail(function () {
      toggleLoadingIndicator(false);
      timedError({ message: 'There was a problem refreshing the grid. Try again later.' });
    });
  }

  function matchGridElements(matcher) {
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

  function highlightMatchedElement (result) {
    var resMatch = result[0];
    var resLength = result[0].length;
    var resStartIndex = result.index;
    var resString = result.input;
    return resString.replace(resMatch, '<strong>' + resMatch + '</strong>');
  }

  function toggleEmptyNotice (bool, type) {
    var emptyNoticeCont = $('.table-empty-notice-container');
    if (bool) {
      if (!emptyShown) {
        emptyNoticeCont.show();
        emptyShown = !emptyShown;
      }
    } else {
      if (emptyShown) {
        emptyNoticeCont.hide();
        emptyShown = !emptyShown;
      }
    }

    if (type === 'results') {
      emptyNoticeCont.removeClass('no-apps');
      emptyNoticeCont.addClass('results');
    } else {
      emptyNoticeCont.removeClass('results');
      emptyNoticeCont.addClass('no-apps');
    }
  }

  function loadGrid (clients, grants) {
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

  function onInputChanged(string) {
    matchGridElements(string);
  }

  function onAuthorizeClient (e) {
    e.preventDefault();
    var $tar = $(e.target);
    $tar.button('loading');
    var client_id = $tar.closest('.app-item').attr('data-client-id');

    if (!client_id) {
      $tar.find('.authorize-client').button('reset');
      return;
    }

    var payload = {
      audience: currentApi.identifier,
      client_id: client_id,
      scope: []
    };

    Grants.create(payload).fail(onCreateGrantError).done(onAuthorizedClientSuccess);
  }

  function onAuthorizedClientSuccess () {
    // Remove the reference to the Selected Client
    selectedClient = null;
    $section.find('input.authorize-clients-input').val('');

    $section.find('.create-grant').button('reset');
    refreshGrid();
  }

  function onCreateGrantError () {
    $section.find('.create-grant').button('reset');
    timedError({ message: 'There was a problem authorizing the selected client. Try again later.' });
  }

  function onRemoveSuccess () {
    refreshGrid();
  }

  function onRemoveError () {
    timedError({ message: 'There was a problem removing the selected authorized client. Try again later.' });
  }

  function removeThirdPartyApps (clients, addons) {
    var addonsIds = addons.map(function (addons) { return addons.id; });
    var filteredClients = [];

    $.each(clients, function (idx, client) {
      var addonId = Object.keys(client.addons || {})[0];

      if (addonsIds.indexOf(addonId) === -1) { // ignore third party apps
        filteredClients.push(client);
      }
    });

    return filteredClients;
  }

  function processClients(clients, grants) {
    clients.map(function (client) {
      var hasGrant = grants.filter(function(grant) {
        return grant.client_id === client.client_id;
      });
      if (hasGrant.length) {
        client.hasGrant = true;
        client.grant_id = hasGrant[0].id;
      } else {
        client.hasGrant = false;
        client.grant_id = '';
      }
    });
    return clients;
  }

  function onDeleteClientGrant (e) {
    e.preventDefault();

    var grantId = $(e.target).closest('tr').attr('data-grant-id');
    var $popup = $('#confirm-delete-grant', $section);

    $popup.modal('show')
    .find('button.remove-confirm')
    .onf('click', function () {
      var $btn = $(this).button('loading');

      Grants.delete({ id: grantId }).then(onRemoveSuccess, onRemoveError)
      .always(function () {
        $popup.modal('hide');
        $btn.button('reset');
      });
    });
  }

  function toggleLoadingIndicator (shouldDisplay) {
    var $content = $section.find('.content');
    var $spinner = $section.find('.loading-spin');

    $spinner.toggle(shouldDisplay);
    $content.toggle(!shouldDisplay);
  }