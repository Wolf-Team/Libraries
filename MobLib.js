/*
  __  __       _     _     _  _     
 |  \/  | ___ | |__ | |   (_)| |__  
 | |\/| |/ _ \| '_ \| |   | || '_ \ 
 | |  | | (_) | |_) | |___| || |_) |
 |_|  |_|\___/|_.__/|_____|_||_.__/ 
                                                      
    MobLib

    Внимание! Запрещено:
    1.Распространение библиотеки на сторонних источниках без указание ссылки на официальное сообщество
    2.Изменение кода
    3.Явное копирование кода

    Используя библиотеку вы автоматически соглашаетесь с этими правилами.

    ©WolfTeam ( https://vk.com/wolf___team )
*/

LIBRARY({
    name: "MobLib",
    version: 1,
    shared: false,
    api: "CoreEngine"
});

var Mob = function(params){
	//Создание моба
	if(!params instanceof Object)
		throw "params должен быть объектом.";
	
	if(!params.sid)
		throw "params.sid является обязательным полем.";
	
	this.getID = function(){return params.sid;}
	this.getSID = function(){return params.sid;}
	
	if(!params.name) params.name = this.getSID();
	
	this.getName = function(){return params.name};
	
	this.entity = MobRegistry.registerEntity(params.sid);
	
	//Задаем рендер с текстурой
	if(!params.render) params.render = 3;

	if(!params.skin) params.skin = "textures/entity/zombie/zombie.png";
	
	var render;
	if(typeof params.render == "number")
		render = new Render(params.render);
	else
		render = params.render;
	
	var model = new EntityModel();
    model.setRender(render);
	
	var skin = new Texture(params.skin);
	model.setTexture(skin);
	
	this.entity.customizeVisual({
		getModels: function() {
			return {
				"main": model
			};
		}
	});
	
	
	//Задаем данные моба
	if(!params.health) params.health = 20;
	
	if(!params.loot) params.loot = [];
	
	if(!params.loot instanceof Array)
		if(params.loot instanceof Object){
			params.loot = [params.loot];
		}else{
			throw "params.loot должен являться массивом предметов.";
		}
	
	if(!params.hitbox){
		params.hitbox = {w: 1,h: 2};
	}else{
		if(params.hitbox instanceof Object || typeof params.hitbox == "object"){
			if(params.hitbox instanceof Array)
				throw "params.hitbox должен быть объектом.(params.hitbox instanceof Array)";
		}else{
			if(typeof params.hitbox == "number"){
				params.hitbox = {w:params.hitbox, h:params.hitbox};
			}else{
				throw "params.hitbox должен быть объектом.(typeof params.hitbox == "+typeof params.hitbox+")";
			}
		}
	}
	
	this.entity.customizeDescription({
		getHealth:function(){
			return params.health;
		},
		
		getDrop: function(attacker) {
			return params.loot;
		},
		
		getHitbox: function(attacker) {
			return params.hitbox;
		}
	});
	
	//AI
	if(params.ai){
		if(typeof params.ai == "number")
			this.entity.setBaseType(params.ai);
		else
			this.entity.customizeAI({
				getAITypes: function() {
					return params.ai;
				}
			});
	}
	
	
	//Спавн по X, Y, Z
	this.spawn = function(x,y,z){
		 Entity.spawnCustom(this.getSID(), x, y, z);
	}
	
	//Яйцо спавна
	this.egg_id = null;
	
	this.getEggID = function(){
		return this.egg_id;
	};
	
	this.registerEgg = function(texture){
		this.egg_id = "egg_spawn_" + this.getID();
		
		IDRegistry.genItemID(this.getEggID());
		
		if(typeof texture == "string")
			texture = {name:texture, meta:0}
		
		Item.createItem(this.getEggID(), "Spawn Egg "+ this.getName(), texture);
		
		var custom_entity = this;
		Item.registerUseFunctionForID(ItemID[this.getEggID()], function(coords, item, block) {
			coords = coords.relative;
			custom_entity.spawn(coords.x + .5, coords.y, coords.z + .5);
		});
	}
};

/*
Mob.ArmorSets = {
	diamonds:,
	golds:,
	irons:,
	clothers:
}
*/
EXPORT("Mob", Mob);