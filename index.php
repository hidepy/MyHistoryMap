<?php

define("LOG_FILE", "./log/request.log");

// 全ユーザ対象にセッションを開始する
session_start();

// iniファイル読込
$configs = parse_ini_file("../dbconfig.ini", true);
if(!configs){
  die("cannot open ini file...");
} 

// Adminユーザか確認
$is_admin_user = ($_SESSION["imtasokori"] == true);

// callbackパラメータを取得
$callback = $_GET["callback"];

if(isset($callback)) {

  // PDOに変更
  $dbh = null;// ブロックスコープなしなんで、ここで宣言する必要はないのだけれど...
  try{
    $dsn = "mysql:host=".$configs["zekkeimap"]["dbhost"] . ";dbname=" . $configs["zekkeimap"]["dbname"] . ";charset=utf8";
    $dbh = new PDO($dsn, $configs["zekkeimap"]["dbuser"], $configs["zekkeimap"]["dbpw"]);
  }
  catch(PDOException $e){
    die("db connect error..." . $e->getMessage());
  }

  // 共通戻りI/Fオブジェクト
  $if_return = array("return_cd"=> 0, "msg"=> "", "item"=> "");

  // --------共通関数定義 ここから--------
  // DBからのレコードをヘッダのオブジェクトに変換(複数使用するんで)
  function getHeaderObj($r){
      return array(
        "id"=>$r["id"],
        "name"=>$r["name"],
        "lat"=>$r["lat"],
        "lng"=>$r["lng"],
        "pref"=>$r["prefecture"],
        "zip_no"=>$r["zip_no"],
        "address"=>$r["address"],
        "caption"=>$r["caption"],
        "season"=>"",
        "season_monthly"=>"",
        "accessibility"=>$r["accessibility"],
        "crowdness"=>$r["crowdness_ave"],
        "place_type"=>$r["place_type"],
        "gmap_by_latlng"=>$r["gmap_by_latlng"],
        "favorite"=>$r["favorite"],
        "image_url"=>$r["image_url_top"],
        "tag"=>$r["tag"] // タグの関連情報で引いてきた場合のみセットされる
      );
  }

  // --------共通関数定義ここまで--------


  // --------SQLのWhere句を設定 ここから--------
  // レコード取得件数を絞り込み
  $cond_v_limit = 48;
  // privateレコード取得の制限
  $cond_s_private = " AND m1.is_private <> 1";
  $cond_s_private_m2 = " AND m2.is_private <> 1";

  // Adminユーザの場合
  if($is_admin_user){
    // 最大件数
    $cond_v_limit = 96;
    // privateのものも取得対象にする
    $cond_s_private = "";
    $cond_s_private_m2 = "";
  }

  // ---------- ↓ 1件検索時のパラメータ ↓----------
  // 名称1発指定の条件
  $cond_s_byname = "";
  $cond_s_id = "";
  // 名称1発指定の場合に、ヘッダ情報が不要か
  $dont_need_header_info = false;
  // ---------- ↑ 1件検索時のパラメータ ↑----------

  $cond_s_area = "";
  $cond_s_ptype = "";
  $cond_s_score = "";
  $cond_s_keyword = "";
  $cond_s_hasimg = " AND ((m1.image_url_top <> '') AND (m1.image_url_top IS NOT NULL))"; // デフォルトは画像を持っているレコードのみが対象
  $inrj_s_tags = "";
  
  // 名称1発指定でなければ通常フロー(Head検索フロー)
  if(empty($_GET["w_byname"])){
    // 取得prefを設定
    if(isset($_GET["w_pref"]) && !empty($_GET["w_pref"])){
      $splitted_pref_arr = explode("-", $_GET["w_pref"], 48);
      if(count($splitted_pref_arr) > 0){
        for($i = 0; $i < count($splitted_pref_arr); $i++){
          $splitted_pref_arr[$i] = $dbh->quote($splitted_pref_arr[$i]);
        }
        $cond_s_area .= " AND m1.prefecture IN (".join(",", $splitted_pref_arr).")";
      }
    }

    // 取得タイプを設定
    if(isset($_GET["w_ptype"]) && !empty($_GET["w_ptype"])){
      $splitted_ptype_arr = explode("-", $_GET["w_ptype"], 5);
      if(count($splitted_ptype_arr)){
        for($i = 0; $i < count($splitted_ptype_arr); $i++){
          $splitted_ptype_arr[$i] = $dbh->quote($splitted_ptype_arr[$i]);
        }
        $cond_s_ptype .= " AND m1.place_type IN (".join(",", $splitted_ptype_arr).")";
      }
    }
    // 取得タイプの指定がなかった場合、N-B-Pのみ指定
    else{
      $cond_s_ptype .= " AND m1.place_type IN ('N', 'B', 'P')";
    }

    // 対象をscoreで絞り込み
    if(isset($_GET["w_score"]) && ctype_digit($_GET["w_score"]) ){
      $cond_s_score .= " AND m1.favorite >= " . $dbh->quote($_GET["w_score"]);
    }
    // デフォルト検索対象はGOODを意味する
    else{
      $cond_s_score .= " AND m1.favorite >= '5'";
    }

    // 名称あいまい検索
    if(isset($_GET["w_name"]) && !empty($_GET["w_name"]) ){
      $cond_s_keyword .= " AND m1.name LIKE " . $dbh->quote("%".$_GET["w_name"]."%");
    }

    // タグで絞り込み(第2タイプ)
    if(isset($_GET["w_tags"]) && !empty($_GET["w_tags"])){
      $splitted_tags_arr = explode("-", $_GET["w_tags"], 8);
      if(count($splitted_tags_arr) > 0){
        for($i = 0; $i < count($splitted_tags_arr); $i++){
          $splitted_tags_arr[$i] = $dbh->quote($splitted_tags_arr[$i]);
        }
        $inrj_s_tags = "
        INNER JOIN
        (
          SELECT DISTINCT
            m2.id as id
          FROM
            MHM_M_TAGS m2
          WHERE
            m2.tag_id IN (".join(",", $splitted_tags_arr).")
        ) v1
          ON v1.id = m1.id
        ";
      }
    }
  }
  // 名称1発指定の場合
  else{
      // ヘッダ情報は必ず1件まで
      $cond_v_limit = 1;

    // 名称1発指定の条件
    $cond_s_byname = " AND m1.name = " . $dbh->quote($_GET["w_byname"]);
    // Headerを既に取得していて, idを持っている場合
    $cond_s_id = empty($_GET["w_id"]) ? "" : $dbh->quote($_GET["w_id"]);
    // ヘッダ不要がONで渡されて、ちゃんとidを持っている場合はヘッダ不要ルートへ
    $dont_need_header_info = (($_GET["dontneed_header"] == "true") || ($_GET["dontneed_header"] == "1")) && !empty($cond_s_id);

    $if_return["msg"] .= "in byname root. dont_need_header_info is=".$dont_need_header_info.", dont_need_header_info=".$_GET["dontneed_header"].", left condition=".(($_GET["dontneed_header"] == "true") || ($_GET["dontneed_header"] == "1")).", cond_s_id=".$cond_s_id."(END)";
  } 

    // 画像を持つレコードのみを対象とするか
    if($_GET["w_hasnoimg"] == "1") {
      $cond_s_hasimg = "";
    }

  // --------SQLのWhere句を設定 ここまで--------


  // ヘッダ情報が不要でなければ
  if(!$dont_need_header_info){
    // --------SQLのOrderBy句を設定 ここから--------
    $orderby_key_value = array(
      "o_rec-d"=> "m1.favorite desc",
      "o_new-d"=> "m1.update_datetime desc",
      "o_new-a"=> "m1.update_datetime asc",
      "o_cro-d"=> "m1.crowdness_ave desc",
      "o_cro-a"=> "m1.crowdness_ave asc",
      "o_acc-d"=> "m1.accessibility desc",
      "o_acc-a"=> "m1.accessibility asc"
    );

    $orderby_s = " ORDER BY ";
    $orderby_cols = array();
    // orderパラメータがあって、解釈okだったら
    if(isset($_GET["order"]) && !empty($orderby_key_value[$_GET["order"]])){
      $orderby_cols[] = $orderby_key_value[$_GET["order"]];
    }
    // orderパラメータなければ、score順をデフォルトに
    else{
      $orderby_cols[] = $orderby_key_value["o_rec-d"];
    }
    
    // 優先度最後にはidソート
    $orderby_cols[] = "m1.id desc";
    
    // 配列をカンマjoinする
    $orderby_s .= join(",", $orderby_cols);
    // --------SQLのOrderBy句を設定 ここまで--------

    //DB選択成功の場合
    $query = "
    SELECT
      m1.id
      ,m1.name
      ,m1.lat
      ,m1.lng
      ,m1.prefecture
      ,m1.zip_no
      ,m1.address
      ,m1.caption
      ,m1.favorite
      ,m1.accessibility
      ,m1.crowdness_ave
      ,m1.place_type
      ,m1.gmap_by_latlng
      ,m1.image_url_top
    FROM
      MHM_M_POINT_DATA m1
    "
    .$inrj_s_tags.
    "
    WHERE
      1 = 1 
    ";
    
    // privateレコードの取得制限
    $query .= $cond_s_private;
    // areaレコードの条件
    $query .= $cond_s_area;
    // ptypeの条件
    $query .= $cond_s_ptype;
    // scoreの条件
    $query .= $cond_s_score;
    // nameの条件
    $query .= $cond_s_keyword;
    // bynameの条件(1件指定)
    $query .= $cond_s_byname;
    // has no imgの条件
    $query .= $cond_s_hasimg;

    // ソート指定
    $query .= $orderby_s;

    // 制限を付与
    $query .= " LIMIT ".$cond_v_limit;
    //$query .= " LIMIT 40";

    $if_return["msg"] .= "header-sql=".$query."(END)";

    $res = array();
    $res_details = array();
    $res_tags = array();
    $res_related_pref = array(); // 関連として表示する情報(prefで紐づく)
    $res_related_tags = array(); // 関連として表示する情報(tagで紐づく)
    $query_condition = "";

    $stmt = $dbh->prepare($query);
    // パラメータセット
    {
      // 取得件数のバインド
      //$stmt->bindValue(':limit', $cond_v_limit, PDO::PARAM_INT);
    }
    $stmt->execute();

    while($r = $stmt->fetch()){
      $res[] = getHeaderObj($r);

      if($query_condition != ""){
        $query_condition .= ", ";
      }
      $query_condition .= $r["id"];
    }
  }
  else{

    $if_return["msg"] .= "in dontneed_header, creating blank header(END)";

    // ヘッダ情報が不要なら、検索条件idをセットしておく
    $query_condition = $cond_s_id;
    // ヘッダ情報が1件もないと、取得側でエラー判定になってしまうので空を作っておく
    $res[] = array(
        "id"=>$_GET["w_id"] // originalのものでないとquoteされてしまっている...
      );
  }

  // 名称1発検索の場合(=DetailPage)
  if(!empty($_GET["w_byname"])){

    $if_return["msg"] .= "in detail info get(END)";

    // 明細検索の必要があれば
    if($query_condition != ""){
      // 1. PICTURESに問合せ
      $query_detail = "
      SELECT
        m2.id
        ,m2.seq
        ,m2.image_url
        ,m2.image_url_thumb
        ,m2.comment
        ,m2.visit_date
        ,m2.month
        ,m2.timing_of_month
        ,m2.author
        ,m2.recomend
      FROM
        MHM_M_PICTURES m2
      WHERE
        m2.id = " . $query_condition
      ;// このルートに入る時、$query_conditionにはidが1件しか存在しないはず

      // privateレコードの取得制限
      $query_detail .= $cond_s_private_m2;
      // 実行
      $select_res_detail = $dbh->query($query_detail);
      // 取得分ループ
      while($r = $select_res_detail->fetch(PDO::FETCH_ASSOC)){
        // 現在のdetailを取得
        $current = $res_details[$r["id"]];
        // なければつくる
        if(!$current) $current = array();

        array_push($current, array(
          "id"=>$r["id"],
          "seq"=>$r["seq"],
          "image_url"=>$r["image_url"],
          "image_url_thumb"=>$r["image_url_thumb"],
          "comment"=>$r["comment"],
          "visit_date"=>$r["visit_date"],
          "month"=>$r["month"],
          "timing_of_month"=>$r["timing_of_month"],
          "author"=>$r["author"],
          "recomend"=>$r["recomend"]
        ));

        $res_details[$r["id"]] = $current;
      }


      // 2.tagsに問合せ
      $query_tags = "
      SELECT
        m3.id
        ,m3.tag_id
      FROM
        MHM_M_TAGS m3
      WHERE
        m3.id = " . $query_condition . ""
      ;
      // 後続で使用する可能性があるのでタグをカンマ区切りにして保持する
      $tags_string_arr = array();

      // tag取得実行
      $select_res_tags = $dbh->query($query_tags);

      // tags取得分ループ
      while($r = $select_res_tags->fetch(PDO::FETCH_ASSOC)){
        // 現在までのタグを取得
        $current_tag = $res_tags[$r["id"]];
        // まだなければ作る
        if(!$current_tag) $current_tag = array();

        array_push($current_tag, array(
          "id"=>$r["id"],
          "tag_id"=>$r["tag_id"]
        ));

        // idは1個のはずなんで特に構わず連結していく
        $tags_string_arr[] = $r["tag_id"];

        $res_tags[$r["id"]] = $current_tag;
      }


      // 3. 【暫定】 pref, tagsそれぞれランダムに6件ずつ関連情報として取得する
      $query_related_pref = "
      SELECT
        m1.id
        ,m1.name
        ,m1.lat
        ,m1.lng
        ,m1.prefecture
        ,m1.zip_no
        ,m1.address
        ,m1.caption
        ,m1.favorite
        ,m1.accessibility
        ,m1.crowdness_ave
        ,m1.place_type
        ,m1.gmap_by_latlng
        ,m1.image_url_top
      FROM
        MHM_M_POINT_DATA m1
        INNER JOIN
        (
          SELECT
            m2.prefecture
          FROM
            MHM_M_POINT_DATA m2
          WHERE
            m2.id = " . $query_condition . "
        ) v1
          ON
            v1.prefecture = m1.prefecture
      WHERE
        m1.is_private <> '1'
      ORDER BY
        RAND()
      LIMIT
        0, 6
      ";

      // 関連ヘッダ(pref)取得実行
      $select_res_related_pref = $dbh->query($query_related_pref);

      // 取得分ループ
      while($r = $select_res_related_pref->fetch(PDO::FETCH_ASSOC)){
        $res_related_pref[$r["id"]] = getHeaderObj($r);
      }


      // 4. 【暫定】 tagsランダムに6件ずつ関連情報として取得する
      
      if(count($tags_string_arr) > 0){
        for($i = 0; $i < count($tags_string_arr); $i++){
          $tags_string_arr[$i] = $dbh->quote($tags_string_arr[$i]);
        }

        $query_related_tags = "
        SELECT
          m1.id
          ,m1.name
          ,m1.lat
          ,m1.lng
          ,m1.prefecture
          ,m1.zip_no
          ,m1.address
          ,m1.caption
          ,m1.favorite
          ,m1.accessibility
          ,m1.crowdness_ave
          ,m1.place_type
          ,m1.gmap_by_latlng
          ,m1.image_url_top
          ,v1.tag_id as tag
        FROM
          MHM_M_POINT_DATA m1
          INNER JOIN
          (
            SELECT
              m2.id
              ,m2.tag_id
            FROM
              MHM_M_TAGS m2
            WHERE
              m2.tag_id IN (" . join(",", $tags_string_arr) . ")
          ) v1
            ON
              v1.id = m1.id
        WHERE
          m1.is_private <> '1'
        ORDER BY
          RAND()
        LIMIT
          0, 6
        ";

        // 関連ヘッダ(tags)取得実行
        $select_res_related_tags = $dbh->query($query_related_tags);

        // 取得分ループ
        while($r = $select_res_related_tags->fetch(PDO::FETCH_ASSOC)){
          $res_related_tags[$r["id"]] = getHeaderObj($r);
        }
      }
    }
  }


  // アクセスログを出力する
  $request_type = empty($_GET["w_byname"]) ? "H" : "D";
  $req_parameter = array(
    $_GET["w_pref"],
    $_GET["w_ptype"],
    $_GET["w_score"],
    $_GET["w_name"],
    $_GET["w_hasnoimg"],
    $_GET["w_tags"]
  );
  $byname = $_GET["w_byname"];
  try{
    // ログ出力
    error_log(implode(array(date("[Y/m/d H:i:s]"), $request_type, implode($req_parameter, ","), $byname, $_SERVER["REMOTE_ADDR"], $is_admin_user, "\n"), "\t"), 3, LOG_FILE);
  }
  catch(Exception $e){
    $if_return["msg"] .= "logging failure...";
  }

  // 返却
  header( 'Content-Type: text/javascript; charset=utf-8' );
  // jsonpとしてcallback実行させる
  echo $callback . "({head_info: " . json_encode($res). ", detail_info: " . json_encode($res_details) . ", tag_info: " . json_encode($res_tags) . ", related_pref: " . json_encode($res_related_pref) . ", related_tags: " . json_encode($res_related_tags) .", if_return: ". json_encode($if_return) ."})";
  
  // 解放
  $dbh = null;
  
  exit();
}
else{
  // admin判定
  if(isset($_GET["adminkey"])){
    $is_admin_user = (md5($_GET["adminkey"]) == $configs["common"]["adminkey"]);
    // admin判定用プロパティをたてる
    $_SESSION["imtasokori"] = $is_admin_user;
  }
}

