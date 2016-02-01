var MapPointData = function(lat, lng){
	this.id = "";
	this.name = "";
	this.lat = lat;
	this.lng = lng;
	this.latLng = new google.maps.LatLng(lat, lng);
	this.caption = "";

};