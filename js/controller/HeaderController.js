(function(){
    'use strict';

	angular.module('MHM-APP')
        .controller('HeaderController', function($scope, $routeParams, MapHandler, MapPointDataAdapter, CurrentState) {
            // map初期化
            MapHandler.loadMap(document.getElementById("history_map"));

            // local variables
            var PREF_LATLNG_MAP = {
                "北海道": {lat: "43.4350699", lng: "140.5482073"},
                "青森": {lat: "40.881569", lng: "139.6497326"},
                "秋田": {lat: "39.6869501", lng: "139.2229414"},
                "岩手": {lat: "39.5935961", lng: "140.241528"},
                "宮城": {lat: "38.3870213", lng: "140.4146086"},
                "山形": {lat: "38.4693908", lng: "138.9618567"},
                "福島": {lat: "37.3827211", lng: "139.5450099"},
                "新潟": {lat: "37.8487287", lng: "138.745398"},
                "茨城": {lat: "36.340776", lng: "139.7080265"},
                "栃木": {lat: "36.6752035", lng: "139.2490494"},
                "群馬": {lat: "36.5204079", lng: "138.4728766"},
                "千葉": {lat: "35.5003229", lng: "139.7498499"},
                "東京": {lat: "35.6691088", lng: "139.6012945"},
                "神奈川": {lat: "35.4003679", lng: "139.0956004"},
                "埼玉": {lat: "36.0172351", lng: "138.7450387"},
                "山梨": {lat: "35.5688097", lng: "138.0968588"},
                "長野": {lat: "36.1091974", lng: "136.9108193"},
                "富山": {lat: "36.6257288", lng: "136.7054459"},
                "石川": {lat: "36.8362677", lng: "135.6806511"},
                "福井": {lat: "35.8182596", lng: "135.5804147"},
                "岐阜": {lat: "35.7982535", lng: "136.404079"},
                "静岡": {lat: "35.1189809", lng: "137.7647538"},
                "愛知": {lat: "35.0000451", lng: "136.6946621"},
                "三重": {lat: "34.4850732", lng: "135.298977"},
                "滋賀": {lat: "35.2458092", lng: "135.5488915"},
                "奈良": {lat: "34.6868987", lng: "135.7913404"},
                "和歌山": {lat: "33.9074646", lng: "134.945812"},
                "大阪": {lat: "34.678395", lng: "135.4601304"},
                "京都": {lat: "35.0060799", lng: "135.6909095"},
                "兵庫": {lat: "34.9100463", lng: "133.7393365"},
                "岡山": {lat: "34.8243224", lng: "133.2795991"},
                "広島": {lat: "34.39383", lng: "132.371659"},
                "鳥取": {lat: "35.3347544", lng: "133.2647666"},
                "島根": {lat: "34.9521637", lng: "131.9368246"},
                "山口": {lat: "34.2543485", lng: "131.0729749"},
                "香川": {lat: "34.2882976", lng: "133.6634605"},
                "愛媛": {lat: "33.5984744", lng: "132.2922683"},
                "高知": {lat: "33.5703793", lng: "133.369774"},
                "徳島": {lat: "33.8946209", lng: "133.6806442"},
                "福岡": {lat: "33.5987303", lng: "130.317209"},
                "佐賀": {lat: "33.284401", lng: "129.8607394"},
                "長崎": {lat: "32.7585991", lng: "129.4931165"},
                "熊本": {lat: "32.6438624", lng: "130.0855072"},
                "大分": {lat: "33.2261278", lng: "130.8944303"},
                "宮崎": {lat: "32.094846", lng: "130.173191"},
                "鹿児島": {lat: "31.5227198", lng: "130.2756005"},
                "沖縄": {lat: "26.5838881", lng: "127.1568673"}
            };
            var SEARCH_COND_ID = ["w_pref", "w_score", "w_ptype", "order", "w_name", "w_hasnoimg"];
            var SEARCH_COND_NAME_MAP = {
                "w_pref": "地域",
                "w_score": "評価",
                "w_ptype": "タイプ",
                "order": "表示順",
                "w_hasnoimg": "画像なしデータを含む",
                "w_name": "キーワード"
            };

            // ---------- Display Items ----------
            $scope.items = [];
            $scope.selected_item = {
                images_thumb: []
            };
            
            // 検索条件表示用
            $scope.search_condition_text = "";

            // ---------- Local Functions ----------
            // point dataを検索する
            var searchPoint = function(param, callback){
                // 検索条件を更新
                CurrentState.searchCondition = param;
                // タイトルを更新
                $scope.binding.title = !!param && !window.CommonFunctions.isEmpty(param.w_pref) ? param.w_pref : "全国";
                // 検索条件を更新
                $scope.search_condition_text = SEARCH_COND_ID.reduce((p, c)=>{
                    return p + ($routeParams[c] ? SEARCH_COND_NAME_MAP[c] + "=" + $routeParams[c] + ", " : "");
                }, "");

                // レコード取得
                MapPointDataAdapter.getData(param)
                    .then(function(items){
                        // レコードなしの場合
                        if(!items){
                            $scope.showMessage("データ取得に失敗しました...", "alert-dangaer");
                        }
                        else{
                            $scope.showMessage("" + items.length + "件ヒットしました", "alert-success");
                        }

                        // 取得データを画面描画向けオブジェクトに納める
                        $scope.items = items;
                        // 取得データをcurrent stateに納める
                        CurrentState.searchedItems = $scope.items;

                        // callbackがあれば実行
                        if(!!callback) callback(items);
                    });
            };
            // card 又は markerのclick時動作を1本化
            var selectItem = function(index){
                // ここじゃなくて、検索直後にitemsを同期することに
                //CurrentState.searchedItems = $scope.items;
                CurrentState.index = index;
                CurrentState.selectedTab = "M";

                $scope.move("/detail/");
            };
            // 全件markerを削除
            var deleteAllMarkers = function(){
                MapHandler.deleteMarkers();
            };
            // 全件markerを追加
            var addAllMarkers = function(){
                $scope.items.forEach(function(item, i){
                    addMarker(i);
                });
            };
            // markerをセット
            var addMarker = function(index){
                // indexをクロージャする...
                var ClickItem = function(){
                    // 変更を反映させる
                    $scope.$apply(function(){
                        //$scope.selectItem(index);
                        selectItem(index);
                    });
                };

                var marker_color_def = $scope.PLACE_COLOR_MAP[$scope.items[index].place_type];

                // Markerを追加
                MapHandler.addMarker(
                    $scope.items[index],
                    {
                        index: index,
                        marker_color: marker_color_def ? marker_color_def.body : "",
                        marker_line_color: marker_color_def ? marker_color_def.line : "",
                        marker_opacity: (score=>{ // opacityを求める. 評価が高い程鮮明に表示する
                            var opacity = 0.4;
                            if(!isNaN(score) && (score != null)){
                                // scoreは0-9の想定
                                opacity += (Number(score) + 1) / (10.0 * (1.0 / (1.0 - opacity)));
                            }
                            return opacity;
                        })($scope.items[index].favorite)
                    },
                    ClickItem);
            };


            /* ---------- Angular scope Functions ---------- */
            // ---------- Init ----------
            $scope.init = function(){

                console.log("HeaderController -> init");

                CurrentState.searchCondition = CurrentState.searchCondition || {};



                var lat = null;
                var lng = null;

                // 変更点があるか                    
                if(SEARCH_COND_ID.filter(v=> !(($routeParams[v] || "") == (CurrentState.searchCondition[v] || ""))).length > 0){

console.log("forceSearch");

                    // 検索条件にprefがあれば、そこからデフォルト緯度経度を求める
                    var prefs = $routeParams["w_pref"] || "";
                    if(!window.CommonFunctions.isEmpty(prefs)){
                        var latlngs_filtered = prefs.split("-")
                            .map(v=>PREF_LATLNG_MAP[v])
                            .filter(v=>!!v && !!v.lat && !!v.lng);

                        lat = 0;
                        lng = 0;
                        for(var i = 0; i < latlngs_filtered.length; i++){
                            lat += Number(latlngs_filtered[i].lat);
                            lng += Number(latlngs_filtered[i].lng);
                        }
                        lat /= latlngs_filtered.length;
                        lng /= latlngs_filtered.length;

                        console.log("calclated latlng=" + lat + "," + lng);
                    }

                    $scope.updateMapPoints({
                        w_pref : $routeParams.w_pref  || "",
                        w_ptype: $routeParams.w_ptype || "",
                        w_score: $routeParams.w_score || "",
                        w_name : $routeParams.w_name  || "",
                        w_hasnoimg : $routeParams.w_hasnoimg  || "",
                        order  : $routeParams.order   || ""
                    });
                }
                // 位置情報リストが既にあれば単純描画(detailから戻った場合)
                else if(CurrentState.searchedItems && (CurrentState.searchedItems.length > 0)){
                    
console.log("no retrieve");

                    deleteAllMarkers();

                    $scope.items = CurrentState.searchedItems;

                    addAllMarkers();

                    // 検索済レコードからlatlngを取得する
                    var current_item = CurrentState.searchedItems && (CurrentState.index >= 0) && (CurrentState.index < CurrentState.searchedItems.length)
                        ? CurrentState.searchedItems[CurrentState.index] : {lat: null, lng: null};

                    lat = current_item.lat;
                    lng = current_item.lng;
                }
                // 全てのルートに当てはまらない⇒ページ初回ロード時↓
                else{

console.log("else... maybe first load");

                    // point dataを問合せ
                    $scope.updateMapPoints();
                }

                // デフォルトタブを決定
                if(window.CommonFunctions.isEmpty(CurrentState.selectTab)){
                    CurrentState.selectTab = "M";
                }

                $scope.selectTab(CurrentState.selectTab, lat, lng);
            };
            $scope.selectTab = function(tabname, lat, lng){

                if(tabname == "C"){
                    jQuery("#tab-card").tab("show");
                    jQuery("#tab-card").addClass("active");

                    jQuery("#tab-map").removeClass("active");
                    jQuery("#tab-list").removeClass("active");
                }
                else if(tabname == "L"){
                    jQuery("#tab-list").tab("show");
                    jQuery("#tab-list").addClass("active");

                    jQuery("#tab-map").removeClass("active");
                    jQuery("#tab-card").removeClass("active");
                }
                else{//(tabname == "M"){
                    jQuery("#tab-map").tab("show");
                    jQuery("#tab-map").addClass("active");

                    jQuery("#tab-card").removeClass("active");
                    jQuery("#tab-list").removeClass("active");

                    MapHandler.update(lat, lng);
                }

                CurrentState.selectTab = tabname;
                window.StorageManager_Settings.set("selectedTab", tabname);
            };
            // 現在のpointitemsから全件描画する
            $scope.updateMapPoints = function(params){
                // 選択中を削除
                $scope.selected_item = {};
                // 一旦削除
                deleteAllMarkers();

                // 検索&描画
                searchPoint(params, function(items){
                    addAllMarkers();
                });
            };
            $scope.selectCard = function(index){
                selectItem(index);
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
            // favに入っているかをチェック
            $scope.isAlreadyFav = function(item){
                return !!StorageManager_Fav.get(item.id);
            };
        })
})();
