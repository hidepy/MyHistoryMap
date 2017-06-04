(function(){
    'use strict';

    // map本体のオペを司るservice
    angular.module('MapHandlerService', [])
        .service("MapHandler", function(){
            // クロージャされる
            var map = null;
            var markers = [];
            var mp = google.maps;
            var map_element_selector = "";
            var stored_map_element = null;
            
            var infowindow = new mp.InfoWindow({
                content: "",
                maxWidth: 128
            });

            // 選択中マーカ
            var current_select_marker = -1;

            // constants
            var INFO_TEMPLATE = "<div><h3>%TITLE%</h3><p>%COMMENT%</p><p><a href='%OPEN_GOOGLEMAP%' target='_blank'>GoogleMapで開く</a></p><p><a href='%SEARCH_WITH_GOOGLE%' target='_blank'>この場所について検索する</a></p></div>";
            var DISP_INFOWINDOW = false;
            var DISP_MARKER_NUMBER = true;
            var DISP_MARKER_TITLE = true;

            function pinSymbol(color, line_color) {
                return {
                    path: 'M 0,0 C -2,-20 -10,-22 -10,-30 A 10,10 0 1,1 10,-30 C 10,-22 2,-20 0,0 z M -2,-30 a 2,2 0 1,1 4,0 2,2 0 1,1 -4,0',
                    fillColor: color,
                    fillOpacity: 1,
                    strokeColor: line_color,
                    strokeWeight: 2,
                    scale: 1,
                    labelOrigin: new google.maps.Point(2, 9)
               };
            }

            // check is map loaded
            this.isLoaded = function(){
                return !!map;
            };
            this.loadMap = function(el_map_selector, lat, lng){
                var latlng = new mp.LatLng(!!lat ? lat : 35.9, !!lng ? lng : 138.0);
                map = new mp.Map(angular.element(el_map_selector)[0], {
                      center: latlng,
                      zoom: 7
                    }
                );
                this.map_element_selector = el_map_selector;
            };
            this.storeElement = function(){
                console.log("in storeElement. stored element=");
                this.stored_map_element = angular.element(this.map_element_selector);
                console.log(this.stored_map_element);
            };
            this.restoreElement = function(){
                console.log("in restoreElement. selector, object=");
                angular.element(this.map_element_selector).replaceWith(this.stored_map_element);
                console.log(this.map_element_selector);
                console.log(this.stored_map_element);
            }
            this.update = function(lat, lng, zoom){
                mp.event.trigger(map, "resize");
                if(!!lat && !!lng){
                    map.setCenter(new mp.LatLng(lat, lng));
                }
                if(!!zoom){
                    map.setZoom(zoom);
                }
            };
            this.addMarker = function(item, options, callback){

                // optionsがなければ作っておく
                options = options || {};

                var prefix = "" + options.index + ".";
                var color = options.marker_color || "#FFFFFF";
                var line_color = options.marker_line_color || "#777777";
                var marker_option = {
                    position: new mp.LatLng(item.lat, item.lng),
                    title: item.name,
                    icon: pinSymbol(color, line_color),
                    opacity: (options.marker_opacity || 0.5)
                };
                // markerのlabelオプションが何れかtrueなら
                if(DISP_MARKER_TITLE || DISP_MARKER_NUMBER){
                    marker_option["label"] = {
                        text: (DISP_MARKER_NUMBER ? prefix : "") + (DISP_MARKER_TITLE ? item.name.slice(0, 5) : ""),
                        fontSize: "100%"
                    };
                }
                var mkr = new mp.Marker(marker_option);
                //mkr.setOpacity(0.7);

                mkr.setMap(map);

                // marker click時の色管理
                mp.event.addListener(mkr, "click", function(){

                    // マーカタップ時にinfowindowを表示するか
                    if(DISP_INFOWINDOW){
                        // 表示メッセージを変更
                        infowindow.setContent(
                            INFO_TEMPLATE
                                .replace("%TITLE%", mkr.title)
                                .replace("%COMMENT%", (item.caption || ""))
                                .replace("%OPEN_GOOGLEMAP%", "http://maps.apple.com/?q=" + item.lat + "," + item.lng)
                                .replace("%SEARCH_WITH_GOOGLE%", "https://www.google.co.jp/search?q=" + mkr.title)
                        );
                        
                        // popup open
                        infowindow.open(map, this);
                    }

                    // 選択マーカが変わった場合
                    if(!!options && (options.index >= 0)){
                        if(current_select_marker != options.index){
                        }

                        current_select_marker = options.index;
                    }
                });

                // callback指定あれば
                if(!!callback){
                    mp.event.addListener(mkr, "click", callback);
                }

                markers.push(mkr);
            };
            this.deleteMarkers = function(){
                markers.forEach(function(mkr){
                    mkr.setMap(null);
                });
                markers = [];
            };
        });
})();


/*
Googlemap first load event

google.maps.event.addListenerOnce(map, 'idle', function(){
    // do something only the first time the map is loaded
});
The "idle" event is triggered when the map goes to idle state - everything loaded (or failed to load). I found it to be more reliable then tilesloaded/bounds_changed and using addListenerOnce method the code in the closure is executed the first time "idle" is fired and then the event is detached.
*/