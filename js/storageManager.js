var StorageManager = function(storage_key_name){
	this.init(storage_key_name);
};

// プロトタイプ定義
!function(proto){
	var _storage_key_name = "";
	var _items = {};

	proto.init = function(storage_key_name) {
		//対象となるlocalstorageのキーを格納
		_storage_key_name = storage_key_name;

		//インスタンス化直後、現在のストレージの情報をハッシュに格納する
		_items = convStorage2Hash(storage_key_name);
	};

	var convStorage2Hash = function(storage_key_name){
		var item_hash = {};

		try{
			var s = window.localStorage.getItem(storage_key_name);
			if(s) item_hash = JSON.parse(s);
		}
		catch(e){
			console.log("convStorage2Hash eror occured");
		}

		return item_hash;
	};

	proto.getAll = function(){
		return _items;
	};

	proto.get = function(key){
		return _items[key];
	};
	proto.set = function(key, data){
		_items[key] = data;
		window.localStorage.setItem(_storage_key_name, JSON.stringify(_items));
	};

	proto.delete = function(key){
		delete　_items[key];
		window.localStorage.setItem(JSON.stringify(_items));
	};

	proto.deleteAll = function(keys){
		if(keys && keys.length && (keys.length > 0)){
			keys.forEach(function(v, i, arr){
				delete _items[v];
			});
		}

		window.localStorage.setItem(_storage_key_name, JSON.stringify(_items));
	};

	proto.getLength = function(){
		return Object.keys(_items).length;
	}

}(StorageManager.prototype);



