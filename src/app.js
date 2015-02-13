var UI = require('ui');
var ajax = require('ajax');
var Vibe = require('ui/vibe');

var user_id = "100";
var api = 'http://spbbus.pebblenow.ru/api_test.php'; //test api
//var api = 'http://spbbus.pebblenow.ru/api.php'; //work api

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
      title:type + ' ' + Math.round(distance) + 'm',
      subtitle:name
    });
  }
  return items;
};

var card = new UI.Card({
  title:'Wait',
  subtitle:'Working...'
});

var gpscard = new UI.Card({
  title:'Wait',
  subtitle:'Finding your location...'
});

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
    },
    function(error) {
      card.hide();
      console.log('Download failed: ' + error);
    }
  );
}

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
            menuTrans.show();
            card.hide();
            Vibe.vibrate('short');
        },
        function(error) {
          card.hide();
          console.log('Download failed: ' + error);
        }
      );
}
var locationOptions = {
  enableHighAccuracy: true, 
  maximumAge: 5000, 
  timeout: 10000
};

function locationSuccess(pos) {
  gpscard.hide();
  get_nearest_stops(pos.coords.latitude, pos.coords.longitude);
  //console.log('lat= ' + pos.coords.latitude + ' lon= ' + pos.coords.longitude + ' accuracy= ' + pos.coords.accuracy );
}

function locationError(err) {
  gpscard.hide();
  //console.log('location error (' + err.code + '): ' + err.message);
}

var menuItems = [
  {
    title: "Go",
    subtitle: "Find stops!"
  },
];

var mainMenu = new UI.Menu({
  sections: [{
    title: 'SPB BUS',
    items: menuItems
  }]
});

mainMenu.on('select', function(e) {
  switch(e.itemIndex) {
      case 0:
          
          break;
  }
});

//mainMenu.show();
//Accel.init();

gpscard.show();
navigator.geolocation.getCurrentPosition(locationSuccess, locationError, locationOptions);