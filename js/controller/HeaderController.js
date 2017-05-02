'user string';

angular.module("MHM-APP")
.controller('HeaderController', function($scope, $timeout, MapPointDataAdapter, MapHandler) {

    // map初期化
    MapHandler.loadMap(document.getElementById("history_map"));

    $scope.search_group = "zenkoku";
    $scope.selected_item = {
        images_thumb: []
    };
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

    /* ---------- Angular scope Functions ---------- */
    $scope.init = function(){
        // selected_prefの初期値を、urlのprefパラメータから求める
        $scope.selected_pref = location.search.substring(1).split("&")
            .map(v=>{
                return v.split("=");
            })
            .filter(v=>{
                v[1] = decodeURI(v[1]);// ここほんとさいあく。
                return (v[0] == "pref") && ($scope.pref_list.filter(p=>{ return (p==v[1])}).length > 0)
            })
            .map(v=>v[1]);

        // point dataを問合せ
        $scope.updateMapPoints();
    };

    $scope.selectTab = function(tabname){
        if(tabname == "M"){
            MapHandler.update();
        }
        else if(tabname == "C"){
            // nothing to do
        }
    };

    // card 又は markerのclick時動作を1本化
    $scope.selectItem = function(index){

        $scope.thumbLoaded = false;

        // どうにも carouselの動的変更がうまくいかないので遅延実行...
        $timeout(function(){
            $scope.selected_item = $scope.items[index];
            // サムネイルの1件目を選択
            $scope.selectThumbnailImg(0);

            $scope.thumbLoaded = true;
        }, 0);
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
                $scope.selectItem(index);
            });
        };

        // Markerを追加
        MapHandler.addMarker($scope.items[index], {index: index}, ClickItem);
    };

    $scope.selectCard = function(index){
        // 選択明細カードを更新
        //var item = $scope.items[index];
        //$scope.selected_item = item;

        $scope.selectItem(index);

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
            // 現在は, aタグでポップアップコースになったので不要か...?
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

        // レコード取得
        MapPointDataAdapter.getData(param)
            .then(function(items){
                $scope.items = items;
                if(!!callback) callback($scope.items);
            });
    };


    $scope.thumbLoaded = false;
    // slick(carouselのやつ)の設定
    $scope.slickConfig = {
        enabled: true,
        autoplay: false,
        draggable: true,
        centerMode: true,
        fade: true,
        mobileFirst: true,
        method: {}/*,
        event: {
            beforeChange: function (event, slick, currentSlide, nextSlide) {
            },
            afterChange: function (event, slick, currentSlide, nextSlide) {
            }
        }
        */
    };
})