// 解放
$dbh = null;

?>

<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">

  <title><?php echo ($is_admin_user ? "MyHistoryMap" : "日本の絶景マップ｜写真と地図で本当の絶景が一目で分かる！") ?></title>
  <meta name="description" content="実際に訪れた日本の絶景を写真と地図で見やすく紹介しています。旅行で訪れる地域の周辺スポットの検索や、「富士山ビュースポット」「桜のビュースポット」など目的別スポット検索などもできます。" />
  <meta property="og:image"  content="http://tasokori.net/wp/wp-content/uploads/2017/06/zekkei-circle.png">
  <meta name="twitter:image" content="http://tasokori.net/wp/wp-content/uploads/2017/06/zekkei-circle.png">
  <meta itemprop="image"     content="http://tasokori.net/wp/wp-content/uploads/2017/06/zekkei-circle.png">


  <link rel="stylesheet" type="text/css" href="css/my_history_map.css">
  <link rel="stylesheet" type="text/css" href="lib/lightbox/css/lightbox.css">
  <link rel="stylesheet" href="lib/slick/slick.css">
  <link rel="stylesheet" href="lib/slick/slick-theme.css">
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.6/css/bootstrap.min.css" integrity="sha384-rwoIResjU2yc3z8GV/NPeZWAv56rSmLldC3R/AZzGRnGxQQKnKkoFVhFQhNUwEyJ" crossorigin="anonymous">

  <link href="//netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css" rel="stylesheet">

  <script src="http://maps.googleapis.com/maps/api/js?key=AIzaSyAC5TnApJHV0fXpLJ7NyEsrKevtWEefP_M"></script>
  <script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/tether/1.4.0/js/tether.min.js" integrity="sha384-DztdAPBWPRXSA/3eYEEUWrWCy7G5KFbe8fFjk5JAIxUYHKkDx6Qin1DkWx51bBrb" crossorigin="anonymous"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0-alpha.6/js/bootstrap.min.js" integrity="sha384-vBWWzlZJ8ea9aCX4pEW3rVHjgjt7zpkNpZk+02D9phzyeVkE+jo0ieGizqPLForn" crossorigin="anonymous"></script>
  <script type="text/javascript" src="js/storageManager.js"></script>

  <style>
  /*
  body{
    opacity: 0.15;
  }
  img{
    opacity: 0.4 !important;
  }
  .panel_img{
    opacity: 0.4 !important;
  }
  */
  
  #search-cond-disp-area{
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .searchcond-showall{
    overflow: visible;
  }
  .searchcond-hide{
    overflow: hidden;
    max-height: 1.2em;
  }
  
  </style>

  <base href="/webapps/zekkei-map/">
