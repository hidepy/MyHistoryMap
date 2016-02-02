var MapPointData = function(lat, lng){
	this.id = "";
	this.name = "";
	this.lat = lat;
	this.lng = lng;
	this.latLng = new google.maps.LatLng(lat, lng);
	this.zip_no = "";
	this.address = "";
	this.caption = "";
	this.prefecture = "";
	this.season = "";
	this.season_monthly = 0;
	this.accessibility = "";
	this.crowdness = "";
	this.image_url = "";
};