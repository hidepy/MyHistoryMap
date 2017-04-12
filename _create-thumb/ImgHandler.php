<?php
define("WM_MARGIN_RIGHT", 8);
define("WM_MARGIN_BOTTOM", 8);
define("QUALITY", 95);
define("QUALITY_THUMB", 50);

define("MAX_WIDTH", 1280);
define("MAX_HEIGHT", 960);
define("MAX_WIDTH_THUMB", 320);
define("MAX_HEIGHT_THUMB", 240);

class ImgHandler{

	private $dest_root_path = "";
	private $dest_thumb_root_path = "";
	private $img_watermark = "";
	private $wm_width = 0;
	private $wm_height = 0;
	private $wm_opacity = 20;
	private $DELETE_ORIGINAL = 0;

	function __construct($dest, $dest_thumb, $wm, $delete_original, $opacity){
		$this->dest_root_path = $dest;
		$this->dest_thumb_root_path = $dest_thumb;
		// watermarkをimgとして生成しておく. 何度も使うし
		//$this->img_watermark = imagecreatefromjpeg($wm);
		$this->img_watermark = imagecreatefrompng($wm);
		$this->wm_width = imagesx($this->img_watermark);
		$this->wm_height = imagesy($this->img_watermark);
		$this->wm_opacity = $opacity;

		$this->DELETE_ORIGINAL = $delete_original;
	}

	public function createImgForMHM($src){

		// function output
		$result = array("main_path"=> "", "thumb_path"=> "");
		
		// dest path
		$src_filename = basename($src);
		$dest_main_path = $this->dest_root_path.$src_filename;
		$dest_thumb_path = $this->dest_thumb_root_path."thumb_".$src_filename;

		// inut source
		$im_orig = imagecreatefromjpeg($src);

		// 基データのw/hを保存
		$orig_width = imagesx($im_orig);
		$orig_height = imagesy($im_orig);

		// 一旦リサイズ値を初期化しておく
		$resized_x = MAX_WIDTH;
		$resized_y = MAX_HEIGHT;
		$resized_thumb_x = MAX_WIDTH_THUMB;
		$resized_thumb_y = MAX_HEIGHT_THUMB;

		$rate = 1.0;

		// 横
		if($orig_width > $orig_height){
			$rate = ($orig_height / $orig_width);
			$resized_y = round(MAX_WIDTH * $rate);
			$resized_thumb_y = round(MAX_WIDTH_THUMB * $rate);
		}
		// 縦
		else{
			$rate = ($orig_width / $orig_height);
			$resized_x = round(MAX_HEIGHT * $rate);
			$resized_thumb_x = round(MAX_HEIGHT_THUMB * $rate);
		}

		// output canvas
		$im = imagecreatetruecolor($resized_x, $resized_y);

		// resize
		if(
			!imagecopyresampled(
				$im, $im_orig, // 出力/入力
				0, 0, // 出力側x,y
				0, 0, // 入力側x,y
				$resized_x, $resized_y, // 出力側size
				$orig_width, $orig_height // 入力側size
			)
		)
		{
			echo "resize failure...1";
			exit(1);
		}

		// overlap
		if(
			/*
			!imagecopymerge(
				$im, // 入力-出力
				$this->img_watermark, // src watermark
				imagesx($im) - $this->wm_width - WM_MARGIN_RIGHT, imagesy($im) - $this->wm_height - WM_MARGIN_BOTTOM, // 重ね合わせ開始x,y
				0, 0, // srcのコピーエリア開始x,y
				$this->wm_width, $this->wm_height, // srcのコピーエリア終了x,y
				$this->wm_opacity
			)
			*/
			!imagecopy(
				$im,
				$this->img_watermark,
				imagesx($im) - $this->wm_width - WM_MARGIN_RIGHT, imagesy($im) - $this->wm_height - WM_MARGIN_BOTTOM, // 重ね合わせ開始x,y
				0, 0,
				$this->wm_width, $this->wm_height
			)
		)
		{
			echo "overlap failure...2";
			exit(1);
		}

		// resize to thumb
		// output canvas thumb
		$im_thumb = imagecreatetruecolor($resized_thumb_x, $resized_thumb_y);
		if(
			!imagecopyresampled(
				$im_thumb, $im, // 出力/入力
				0, 0, // 出力側x,y
				0, 0, // 入力側x,y
				$resized_thumb_x, $resized_thumb_y, // 出力側size
				$resized_x, $resized_y // 入力側size
			)
		)
		{
			echo "resize to thumb failure...3";	
			exit(1);
		}

		// 出力
		if(
			imagejpeg($im, $dest_main_path, QUALITY)
			&& imagejpeg($im_thumb, $dest_thumb_path, QUALITY_THUMB)
		){
			// image output success!!
			$result["main"] = $dest_main_path;
			$result["thumb"] = $dest_thumb_path;
			$result["is_deleted"] = false;

			// 一応元データを削除する
			if($this->DELETE_ORIGINAL == 1){
				// 失敗しても本処理の結果には影響を与えないことにします
				$result["is_deleted"] = unlink($src);
			}
		}

		return $result;
	}
}
?>