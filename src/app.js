var UI = require('ui');
var Vibe = require('ui/vibe');
var ajax = require('ajax');
var Settings = require('settings');
//===============================================CONFIG=================================================================
var user_id = "120";
//var api = 'http://spbbus.pebblenow.ru/api_test.php'; //test api
var api = 'http://spbbus.pebblenow.ru/api.php'; //work api

var locationOptions = {
  enableHighAccuracy: true, 
  maximumAge: 0, 
  timeout: 10000
};
//======================================================================================================================
//===================================================UI=================================================================
var menuItems = [
  {
    title: "Use my Location",
    subtitle: "Find nearest stops!"
  },
];

var remfromf = new UI.Card({
  banner: 'images/remove.png'
});

var gpscard = new UI.Card({
  banner: 'images/location.png'
});

var mainMenu = new UI.Menu({
  sections: [{
    items: menuItems
  },{
    title: 'Favorite stops' 
  }
]
});

var card = new UI.Card({
  banner: 'images/update.png'
});

var addtof = new UI.Card({
  banner: 'images/add.png'
});

var menuStops = new UI.Menu({
  sections: [{
    title: 'Nearest stops',
    items: []
  }]
});

var menuTrans = new UI.Menu({
  sections: [{
    title: 'Arriving transport',
    items: []
  }]
});

var updateFavorites = function() {
  var favoriteItems = [];
  var favoriteIds = JSON.parse(localStorage.getItem("favoriteIds"));
  if (favoriteIds !== null) {
    for (var i = 0; i<favoriteIds.length; i++) {
      favoriteItems.push(JSON.parse(localStorage.getItem(favoriteIds[i])));
    }
  }
  mainMenu.items(1,  favoriteItems);
};

mainMenu.on('click','back',function() {
  mainMenu.hide();
});

mainMenu.on('select', function(e) {
  if (e.sectionIndex === 0) {
          gpscard.show();
          navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);
  }
  else {
      get_stop(e.item.id);
  }
});

mainMenu.on('longSelect', function(e) {
  if (e.sectionIndex === 1) {
    var favoriteIds = JSON.parse(localStorage.getItem("favoriteIds"));
    if (favoriteIds !== null) {
      var index = favoriteIds.indexOf(e.item.id);
      if (index > -1) {
        favoriteIds.splice(index, 1);
      }
      localStorage.setItem("favoriteIds", JSON.stringify(favoriteIds));
      localStorage.removeItem(e.item.id);
      remfromf.show();
    }
  }
});

remfromf.on('click', 'back', function() {
  updateFavorites();
  remfromf.hide();
});

remfromf.on('click', 'select', function() {
  updateFavorites();
  remfromf.hide();
});


addtof.on('click', 'back', function() {
  updateFavorites();
  addtof.hide();
});

addtof.on('click', 'select', function() {
  updateFavorites();
  addtof.hide();
});

menuStops.on('select', function(e) {
  get_stop(e.item.id);
});

menuStops.on('click','back',function() {
  menuStops.hide();
});

menuStops.on('longSelect', function(e) {
  var favoriteIds = JSON.parse(localStorage.getItem(("favoriteIds")));
  if (favoriteIds !== null) {
    var index = favoriteIds.indexOf(e.item.id);
    if (index < 0)
      favoriteIds.push(e.item.id);
  }
  else {
    favoriteIds = [];
    favoriteIds.push(e.item.id);
  }
  localStorage.setItem("favoriteIds", JSON.stringify(favoriteIds));
  localStorage.setItem(e.item.id, JSON.stringify({id:e.item.id, title:e.item.title, subtitle:e.item.subtitle}));
  addtof.show();
});

menuTrans.on('click','back',function() {
  menuTrans.hide();
});

menuTrans.on('longSelect', function(e) {
  get_stop();
});

updateFavorites();
mainMenu.show();
//======================================================================================================================
//===============================================LOGIC==================================================================

//Make array of Transport Items
var parseTrans = function(data, quantity) {
  var items = [];
  for(var i = 0; i < quantity; i++) {
    var id = data.trans[i].id;
    var number = data.trans[i].number;
    var remain = data.trans[i].remain;
    items.push({
      id:id,
      title:number,
      subtitle:remain
    });
  }
  return items;
};

//Make array of Stops Items
var parseStops = function(data, quantity) {
  var items = [];
  for(var i = 0; i < quantity; i++) {
    var id = data.stops[i].id;
    var name = data.stops[i].name;
    var type = data.stops[i].type;
    var distance = data.stops[i].distance;
    items.push({
      id:id,
      title:name,
      subtitle:type + ' ' + Math.round(distance) + 'm'
    });
  }
  return items;
};

// Get nearest stops near lat, lon coordinates
function get_nearest_stops(lat, lon) {
  card.show();
  ajax(
    {
      url: api + '?user_id=' + user_id + '&lat=' + lat + '&lon=' + lon,
      type:'json'
    },
    function(data) {
      menuStops.items(0,parseStops(data, data.count));
      menuStops.show();
      Vibe.vibrate('short');
      card.hide();
    },
    function(error) {
      card.hide();
    }
  );
}
//Get Stop Transport forecast
function get_stop(stopid) { 
  if (stopid)
    Settings.data('stopid', stopid);
  else
    stopid = Settings.data('stopid');
  card.show();
  ajax(
    {
      url: api + '?stopid=' + stopid + '&user_id=' + user_id,
      type:'json'
    },
    function(data) {
      menuTrans.items(0,parseTrans(data, data.count));
      menuTrans.show();
      card.hide();
      Vibe.vibrate('short');
    },
    function(error) {
      card.hide();
    }
  );
}
//Get coordinates successfully
function locationSuccess(pos) {
  gpscard.hide();
  get_nearest_stops(pos.coords.latitude, pos.coords.longitude);
}
//Get coordinates failed
function locationError(err) {
  gpscard.hide();
}
//======================================================================================================================