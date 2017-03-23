<?php

$callback = $_GET["callback"];

if(isset($callback)){

	$configs = parse_ini_file("../dbconfig.ini", true);
	if(!configs){
		die("cannot open ini file...");
	}
/*
	// iniファイルからDB接続設定を読込
	$con = mysql_connect($configs["zekkeimap"]["dbhost"],  $configs["zekkeimap"]["dbuser"], $configs["zekkeimap"]["dbpw"]);

	// 接続失敗なら終了
	if (!$con) {
	    die("cannot open connection...".mysql_error());
	}

	//接続成功の場合
	$db = mysql_select_db($configs["zekkeimap"]["dbname"], $con);

	if(!$db){
		die("cannot select db...".mysql_error());
	}

	mysql_set_charset('utf8');
*/
	// Adminユーザか確認
	$is_admin_user = false;
	if(isset($_GET["adminkey"])){
		$is_admin_user = (md5($_GET["adminkey"]) == $configs["common"]["adminkey"]);
	}

	// PDOに変更
	$dbh = null;// ブロックスコープなしなんで、ここで宣言する必要はないのだけれど...
	try{
		$dsn = "mysql:host=".$configs["zekkeimap"]["dbhost"] . ";dbname=" . $configs["zekkeimap"]["dbname"] . ";charset=utf8";
		$dbh = new PDO($dsn, $configs["zekkeimap"]["dbuser"], $configs["zekkeimap"]["dbpw"]);
	}
	catch(PDOException $e){
		die("db connect error..." . $e->getMessage());
	}


	$cond_v_limit = 20;
	// Adminユーザの場合
	if($is_admin_user){
		$cond_limit = 200;
	}


	/* 課題
	order by 指定できていない
	県指定のみになっている
	*/ 

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
	  ,m1.accessibility
	  ,m1.crowdness_ave
	  ,m1.image_url_top
	FROM
	  MHM_M_POINT_DATA m1
	WHERE
	  1 = 1
	  AND m1.is_private <> 1
	LIMIT 40
	";
	
	$res = array();
	$res_details = array();
	$query_condition = "";

	//$select_res = mysql_query($query);
	$select_res = $dbh->query($query);

	//while($r = mysql_fetch_assoc($select_res)){
	while($r = $select_res->fetch(PDO::FETCH_ASSOC)){
		$res[] = array(
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
			"image_url"=>$r["image_url_top"]
		);

		if($query_condition != ""){
			$query_condition .= ", ";
		}
		$query_condition .= $r["id"];

	}

	$query_detail = "
	SELECT
	  m2.id
	  ,m2.seq
	  ,m2.image_url
	  ,m2.comment
	  ,m2.visit_date
	  ,m2.month
	  ,m2.timing_of_month
	  ,m2.author
	  ,m2.recomend
	FROM
	  MHM_M_PICTURES m2
	WHERE
	  m2.id IN (" . $query_condition . ")
	";

	if($query_condition != ""){
		//$select_res_detail = mysql_query($query_detail);
		$select_res_detail = $dbh->query($query_detail);

		//while($r = mysql_fetch_assoc($select_res_detail)){
		while($r = $select_res_detail->fetch(PDO::FETCH_ASSOC)){

			$current = $res_details[$r["id"]];

			if(!$current){
				$current = array();
			}

			array_push($current, array(
				"id"=>$r["id"],
				"seq"=>$r["seq"],
				"image_url"=>$r["image_url"],
				"comment"=>$r["comment"],
				"visit_date"=>$r["visit_date"],
				"month"=>$r["month"],
				"timing_of_month"=>$r["timing_of_month"],
				"author"=>$r["author"],
				"recomend"=>$r["recomend"]
			));

			$res_details[$r["id"]] = $current;
		}
	}

	header( 'Content-Type: text/javascript; charset=utf-8' );

	//GETかPOSTかは$.ajax側の設定次第？
	echo $callback . "({head_info: " . json_encode($res). ", detail_info: " . json_encode($res_details) . "})";


	//$close_flag = mysql_close($con);
	// 解放
	$dbh = null;
}

?>
