/*
  ____                        _     _     ____   ___ 
 / ___|  ___  _   _ _ __   __| |   / \   |  _ \ |_ _|
 \___ \ / _ \| | | | '_ \ / _` |  / _ \  | |_) | | | 
  ___) | (_) | |_| | | | | (_| | / ___ \ |  __/  | | 
 |____/ \___/ \__,_|_| |_|\__,_|/_/   \_\|_|    |___|
                                                                
    SoundAPI library

    Внимание! Запрещено:
    1.Распространение библиотеки на сторонних источниках без указание ссылки на официальное сообщество
    2.Изменение кода
    3.Явное копирование кода

    Используя библиотеку вы автоматически соглашаетесь с этими правилами.

    ©WolfTeam ( https://vk.com/wolf___team )
 */
LIBRARY({
    name: "SoundAPI",
    version: 1,
    shared: true,
    api: "CoreEngine",
});

var _soundUtils = {
	sounds:[],
	
	updateVolume:function(){
		for(var i in this.sounds){
			var s = this.sounds[i];
			if(s.inPlayer)continue;
			
			var pp = Player.getPosition();//x,y,z
			
			var pb = {
				x:s.position.x-pp.x,
				y:s.position.y-pp.y,
				z:s.position.z-pp.z };
			var pz = { x:0, y:0, z:5 };
			
			var pAngle = ((2*Math.PI) - (Entity.getLookAngle(Player.get()).yaw%(2*Math.PI)))%(2*Math.PI);
			if(pAngle<0)pAngle+=2*Math.PI;
			var bAngle = Math.acos((pb.x*pz.x + pb.y*pz.y + pb.z*pz.z)/(Math.sqrt(Math.pow(pb.x, 2)+Math.pow(pb.y, 2)+Math.pow(pb.z, 2))*Math.sqrt(Math.pow(pz.x, 2)+Math.pow(pz.y, 2)+Math.pow(pz.z, 2))));
			if(pp.x>s.position.x)bAngle= 2*Math.PI - bAngle;
			
			var angle = bAngle-pAngle + (Math.PI / 2);
			if(angle<0)angle+=2*Math.PI;
			if(angle>Math.PI)angle -= 2*Math.PI;
			
			var radVol = 0.9 / (Math.PI);
			if(angle<0)angle=angle*-1;
			var distance = Math.sqrt(Math.pow(pb.x, 2)+Math.pow(pb.y, 2)+Math.pow(pb.z, 2))
			var _distance = s.radius - distance;
				if(_distance < 0) _distance = 0;
			
			if(distance < 2)
				s.media.setVolume((0.1 + (radVol*angle))*s.volume, (1 - (radVol*angle))*s.volume);
			else
				s.media.setVolume((0.1 + (radVol*angle))*s.volume/(s.radius - 2)*_distance, (1 - (radVol*angle))*s.volume/(s.radius - 2)*_distance);
			
		}
	}
};

var Sound = function(src, vol){
	this.media = new android.media.MediaPlayer();
	
	this.path = __dir__+"sounds/"+src;
	this.media.setDataSource(this.path);
	this.media.prepare();
	
	this.inPlayer = true;
	this.position = {x:0, y:0, z:0};
	this.radius = 5;
	this.volume = vol||1;
	
	this.setInBlock = function(vector, y, z, r){
		this.inPlayer = false;
		
		if(typeof(vector)=='number'){
			this.position = {
				x:vector+0.5,
				y:y+0.5,
				z:z+0.5
			};
			this.radius = r;
		}else{
			vector.x += 0.5;
			vector.y += 0.5;
			vector.z += 0.5;
			this.position = vector;
			this.radius = y;
		}
		
	}
	this.setInPlayer = function(){
		this.inPlayer = true;
	}
	
	this.setOnCompletion = function(f){
		this.media.setOnCompletionListener(new android.media.MediaPlayer.OnCompletionListener(){
			onCompletion: function(mp){
				f(mp);
			}
		}); 
	};
	
	this.setSource = function(src){
		this.reset();
		this.path = __dir__+src;
		this.media.setDataSource(this.path);
		this.media.prepare(); 
	};
	
	this.setLooping = function(a){
		this.media.setLooping(a)
	}
	
	this.play = function(){
		this.media.start();
	};
	
	this.pause = function(){
		this.media.pause();
	};
	
	this.reset = function(){
		this.media.reset(); 
	};
	
	this.stop = function(){
		this.media.stop();
		this.media.prepare(); 
	};
	
	this._id = _soundUtils.sounds.push(this);
}

Callback.addCallback("tick", function () {
	_soundUtils.updateVolume();
});

EXPORT("Sound", Sound);