</head> 

<body ng-controller="RootController">

  <div id="initial-view" style="position: absolute; text-align: center; width: 100%; height: 100%; display: table;">
    <p style="display: table-cell; vertical-align: middle; ">Loading...<img src="../common/img/support-loading.gif" style="width: 24px;"></p>
  </div>

  <?php
  if($is_admin_user){
    echo '<admin-memo memo-master-name="MHM-memo" access-key="myts"></admin-memo>';
  }
  ?>

  <nav-header <?php if($is_admin_user){ echo "is-admin";} ?>></nav-header>

  <div id="contents" ng-view autoscroll="true"></div>

  <!-- normal js liblalies -->
  <script src="lib/lightbox/js/lightbox.js"></script>
  <!-- Angular Cmmmons -->
  <!-- Angular core -->
  <script src="lib/angular/angular.js"></script>
  <script src="lib/angular/angular-route.js"></script>
  <!-- Angular libs-->
  <script src="lib/slick/slick.js"></script>
  <script src="lib/slick/angular-slick.js"></script>
  <!-- Services -->
  <script src="js/service/MapHandlerService.js"></script>
  <!-- APP specific -->
  <!-- Define MHM-APP module -->
  <script src="js/main.js"></script>
  <!-- Directive -->
  <script src="js/directive/navSearch.js"></script>
  <?php
  if(!$is_admin_user){
    echo '<script src="js/directive/adsense.js"></script>';
  }
  else{
    echo '<script src="js/directive/no-adsense.js"></script>';
    echo '<script src="js/directive/_admin-memo.js"></script>';
    echo '<script src="js/directive/_regist-comment.js"></script>';
    echo '<script src="https://apis.google.com/js/api.js"></script>';
    echo '<script src="js/SheetsManager.js"></script>';
  }
  ?>
  <!-- Controller -->
  <script src="js/controller/HeaderController.js"></script>
  <script src="js/controller/DetailController.js"></script>
  
</body>
</html>
