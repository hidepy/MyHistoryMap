(function(){
    'use strict';
    var module = angular.module('app', ['checklist-model']);

    module.controller('AppController', function($scope, $data) {

        $scope.selected_item = {};
        $scope.items = [];

        $scope.markers = [];

        $scope.deleteMarkers = function(){
            $scope.markers.forEach(function(mkr){
                mkr.setMap(null);
            });

            $scope.markers = [];
        };

        $scope.selectMapData = function(index, event){
            console.log("in selectMapData. " + index);
            console.log(event)

            var item = $scope.items[index];
            $scope.selected_item = item;

            /*
            current_marker = new google.maps.Marker({
                map: history_map,
                position: (new google.maps.LatLng(item.lat, item.lng))
            });*/

            var mkr = new google.maps.Marker({
                position: new google.maps.LatLng(item.lat, item.lng)
            });

            mkr.setMap(history_map);

            $scope.markers.push(mkr);
            $scope.$apply();
        };

        $scope.pushStart = function(){


            console.log("push start!!");

            jQuery("#header > .container").hide( 300 , function(){
              $("#header").remove();
            });

            jQuery("#top_navigation").show("slow", function(){
              this.style.display = "inline";
            });

            initialize_map();

            jQuery.getJSONP = function(url,callback,param) {
                return jQuery.ajax({
                    url: url + "?" + "callback=" + param,
                    dataType:"jsonp",
                    success:callback
                });
            }
            jQuery.getJSONP("http://www51.atpages.jp/hidork0222/store_my_history_map_data/store_my_history_map_data.php", onDataHandler, "myCallback");
            function onDataHandler(response) {

                if(response && response.length && (response.length > 0)){
                    for(var i = 0; i < response.length; i++){

                        var item = response[i];
                        console.log(item);
                        
                        $scope.items.push({
                            id: item.id,
                            name: item.name,
                            lat: item.lat,
                            lng: item.lng,
                            //latLng: new google.maps.LatLng(lat, lng),
                            zip_no: item.zip_no,
                            address: item.address,
                            caption: item.caption,
                            prefecture: item.pref,
                            season: item.season,
                            accessibility: item.accessibility,
                            crowdness: item.crowdness,
                            image_url: item.image_url,
                            image_url2: item.image_url2,
                            image_url3: item.image_url3,
                            visit_date: item.visit_date
                        });

                    }
                }

                $scope.$apply();

            }

        };

    });

    module.controller('MasterController', function($scope, $data) {
        $scope.items = $data.items;

        $scope.showDetail = function(index) {
            console.log("show detail comes");
            var selectedItem = $data.items[index];
            $data.selectedItem = selectedItem;
            //$scope.ons.navigator.pushPage('detail.html', {title : selectedItem.title});
            myNavigator.pushPage('entry_record.html', {title : selectedItem.title});
        };
    });


    module.controller("HomeController", function(){
        //this.data = currentBikeInfo;

        //this.visibility = {};
        //this.visibility.dbg_disp_area = "inline";

        this.collections_count = storage_manager.getItemLength();
        this.total_amount = calcSfTotalAmount(storage_manager.getAllItem());

        function calcSfTotalAmount(h){
            var total = 0;

            for(var k in h){
                total += (h[k] && h[k].price && !isNaN(h[k].price)) ? h[k].price : 0;
            }

            return total;
        };

    });


    module.controller('EntryController', function($scope, selectList) {

        $scope.sf_id = "";
        $scope.sf_title =  "";
        $scope.sf_date = "";
        $scope.sf_picture = "";
        $scope.sf_selected_flavor_group = "";
        $scope.sf_map_pos = "";
        $scope.sf_rating = 0;   
        $scope.sf_rating_corn = 0;
        $scope.sf_price = 0;
        $scope.sf_comment = "";

        $scope.visibility = {
            btn_entry: "inline",
            btn_mod: "none"
        };

        console.log("in entry initialize");

        var _args = myNavigator.getCurrentPage().options;

        //照会画面としてコールされた場合
        if(_args && _args.call_as_mod_screen){

            var item = _args.item;

            $scope.sf_id = item.id;
            $scope.sf_title =  item.title;
            $scope.sf_date = item.date;
            $scope.sf_picture = item.picture;
            $scope.sf_selected_flavor_group = item.flavor_group;
            $scope.sf_map_pos = item.map;
            $scope.sf_rating = item.rating;
            $scope.sf_rating_corn = item.rating_corn;
            $scope.sf_price = item.price;
            $scope.sf_comment = item.comment;

            $scope.visibility.btn_entry = "none";
            $scope.visibility.btn_mod = "inline";
        }

        // 味の系統リスト
        $scope.showSelectListFlavorGroup = function(){
            
            selectList.removeAllItems();

            selectList.addItem("1", "甘さたっぷり");
            selectList.addItem("2", "濃厚系");
            selectList.addItem("3", "ミルク感強し");
            selectList.addItem("4", "さっぱり");

            myNavigator.pushPage('list_select_page.html', {title: "flavor_group"});
        };


        //写真選択
        $scope.showPictureSelect = function(){

            console.log("in showPictureSelect");


            navigator.camera.getPicture(function(base64img){
                console.log("success");

                var canvas = document.getElementById("myCanvas");
                var context = canvas.getContext("2d");

                var imageObj = new Image();

                imageObj.onload = function() {
                    console.log("in onload");

                    console.log("screen_width is: " + screen.width);
                    console.log("image WxH is: " + imageObj.width + ", " + imageObj.height);

                    console.log("rate is: " + (Number(imageObj.height) / Number(imageObj.width)));

                    var rs_width = Number(screen.width);
                    var rs_height = (Number(imageObj.height) / Number(imageObj.width)) * Number(screen.width);// (or-h/or-w) * rs-w

                    console.log("resized WxH is: " + rs_width + ", " + rs_height);

                    //canvas.width = 320;
                    //canvas.height = 320;
                    canvas.width = rs_width;
                    canvas.height = rs_height;
                    //canvas.height = rs_width;

                    console.log("value set ok?");

                    //context.drawImage(imageObj, 69, 50);
                    
                    //context.drawImage(imageObj, 0, 0, 100, 100);

                    context.drawImage(imageObj, 0, 0, rs_width, rs_height);

                    //context.drawImage(imageObj, 0, 0, 320, 320);

                    var base64= canvas.toDataURL('image/jpg');

                    $scope.sf_picture = base64;
                };
                //imageObj.src = "http://www.html5canvastutorials.com/demos/assets/darth-vader.jpg";
                imageObj.src = base64img;






                /*
                ImgB64Resize(base64img, 300, 300,
                    function(img_b64) {

                        console.log("img resize success!!");

                        // Destination Image
                        document.getElementById("entry_sf_picture_img").src = img_b64;
                        $scope.sf_picture = img_b64;
                    }, "tsid"
                );
*/

            },
            function(){
                console.log("error");
            },
            {
                quality: 50,
                //destinationType: Camera.DestinationType.DATA_URL,
                destinationType: Camera.DestinationType.FILE_URI,
                sourceType: navigator.camera.PictureSourceType.SAVEDPHOTOALBUM
            }
            );


            // base64をリサイズしようとしたが、commonFunctionsのImgB64Resizeのimg.onloadが効かないので他の方法を
            /*
            navigator.camera.getPicture(function(base64img){
                console.log("success");

                
                ImgB64Resize(base64img, 300, 300,
                    function(img_b64) {

                        console.log("img resize success!!");

                        // Destination Image
                        document.getElementById("entry_sf_picture_img").src = img_b64;
                        $scope.sf_picture = img_b64;
                    }, "tsid"
                );

            },
            function(){
                console.log("error");
            },
            {
                quality: 50,
                destinationType: Camera.DestinationType.DATA_URL,
                sourceType: navigator.camera.PictureSourceType.SAVEDPHOTOALBUM
            }
            );
*/

            /*
            navigator.camera.getPicture(function(base64img){
                console.log("get picture success!!");

                ImgB64Resize(base64img, 300, 300
                    function(img_b64) {

                        console.log("img resize success!!");

                        // Destination Image
                        document.getElementById("entry_sf_picture_img").src = img_b64;
                        $scope.sf_picture = img_b64;
                    }
                );

                //document.getElementById("sf_picture").src = imageURL;
            }, 
            function(message){
                console.log("画像取得処理でエラーが発生しました(" + message + ")");
            }, {
                quality: 50,
                destinationType: Camera.DestinationType.DATA_URL, //base64 encode
                //destinationType: Camera.DestinationType.FILE_URI, //for android?
                //destinationType: Camera.DestinationType.NATIVE_URI,
                sourceType: navigator.camera.PictureSourceType.SAVEDPHOTOALBUM
            });
            */

        };


        //登録ボタン
        $scope.entryRecord = function(){

            console.log("in entry record");

            /*
            //タイトルの入力判定
            if(isEmpty($scope.sf_title)){
                ons.notification.alert({
                  message: "タイトルを入力してよっ！！"
                });

                return;
            }
            */

            console.log("after checking title");

            var id = formatDate(new Date());

            var sf_obj = {
                id: id,
                title: $scope.sf_title,
                date: $scope.sf_date,
                picture: $scope.sf_picture,
                flavor_group: $scope.sf_selected_flavor_group,
                map: $scope.sf_map_pos,
                rating: $scope.sf_rating,
                rating_corn: $scope.sf_rating_corn,
                price: $scope.sf_price,
                comment: $scope.sf_comment
            };

            console.log("before inserting storage_manager");

            //ストレージに1件登録
            try{
                storage_manager.saveItem2Storage(id, sf_obj);

                //操作成功の場合は前画面に戻る
                //myNavigator.popPage();

                /*
                ons.notification.alert({
                  message: "1件登録しました"
                });
                */

                showAlert("1件登録しました");
            }
            catch(e){

                showAlert("登録に失敗しました...");

                /*
                ons.notification.alert({
                  message: "登録に失敗しました..."
                });
*/
            }

            //ここで、成功した場合のみ前画面に戻りたい...
        }

        //修正ボタン
        $scope.modifyRecord = function(){

            console.log("mod start");

            //タイトルの入力判定
            if(isEmpty($scope.sf_title)){

                showAlert("タイトルを入力してください...");

                /*
                ons.notification.alert({
                  message: "タイトルを入力してよっ！！"
                });
*/

                return;
            }

            //idの入力判定
            if(isEmpty($scope.sf_id)){
                showAlert("id not found...");

                /*
                ons.notification.alert({
                  message: "id not found..."
                });
*/

                return;
            }

            var sf_obj = {
                id: $scope.sf_id,
                title: $scope.sf_title,
                date: $scope.sf_date,
                picture: $scope.sf_picture,
                flavor_group: $scope.sf_selected_flavor_group,
                map: $scope.sf_map_pos,
                rating: $scope.sf_rating,
                rating_corn: $scope.sf_rating_corn,
                price: $scope.sf_price,
                comment: $scope.sf_comment
            };

            //ストレージに1件修正レコードを投げる
            try{
                storage_manager.saveItem2Storage(sf_obj.id, sf_obj);

                //操作成功の場合は前画面に戻る
                myNavigator.popPage();
            }
            catch(e){

                showAlert("修正に失敗しました...");

                /*
                ons.notification.alert({
                  message: "修正に失敗しました..."
                });
*/

                //console.log(e);
            }

        }

        // リスト選択イベント受け取り
        $scope.$on("listSelected", function(e, param){

            //$scope.selected_bike = item.value;

            switch(param.parent_option.title){
                case "flavor_group":
                    $scope.sf_selected_flavor_group = param.item.value;
                    break;
                default:
                    console.log("return value missing...");
            }
        });

    });


    // 整備レコード照会画面用 controller
    module.controller("ViewListController", function($scope){

        $scope.items = storage_manager.getAllItem();

        var el_list_items = document.querySelectorAll("#view_record_list ons-row[item_id]");

        $scope.processItemSelect = function(index, event){
            console.log("item selected!!");

            var el_target_rows = document.querySelectorAll("#view_record_list > ons-row"); //※※※※※※※※※修正

            console.log("after getting el_target_rows. length is: " + el_target_rows.length);

            console.log("index is: " + index);

            //アイテムが選択されたら、明細情報照会画面に遷移する
            myNavigator.pushPage('view_record_detail.html', {
                selected_id: el_target_rows[index].getAttribute("item_id")
            });

        };

        //削除画面切り替え
        $scope.deleteSwitch = function(){

            console.log("delete ON!");

            /*var myObj = "<label class='checkbox checkbox--list-item'>\n<input type='checkbox'>\n<div class='checkbox__checkmark checkbox--list-item__checkmark'></div>\n</label>";
            var el = document.querySelectorAll('#view_record .mark_box');
            angular.element(el).append(myObj);
            */

            if($scope.delete_switching) {
                $scope.delete_switching = false;
            }else {
               $scope.delete_switching = true;
              }
        };

        //削除するデータリスト
        $scope.del = {
            items: []
        };

        //削除ボタン
        $scope.deleteRecord = function(){

            //console.log($scope.del.items);
            storage_manager.deleteItems($scope.del.items);
            $scope.del.items = [];

        };

        $scope.checkAll = function() {
            $scope.del.items = [];

            for(var i in $scope.items){
                //console.log($scope.items[i].id);
                $scope.del.items.push($scope.items[i].id);  
            }
        };
        
        $scope.uncheckAll = function() {
            $scope.del.items = [];
        };

    });



    module.controller('ViewDetailController', function($scope) {

        var _args = myNavigator.getCurrentPage().options;

        var item = storage_manager.getItem(_args.selected_id);

        {

            $scope.sf = item;

            /*
            $scope.sf_id = item.id;
            $scope.sf_title =  item.title;
            $scope.sf_date = item.date;
            $scope.sf_picture = "";
            $scope.sf_selected_flavor_group = item.flavor_group;
            $scope.sf_map_pos = item.map;
            $scope.sf_rating = item.rating;
            $scope.sf_rating_corn = item.rating_corn;
            $scope.sf_price = item.price;
            $scope.sf_comment = item.comment;
            */
        }


        //編集ボタン
        $scope.moveToModifyScreen = function(){

            console.log("in moveToModifyScreen");

            myNavigator.pushPage('entry_record.html', {
                call_as_mod_screen: true, 
                item: $scope.sf
            });

        };

        // リスト選択イベント受け取り
        $scope.$on("listSelected", function(e, param){

            //$scope.selected_bike = item.value;

            switch(param.parent_option.title){
                case "flavor_group":
                    $scope.sf_selected_flavor_group = param.item.value;
                    break;
                default:
                    console.log("return value missing...");
            }
        });

    });






    //汎用 選択リスト画面
    module.controller("SelectListController", function($scope, $rootScope, selectList){

        $scope.items = selectList.items;

        $scope.processItemSelect = function(index){
            var nav_options = myNavigator.getCurrentPage().options;
            var selectedItem = selectList.items[index];
            selectList.selectedItem = selectedItem;
            myNavigator.popPage();

            // イベント通知
            $rootScope.$broadcast("listSelected", {parent_option: nav_options, item: selectedItem});

        }
    });

    module.factory("currentBikeInfo", function(){
        var data = {};

        data.name = "gn125";
        data.purchace_date = "2012/03/11";
        data.comment = "this is my first bike";
        data.img = "none";
        data.maintainance_records = 11;
        data.touring_records = 21;

        return data;

    });

    module.service("selectList", function(){
        this.items = [];
        this.selectedItem = {};
        this.addItem = function(_key, _value){
            this.items.push({
                key: _key,
                value: _value
            });
        };
        this.removeItem = function(idx){
            this.items.splice(idx, 1);
        };
        this.removeAllItems = function(){
            this.items.length = 0;
        };
        this.createItemsFromObjectArr = function(objArr, key_name, value_name){
            /*
            objArr.forEach(function(val, idx, objArr){
                this.addItem(val[key_name], val[value_name]);
            });
            */
            for(var i = 0; i < objArr.length; i++){
                this.addItem(objArr[i][key_name], objArr[i][value_name]);
            }

        };
        this.createItemsFromArr = function(arr){
            /*
            arr.forEach(function(val, idx){
                this.addItem(idx, val);
            });
            */
            for(var i = 0; i < arr.length; i++){
                this.addItem("" + i, arr[i]);
            }
        };

    });

    module.controller("_ts", function(currentBikeInfo){
        this.data = currentBikeInfo;
    });


    module.controller('DetailController', function($scope, $data) {
        $scope.item = $data.selectedItem;
    });

    module.factory('$data', function() {
        var data = {};

        data.items = [
            {
                title: 'Item 1 Title',
                label: '4h',
                desc: 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
            },
            {
                title: 'Another Item Title',
                label: '6h',
                desc: 'Ut enim ad minim veniam.'
            },
            {
                title: 'Yet Another Item Title',
                label: '1day ago',
                desc: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'
            },
            {
                title: 'Yet Another Item Title',
                label: '1day ago',
                desc: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.'
            }
        ];

        return data;
    });





    /*
    module.controller('EntryController', function($scope) {

        ons.createPopover('entry_select_list_bike.html').then(function(popover) {
            $scope.popover_bike = popover;
        });

        ons.createPopover('entry_select_list_d_bunrui.html').then(function(popover) {
            $scope.popover_d_bunrui = popover;
        });

        $scope.show_select_list_bike = function(e) {
            $scope.popover_bike.show(e);
        };

        $scope.show_select_list_d_bunrui = function(e) {
            $scope.popover_d_bunrui.show(e);
        };

        $scope.select_bike = function(){
            console.log("in select_bike");
        }

    });
*/




})();