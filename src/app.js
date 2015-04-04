var UI = require('ui');
var Vibe = require('ui/vibe');
var ajax = require('ajax');
var Accel = require('ui/accel');
//===============================================CONFIG=================================================================
var user_id = "120";
//var api = 'http://spbbus.pebblenow.ru/api_test.php'; //test api
var api = 'http://spbbus.pebblenow.ru/api.php'; //work api

var locationOptions = {
  enableHighAccuracy: true, 
  maximumAge: 5000, 
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

var mainMenu = new UI.Menu({
  sections: [{
    title: 'SPB BUS',
    items: menuItems
  },{
    title: 'Favorite stops' 
  }
]
});

var updateFavorites = function() {
  var favoriteItems = [];
  //console.log("Length = " + favoriteIds.length);
  var favoriteIds = JSON.parse(localStorage.getItem("favoriteIds"));
  if (favoriteIds !== null) {
    for (var i = 0; i<favoriteIds.length; i++) {
      favoriteItems.push(JSON.parse(localStorage.getItem(favoriteIds[i])));
      //console.log("Item #" + favoriteIds[i] + " is: " + JSON.parse(localStorage.getItem(favoriteIds[i])));
     // console.log(favoriteItems[favoriteIds[i]]);
    }
  }
  mainMenu.items(1,  favoriteItems);
};

var card = new UI.Card({
 // title:'Wait',
 // subtitle:'Working...'
  banner: 'images/update.png'
});

var addtof = new UI.Card({
  banner: 'images/add.png'
});

addtof.on('click', 'back', function() {
  updateFavorites();
  addtof.hide();
});

var remfromf = new UI.Card({
  banner: 'images/remove.png'
});

remfromf.on('click', 'back', function() {
  updateFavorites();
  remfromf.hide();
});

var gpscard = new UI.Card({
  //title:'Wait',
  //subtitle:'Finding your location...'
  banner: 'images/location.png'
});

mainMenu.on('select', function(e) {
  //console.log('Select item:' + e.itemIndex);
  //console.log('Select section:' + e.sectionIndex);
  if (e.sectionIndex === 0) {
          gpscard.show();
          navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);
  }
  else {
    //console.log('Stop item id:' + e.item.id);
      var stopid = e.item.id;
      card.show();
      get_stop(stopid);
  }
});

mainMenu.on('longSelect', function(e) {
  if (e.sectionIndex === 1) {
    //console.log('Remove item stop:' + e.item.id);
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

updateFavorites();
mainMenu.show();
Accel.init();
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
//    var lat = data.stops[i].lat;
//    var lon = data.stops[i].lon;
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
      var itemsStops = parseStops(data, data.count);  
      var menuStops = new UI.Menu({
        sections: [{
          title: 'Nearest stops',
          items: itemsStops
        }]
      });    
      menuStops.show();
      Vibe.vibrate('short');
      card.hide();
      menuStops.on('select', function(e) {
        var stopid = e.item.id;
        card.show();
        get_stop(stopid);
      });
      menuStops.on('longSelect', function(e) {
        //var stopid = e.item.id;
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
       // console.log("Save item " + e.item.id + ": "+ e.item.title + " " + e.item.subtitle);
        addtof.show();
      });
    },
    function(error) {
      card.hide();
   //   console.log('Download failed: ' + error);
    }
  );
}
//Get Stop Transport forecast
function get_stop(stopid) {    
        card.show();
        ajax(
          {
            url: api + '?stopid=' + stopid,
            type:'json'
          },
          function(data) {
            var itemsTrans = parseTrans(data, data.count);
            var menuTrans = new UI.Menu({
              sections: [{
                title: 'Arriving transport',
                items: itemsTrans
              }]
            });
            menuTrans.on('longSelect', function(e) {
              card.show();
              ajax(
                {
                  url: api + '?stopid=' + stopid,
                  type:'json'
                },
                function(data) {
                  itemsTrans = parseTrans(data, data.count);
                  menuTrans.items(0,itemsTrans);
                  Vibe.vibrate('short');
                  card.hide();
                });
            });
            menuTrans.show();
            card.hide();
            Vibe.vibrate('short');
        },
        function(error) {
          card.hide();
     //     console.log('Download failed: ' + error);
        }
      );
}
//Get coordinates successfully
function locationSuccess(pos) {
  gpscard.hide();
  get_nearest_stops(pos.coords.latitude, pos.coords.longitude);
  //console.log('lat= ' + pos.coords.latitude + ' lon= ' + pos.coords.longitude + ' accuracy= ' + pos.coords.accuracy );
}
//Get coordinates failed
function locationError(err) {
  gpscard.hide();
  //console.log('location error (' + err.code + '): ' + err.message);
}
//======================================================================================================================