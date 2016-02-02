var history_map;
var current_marker;
var info_window;

function addOnload(func) 
{ 
    try { 
        window.addEventListener("load", func, false); 
    } catch (e) { 
        // IE用 
        window.attachEvent("onload", func); 
    } 
} 

function loadMap(){

  history_map = new google.maps.Map(
    document.getElementById("history_map"),
    {
      center: (new google.maps.LatLng(35.792621, 139.806513)),
      zoom: 6
    }
  );

}

function loadHistoryMyHistory(){

  var el_history_display_area = document.getElementById("my_history");


}

function addPositionToStorage(latlng, title, caption){
  var storage = localStorage.getItem("my_history_map");

  if(storage == null){
    storage = {};
  }

  console.log("in addPositionToStorage. lat, lng:" + latlng);



}

function addButtonClickEvent(event){
  console.log("in addButtonClickEvent");

  addPositionToStorage(current_marker.getPosition, document.getElementById("info_window_title").value, document.getElementById("info_window_caption").value);
}

function initialize_map(){

  console.log("in initialize map");

  loadMap(); //Mapをロード
  //loadHistoryMyHistory(); //保存した場所情報をロード

  /*
  google.maps.event.addListener(
    history_map,
    "rightclick", function(event) {
      //that.lat_ = event.latLng.lat();
      //that.lng_ = event.latLng.lng();

      //alert(event.latLng.lat() + ", " + event.latLng.lng());

      var str_button_attr = " onClick='addPositionToStorage(" + event.latLng.lat() + ", " + event.latLng.lng() + ")'";
      var str_button_style = " style='width: 100%';";

      var windowOption = {
        position: event.latLng,
        content: "<div class='infoWindowButton'><button class='btn btn-default'" + str_button_attr + str_button_style + ">save</button></div>"
      };

      if(infoWindow == null){
        infoWindow = new google.maps.InfoWindow(windowOption);
      }
      else{
        infoWindow.setOptions(windowOption);
      }

      infoWindow.open(history_map);
  });
  */






/*
  var info_window_content = "<div><input type='text' id='info_window_title'></div>" + 
                            "<div><input type='text' id='info_window_caption'></div>" + 
                            "<button class='btn btn-default' onClick='addButtonClickEvent()'>add!!</button>";

  current_marker = null;
  info_window = null;

  current_marker = new google.maps.Marker({
    map: history_map,
    position: (new google.maps.LatLng(35.792621, 139.806513))
  });

  google.maps.event.addListener(
    history_map,
    "click",
    function(event){
      current_marker.setPosition(event.latLng);
    }
  );
  
  google.maps.event.addListener(
    current_marker,
    "click",
    function(event){
      console.log("marker clicked");

      if(info_window == null){
        info_window = new google.maps.InfoWindow({
          content: info_window_content,
          position: event.latLng
        });
      }
      else{
        info_window.setPosition(event.latLng);
      }

      info_window.open(history_map, current_marker);

    }
  );


  document.getElementById("contents").style.marginTop = document.getElementById("top_navigation").clientHeight;
*/
}

