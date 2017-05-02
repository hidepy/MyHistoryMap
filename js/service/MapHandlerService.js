(function(){
    'use strict';

    // map本体のオペを司るservice
    angular.module('MapHandlerService', [])
        .service("MapHandler", function(){
            // クロージャされる
            var map = {};
            var markers = [];
            var DISP_INFOWINDOW = false;
            var mp = google.maps;
            
            var infowindow = new mp.InfoWindow({
                content: "",
                maxWidth: 128
            });
            var INFO_TEMPLATE = "<div><h3>%TITLE%</h3><p>%COMMENT%</p><p><a href='%OPEN_GOOGLEMAP%' target='_blank'>GoogleMapで開く</a></p><p><a href='%SEARCH_WITH_GOOGLE%' target='_blank'>この場所について検索する</a></p></div>";

            // 選択中マーカ
            var current_select_marker = -1;

            this.loadMap = function(el_map){
                map = new mp.Map(el_map, {
                      center: (new mp.LatLng(35.792621, 138.506513)),
                      zoom: 8
                    }
                );
            };
            this.update = function(){
                mp.event.trigger(map, "resize");
            };
            this.addMarker = function(item, options, callback){
                var mkr = new mp.Marker({
                    position: new mp.LatLng(item.lat, item.lng),
                    title: item.name
                });

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
