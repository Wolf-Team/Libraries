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
    version: 2,
    shared: true,
    api: "CoreEngine",
});

var _soundUtils = {
	sounds:[],
	
	source:{
		PLAYER:1,
		BLOCK:2,
		ENTITY:3,
	},
	
	updateVolume:function(){
		for(var i in this.sounds){
			var s = this.sounds[i];
			if(s.source==this.source.PLAYER)continue;
			
			var pp = Player.getPosition();//x,y,z
			if(s.source==this.source.BLOCK){
				var pb = {
						x:s.position.x-pp.x,
						y:s.position.y-pp.y,
						z:s.position.z-pp.z
					};
			}else if(s.source==this.source.ENTITY){
				var pe = Entity.getPosition(s.entity);
				var pb = {
						x:pe.x-pp.x,
						y:pe.y-pp.y,
						z:pe.z-pp.z
					};
			}
			
		
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
	},
	
	leaveWorld:function(){
		for(var i in this.sounds){
			var s = this.sounds[i];
			if(s.source==this.source.PLAYER)continue;
			
			s.pause();
		}
	},
	
	loadedWorld:function(){
		for(var i in this.sounds){
			var s = this.sounds[i];
			if(s.source==this.source.PLAYER)continue;
			
			s.play();
		}
	}
};

var Sound = function(src, vol){
	this.media = new android.media.MediaPlayer();
	
	this.path = __dir__+"sounds/"+src;
	this.media.setDataSource(this.path);
	this.media.prepare();
	
	this.source = _soundUtils.source.PLAYER;
	this.position = {x:0, y:0, z:0};
	this.entity = Player.get();
	this.radius = 5;
	this.volume = vol||1;
	this.media.setVolume(this.volume, this.volume);
	
	this.setVolume=function(vol){
		this.volume = vol;
		
		if(this.source == _soundUtils.source.PLAYER)
			this.media.setVolume(this.volume, this.volume);
	}
	
	this.setInEntity = function(ent, r){
		this.source = _soundUtils.source.ENTITY;
		this.entity = ent;
		this.radius = r;
	}
	
	this.setInBlock = function(vector, y, z, r){
		this.source = _soundUtils.source.BLOCK;
		
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
		this.source = _soundUtils.source.PLAYER;
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
		this.path = __dir__+"sounds/"+src;
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

var MultiSound = function(params){
	this.components = [];
	for(var i = 0; i < params.length; i++){
		this.components.push(new Sound(params[i].src, params[i].volume||1));
	}
	
	this.setInEntity = function(ent, r){
		for(var i = 0; i < this.components.length; i++){
			this.components[i].setInEntity(ent, r);
		}
	}
	
	this.setInBlock = function(vector, y, z, r){
		for(var i = 0; i < this.components.length; i++){
			this.components[i].setInBlock(vector, y, z, r);
		}
	}
	this.setInPlayer = function(){
		for(var i = 0; i < this.components.length; i++){
			this.components[i].setInPlayer();
		}
	}
	
	
	this.addVolume = function(vol){
		for(var i = 0; i < this.components.length; i++){
			this.components[i].setVolume(this.components[i].volume+vol);
		}
	}
	
	this.setLooping = function(a){
		for(var i = 0; i < this.components.length; i++){
			this.components[i].setLooping(a);
		}
	}
	
	this.play = function(){
		for(var i = 0; i < this.components.length; i++){
			this.components[i].play();
		}
	};
	
	this.pause = function(){
		for(var i = 0; i < this.components.length; i++){
			this.components[i].pause();
		}
	};
	
	this.reset = function(){
		for(var i = 0; i < this.components.length; i++){
			this.components[i].reset();
		}
	};
	
	this.stop = function(){
		for(var i = 0; i < this.components.length; i++){
			this.components[i].stop();
		}
	};
	
	
}

Callback.addCallback("tick", function () {
	_soundUtils.updateVolume();
});
Callback.addCallback("LevelLoaded", function () {
	_soundUtils.loadedWorld();
});
Callback.addCallback("LevelLeft", function () {
	_soundUtils.leaveWorld();
});

EXPORT("Sound", Sound);
EXPORT("MultiSound", MultiSound);