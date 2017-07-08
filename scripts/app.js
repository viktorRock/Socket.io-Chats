var uid = "89123891231239"; // Dummy global id variable
var token = "eo4Dr8qhrFY";
var shubAPIURL = "https://storage.scrapinghub.com/items/158119/1/143?apikey=a1690d124fb0421eb1cdba5a979fd9fc&format=json";

(function () {
  'use strict';

  var injectedForecast = {
    key: 'Beer',
    label: 'Beer',
    

  };

  var weatherAPIUrlBase = 'https://publicdata-weather.firebaseio.com/';

  var app = {
    hasRequestPeding: false,
    isLoading: true,
    visibleCards: {},
    selectedAPIs: [],
    spinner: document.querySelector('.loader'),
    cardTemplate: document.querySelector('.cardTemplate'),
    container: document.querySelector('.main'),
    addDialog: document.querySelector('.dialog-container'),
  };

  /*****************************************************************************
   *
   * Event listeners for UI elements
   *
   ****************************************************************************/

   /* Event listener for refresh button */
   document.getElementById('butRefresh').addEventListener('click', function () {
    // console.log('getElementById - butRefresh');
    app.updateForecasts();
  });

   /* Event listener for Clear button */
   document.getElementById('butClear').addEventListener('click', function () {
    // console.log('getElementById - butClear');
    localforage.clear();
    app.selectedAPIs = [];
    app.visibleCards = {};
    app.updateForecastCard(injectedForecast);
    location.reload();
  });

   /* Event listener for add new city button */
   document.getElementById('butAdd').addEventListener('click', function () {
    // Open/show the add new city dialog
    // console.log('getElementById - butAdd');
    app.toggleAddDialog(true);
  });

   /* Event listener for add city button in add city dialog */
   document.getElementById('butAddItem').addEventListener('click', function () {
    // console.log('getElementById - butAddCity');
    var select = document.getElementById('selectItem');
    var selected = select.options[select.selectedIndex];
    var key = selected.value;
    var label = selected.textContent;
    app.getChatBotAPIResponse(key, label);
    app.selectedAPIs.push({
      key: key,
      label: label
    });
    app.toggleAddDialog(false);
    app.saveSelectedCities();

  });

   /* Event listener for cancel button in add city dialog */
   document.getElementById('butAddCancel').addEventListener('click', function () {
    app.toggleAddDialog(false);
  });

  /*****************************************************************************
   *
   * Methods to update/refresh the UI
   *
   ****************************************************************************/

  // Toggles the visibility of the add new city dialog.
  app.toggleAddDialog = function (visible) {
    if (visible) {
      app.addDialog.classList.add('dialog-container--visible');
    } else {
      app.addDialog.classList.remove('dialog-container--visible');
    }
  };

  // Updates a weather card with the latest weather forecast. If the card
  // doesn't already exist, it's cloned from the template.
  app.updateMessageCard = function (data) {
    // console.log('updateForecastCard');
    if(data != null){
      var card = app.visibleCards[data.key];
      var key = data.key;
    }

    if (!card) {
      key = "1" //Default
      card = app.cardTemplate.cloneNode(true);
      card.removeAttribute('hidden');
      app.container.appendChild(card);
      app.visibleCards[key] = card;
      card.querySelector('.date').textContent = new Date().toISOString().replace('T', ' ').replace(/\..*$/, '');
    }

    if (app.isLoading) {
      app.spinner.setAttribute('hidden', true);
      app.container.removeAttribute('hidden');
      app.isLoading = false;
    }
  };

  /*****************************************************************************
   *
   * Methods for dealing with the model
   *
   ****************************************************************************/

  // Gets a forecast for a specific city and update the card with the data
  //Cash Then Network method
  app.getChatBotAPIResponse = function (key, label) {
     // console.log('getChatBotAPIResponse');
    // console.log('label = ' + label);
    // var url = weatherAPIUrlBase + key + '.json';
    var url = shubAPIURL

    //first getting from Cache
    if ('caches' in window) {
      caches.match(url).then(function (response) {
        if (response) {
          response.json().then(function (json) {
            // Only update if the XHR is still pending, otherwise the XHR was already returned
            if (app.hasRequestPeding) {
             app.updateMessageCard(json);
             console.log('update from cache: ' + new Date().toISOString().replace('T', ' ').replace(/\..*$/, ''));
           }
         });
        }
      });
    }

    // Make the XHR to get the data, then update the card
    app.hasRequestPeding = true;
    var request = new XMLHttpRequest();
    request.onreadystatechange = function () {
      if (request.readyState === XMLHttpRequest.DONE) {
       if (request.status === 200) {
        var response = JSON.parse(request.response);
        response.key = key;
        response.label = label;
        app.hasRequestPeding = false;
        app.updateMessageCard(response);
        console.log('update from XHR: ' + new Date().toISOString().replace('T', ' ').replace(/\..*$/, ''));
      }
    }
  };
  request.open('GET', url);
  request.send();
};

  // Iterate all of the cards and attempt to get the latest forecast data
  app.updateAllMessagesCards = function () {
    // console.log('updateAllMessagesCards');
    var keys = Object.keys(app.visibleCards);
    keys.forEach(function (key) {
      app.getChatBotAPIResponse(key)
      var card = app.visibleCards[key];
      card.querySelector('.date').textContent = new Date();
      //console.log('textContent = ' + card.querySelector('.location').textContent);

    });
  };

  app.saveSelectedAPIs = function () {
    window.localforage.setItem('selectedAPIs', app.selectedAPIs).then(function (value) {
      // console.log('Promises - localforage.setItem(selectedAPIs');
      // console.log('SelectedCities = ' + app.selectedCities);
    }).catch (function (err) {
      console.log(err);
    });
  }

  window.addEventListener('beforeinstallprompt', function (e) {
    e.userChoice.then(function (choiceResult) {
      console.log(choiceResult.outcome);
      if (choiceResult.outcome == 'dismissed') {
        console.log('User cancelled home screen install');
      } else {
        console.log('User added to home screen');
      }
    });
  });
  document.addEventListener('DOMContentLoaded', function () {
    window.localforage.getItem('selectedAPIs').then(function (retrievedItems) {
       // console.log('Promises - localforage.getItem(selectedCities)');
       // console.log(retrievedItems)
      if (retrievedItems == null) {
        // console.log('empty SelectedCities')
        app.updateAllMessagesCards(injectedForecast);
        app.selectedAPIs.push(injectedForecast);
        app.saveSelectedAPIs();
      } else {
        app.selectedAPIs = retrievedItems
        app.selectedAPIs.forEach(function (data) {
          app.getChatBotAPIResponse(data.key, data.label)
        })
      }
    });
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
    .register('/service-worker.js')
    .then(function() { 
        // console.log('Service Worker Registered'); 
      });
  }

})();
