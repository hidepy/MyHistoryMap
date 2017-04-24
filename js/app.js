(function(){
    'use strict';

    var mp = google.maps;

    // load event
    document.addEventListener("DOMContentLoaded", function(){
        // 本来は、angularの世界なんでservice化すべきとも思うが...angular以外でも使い回ししたいんで
        window.StorageManager_Fav = new StorageManager("MHM-Favorite");

        window.CommonFunctions = {
            formatDate: function(date){
                return ("" + date.getFullYear() + ("00" + (date.getMonth() + 1)).slice(-2) + ("00" + date.getDate()).slice(-2) + ("00" + date.getHours()).slice(-2) + ("00" + date.getMinutes()).slice(-2) + ("00" + date.getSeconds()).slice(-2) );
            }
        };

        document.getElementById("history_map").style.height = window.innerHeight * (45.0 / 100.0);
    });


    var module = angular.module('app', []);

    module.controller('AppController', function($scope, MapPointDataAdapter, MapHandler) {

        $scope.selected_item = {};
        $scope.items = [];
        $scope.pref_list = [                                                            "北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島", "茨城", "栃木", "群馬", "埼玉", "千葉", "東京", "神奈川", "新潟", "富山", "石川", "福井", "山梨", "長野", "岐阜", "静岡", "愛知", "三重", "滋賀", "京都", "大阪", "兵庫", "奈良", "和歌山", "鳥取", "島根", "岡山", "広島", "山口", "徳島", "香川", "愛媛", "高知", "福岡", "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島", "沖縄"];
        $scope.selected_pref = [];
        $scope.order_list = [
            {id: "", name: "default"},
            {id: "o_rec-d", name: "recommend"},
            {id: "o_new-d", name: "newer-desc"},
            {id: "o_new-a", name: "newer-asc"},
            {id: "o_cro-d", name: "crowdness-desc"},
            {id: "o_cro-a", name: "crowdness-asc"},
            {id: "o_acc-d", name: "accessibility-desc"},
            {id: "o_acc-a", name: "accessibility-asc"}
        ];
        $scope.selected_order = "";

        // admin権限と判断するキーをURLから取得
        var tasokoriadmin_key = (function(){
            var target = location.search.substring(1).split('&').filter(function(v){
                var splitted_v = v.split("=");
                return splitted_v[0] == "imtasokoriadmin";
            });
            if(target.length == 1){
                var splitted_str = target[0].split("=");
                return splitted_str.length == 2 ? splitted_str[1] : "";
            }
        })();

        /* ---------- Local Functions ---------- */
        // card 又は markerのclick時動作を1本化
        var selectItem = function(index){
            $scope.selected_item = $scope.items[index];
            // サムネイルの1件目を選択
            $scope.selectThumbnailImg(0);
        };



        /* ---------- Angular scope Functions ---------- */
        // Start 押下時
        $scope.pushStart = function(){
            // ヘッダをしまってMapを再描画(表示されないんで)
            jQuery("#header > .container").hide(300 , function(){
                jQuery("#header").remove();

                MapHandler.update();
            });

            // 各要素を表示状態に
            ["#top_navigation", "#search_condition_wrapper", "#map_detailarea_wrapper", "#cards_wrapper"].forEach(function(v){
                jQuery(v).show(100);
            });

            // 初期化
            MapHandler.loadMap(document.getElementById("history_map"));

            // point dataを問合せ
            $scope.updateMapPoints();
        };

        // favに入っているかをチェック
        $scope.isAlreadyFav = function(item){
            return !!StorageManager_Fav.get(item.id);
        };

        // 全件markerを削除
        $scope.deleteAllMarkers = function(){
            MapHandler.deleteMarkers();
        };

        // 全件markerを追加
        $scope.addAllMarkers = function(){
            $scope.items.forEach(function(item, i){
                $scope.addMarker(i);
            });
        };

        // markerをセット
        $scope.addMarker = function(index){
            // indexをクロージャする...
            var ClickItem = function(){
                // ここは苦しい...クロージャでいいらしいけど...メモリリークが気になる
                // 変更を反映させる
                $scope.$apply(function(){
                    //$scope.selected_item = $scope.items[index];
                    selectItem(index);
                });
            };

            // Markerを追加
            MapHandler.addMarker($scope.items[index], {index: index}, ClickItem);
        };

        $scope.selectCard = function(index){
            // 選択明細カードを更新
            //var item = $scope.items[index];
            //$scope.selected_item = item;

            selectItem(index);

            // card選択でdetail部分に移動
            jQuery("body").animate({
                scrollTop: jQuery("#detail").offset().top - 8,
            }, 200);
        };

        $scope.add2Favorite = function(index){
            var item = $scope.items[index];

            if(item && item.id){
                window.StorageManager_Fav.set(item.id, {
                    id: item.id,
                    name: item.name,
                    datetime: CommonFunctions.formatDate(new Date())
                });
            }
        };

        // thumbnail 選択時
        $scope.selectThumbnailImg = function(index){
            if(index <  $scope.selected_item.images.length){
                var thumb_item = $scope.selected_item.images[index];
                $scope.selected_item.image_url = thumb_item;
            }
        };

        // 現在のpointitemsから全件描画する
        $scope.updateMapPoints = function(){
            // 選択中を削除
            $scope.selected_item = {};
            // 一旦削除
            $scope.deleteAllMarkers();
            // 検索&描画
            $scope.searchPoint(function(){
                // callbackのは受け取らないで$scopeからitemsを拾う
                $scope.addAllMarkers();
            });
        };

        // point dataを検索する
        $scope.searchPoint = function(callback){

            var param = {};

            // where句のprefに関する絞込条件を設定
            if($scope.selected_pref && ($scope.selected_pref.length > 0)){
                param["w_pref"] = $scope.selected_pref.join("_");
            }

            // order by句のパラメータを設定
            if(!!$scope.selected_order){
                param["order"] = $scope.selected_order;
            }

            // adminキーをセット
            if(!!tasokoriadmin_key){
                param["adminkey"] = tasokoriadmin_key;
            }

            // レコード取得
            MapPointDataAdapter.getData(param)
                .then(function(items){
                    $scope.items = items;
                    if(!!callback) callback($scope.items);
                });
        };
    });

    // map本体のオペを司るservice
    module.service("MapHandler", function(){
        // クロージャされる
        var map = {};
        var markers = [];
        var DISP_INFOWINDOW = false;

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

    // point dataを取得するservice
    module.service("MapPointDataAdapter", function($http){
        this.getData = function(param){
            var query_string = "&needonlydata=true";
            for(var p in param){
                query_string += "&" + p + "=" + param[p];
            }
            return $http.jsonp("index.php" + "?" + "callback=JSON_CALLBACK" + query_string)
                // 戻りはpromiseオブジェクトなんで
                .then(function(response_wrapper){
                    var response = response_wrapper.data;
                    var res_items = [];
                    if(response && response.head_info && (response.head_info.length > 0)){
                        for(var i = 0; i < response.head_info.length; i++){
                            var item = response.head_info[i];
                            var detail_image_info = response.detail_info[item.id];
                            var detail_images = [];
                            var detail_images_thumb = [];
                            if(detail_image_info){
                                /*
                                detail_images = detail_image_info.reduce(function(p, c){
                                    return p.push(c);//Array.isArray(p) ? p.push(c.image_url) : [p.image_url, c.image_url];
                                }, []);
                                */
                                detail_images = detail_image_info.map(function(v){
                                    return v.image_url;
                                });
                                detail_images_thumb = detail_image_info.map(function(v){
                                    return v.image_url_thumb;
                                });
                            }
                            res_items.push({
                                id: item.id,
                                name: item.name,
                                lat: item.lat,
                                lng: item.lng,
                                zip_no: item.zip_no,
                                address: item.address,
                                caption: item.caption,
                                prefecture: item.pref,
                                season: item.season,
                                accessibility: item.accessibility,
                                crowdness: item.crowdness,
                                image_url: item.image_url,
                                images: detail_images,
                                images_thumb: detail_images_thumb,
                                visit_date: item.visit_date
                            });
                        }
                    }
                    return res_items;
                }
            );
        }
    });
})();
