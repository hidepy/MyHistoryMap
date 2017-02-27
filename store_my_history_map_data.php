<?php

$callback = $_GET['callback'];

if(isset($callback)){

	//$con = mysql_connect("localhost",  "hidork0222", "koritaso1117");
	$con = mysql_connect("mysql118.phy.lolipop.lan",  "LAA0758614", "koritaso1117");

	if (!$con) {
	    die("cannot open connection...".mysql_error());
	}

	//接続成功の場合
	$db = mysql_select_db("LAA0758614-mhm", $con);

	if(!$db){
		die("cannot select db...".mysql_error());
	}

	mysql_set_charset('utf8');

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
	  is_private <> '1'
	LIMIT 50
	";
	
	$res = array();
	$res_details = array();
	$query_condition = "";

	$select_res = mysql_query($query);

	while($r = mysql_fetch_assoc($select_res)){
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
		$select_res_detail = mysql_query($query_detail);

		while($r = mysql_fetch_assoc($select_res_detail)){

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

/*
			$res_details[$r["id"]] = array(
				"id"=>$r["id"],
				"seq"=>$r["seq"],
				"image_url"=>$r["image_url"],
				"comment"=>$r["comment"],
				"visit_date"=>$r["visit_date"],
				"month"=>$r["month"],
				"timing_of_month"=>$r["timing_of_month"],
				"author"=>$r["author"],
				"recomend"=>$r["recomend"]
			);
			*/
		}
	}

	header( 'Content-Type: text/javascript; charset=utf-8' );

	//GETかPOSTかは$.ajax側の設定次第？
	echo $callback . "({ head_info: " . json_encode($res). ", detail_info: " . json_encode($res_details) . "})";


	$close_flag = mysql_close($con);
}

?>
