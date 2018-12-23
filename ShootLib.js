/*
  ____  _                 _   _     _ _     
 / ___|| |__   ___   ___ | |_| |   |_| |__  
 \___ \|  _ \ / _ \ / _ \| __| |   | | '_ \ 
  ___) | | | | (_) | (_) | |_| |___| | |_) |
 |____/|_| |_|\___/ \___/ \__|_____|_|_.__/ 
                                                                
    Shoot Library

    Внимание! Запрещено:
    1.Распространение библиотеки на сторонних источниках без указание ссылки на официальное сообщество
    2.Изменение кода
    3.Явное копирование кода

    Используя библиотеку вы автоматически соглашаетесь с этими правилами.

    ©WolfTeam ( https://vk.com/wolf___team )
 */
/*  ChangeLog:
	v1.3
		- Fix interface conflict with multiple mods
		- Fix errors
		- Upgrade SoundLib to 2.2
	v1.2
		- Add method Entity.shot
		- Add parameter (int)gun.bullet.entity = Native.EntityType.ARROW
		- Add callback GunsDefined
		- Fix GUI fov
	v1.1
		- Fix Reload
		- Delete setting.loadSoundFile
		- Don't break blocks with a weapon
	v1
		- release
*/
LIBRARY({
    name: "ShootLib",
    version: 1.3,
    api: "CoreEngine",
	dependencies: ["SoundAPI"]
});
IMPORT("SoundAPI", "Sound");

/**
* Объект ShootLib
*/
var ShootLib = {
	/**
	** Типы стрельбы
	*/
	ShotType:{
		SINGLE:0, /** Пуля **/
		MULTIPLE:1,/** Дробь **/
		NORMAL:0,/** Пуля **/
		SHOTGUN:1/** Дробь **/
	},
	
	/**
	** Типы кнопок
	*/
	ButtonType:{
		CLICK:1,/** Нажатие **/
		TOUCH:2/** Удерживание **/
	},
	/** Моменьтальное убийство**/
	MAX_DAMAGE:-1,
	/** Системная константа, нужна для инициализации GUI **/
	GUN_BITMAP:-1,
	
	/**
	* Инициализация и настройка мода
	* @param settings - Объект настроек.
	*/
	init:function(settings){
		if(!settings) return false;
		for(var i in settings){
			_shootlib.settings[i] = settings[i];
		}
	},
	
	/**
	* Метод добавления оружия
	* @param gun - Объект оружия.
	*/
	addGun:function(gun){
		if(typeof gun.id != "string")
			return Logger.LogError("{addGun} gun.id должен быть строкой", "ShootLib");
		if(typeof gun.name != "string")
			return Logger.LogError("{addGun} gun.name должен быть строкой", "ShootLib");
		if(typeof gun.ammo != 'string')
			return Logger.LogError("{addGun} gun.ammo должен быть строкой", "ShootLib");
		
		if(typeof gun.accuracy != "number")
			return Logger.LogError("{addGun} gun.accuracy должен быть числом", "ShootLib");
		if(typeof gun.recoil != "number")
			return Logger.LogError("{addGun} gun.recoil должен быть числом", "ShootLib");
		if(typeof gun.rate != "number")
			return Logger.LogError("{addGun} gun.rate должен быть числом", "ShootLib");
		
		if(gun.shotType != ShootLib.ShotType.NORMAL && gun.shotType != ShootLib.ShotType.SHOTGUN )
			return Logger.LogError("{addGun} gun.shotType должен быть ShotType.NORMAL или ShotType.SHOTGUN", "ShootLib");
		if(gun.buttonType != ShootLib.ButtonType.CLICK && gun.buttonType != ShootLib.ButtonType.TOUCH)
			return Logger.LogError("{addGun} gun.buttonType должен быть ButtonType.CLICK или ShotType.TOUCH", "ShootLib");
		
		if(typeof gun.texture == 'string')
			gun.texture = {name:gun.texture};
		else if(typeof gun.texture != 'object')
			return Logger.LogError("{addGun} gun.texture должен быть объектом", "ShootLib");
		if(typeof gun.texture.name !='string')
			return Logger.LogError("{addGun} gun.texture.name должен быть строкой", "ShootLib");
		
		if(typeof gun.bullet != 'object')
			return Logger.LogError("{addGun} gun.bullet должен быть объектом", "ShootLib");
		if(typeof gun.bullet.damage != "number")
			return Logger.LogError("{addGun} gun.bullet.damage должен быть числом", "ShootLib");
		if(typeof gun.bullet.speed != "number")
			return Logger.LogError("{addGun} gun.bullet.speed должен быть числом", "ShootLib");
		if(typeof gun.bullet.count != "number")
			return Logger.LogError("{addGun} gun.bullet.count должен быть числом", "ShootLib");
		if(gun.bullet.entity && typeof gun.bullet.entity != "number")
			return Logger.LogError("{addGun} gun.bullet.entity должен быть числом", "ShootLib");
		
		if(typeof gun.fov == 'number')
			gun.fov = {level:gun.fov};
		else if(typeof gun.fov != 'object')
			return Logger.LogError("{addGun} gun.fov должен быть объектом", "ShootLib");
		if(typeof gun.fov.level !='number')
			return Logger.LogError("{addGun} gun.fov.level должен быть числом", "ShootLib");
		if(gun.fov.link && typeof gun.fov.link != "string")
			return Logger.LogError("{addGun} gun.fov.link должен быть строкой", "ShootLib");
		if(gun.fov.link && !FileTools.isExists(GUI.gui_dir+gun.fov.link+".png"))
			return Logger.LogError("{addGun} Файл "+gun.fov.link+".png не существует", "ShootLib");
		
		if(typeof gun.sounds != 'object')
			return Logger.LogError("{addGun} gun.sounds должен быть объектом", "ShootLib");
		if(typeof gun.sounds.shot !='string')
			return Logger.LogError("{addGun} gun.sounds.shot должен быть строкой", "ShootLib");
		if(!FileTools.isExists(__dir__+"sounds/"+gun.sounds.shot))
			return Logger.LogError("{addGun} Файл sounds/"+gun.sounds.shot+" не существует", "ShootLib");
		if(typeof gun.sounds.empty !='string')
			return Logger.LogError("{addGun} gun.sounds.empty должен быть строкой", "ShootLib");
		if(!FileTools.isExists(__dir__+"sounds/"+gun.sounds.empty))
			return Logger.LogError("{addGun} Файл sounds/"+gun.sounds.empty+" не существует", "ShootLib");
		if(typeof gun.sounds.reload !='string')
			return Logger.LogError("{addGun} gun.sounds.reload должен быть строкой", "ShootLib");
		if(!FileTools.isExists(__dir__+"sounds/"+gun.sounds.reload))
			return Logger.LogError("{addGun} Файл sounds/"+gun.sounds.reload+" не существует", "ShootLib");
		
		if(gun.shotType == ShootLib.ShotType.SHOTGUN){
			if(typeof gun.shotgun != 'object')
				return Logger.LogError("{addGun} gun.shotgun должен быть объектом", "ShootLib");
			if(typeof gun.shotgun.count != 'number')
				return Logger.LogError("{addGun} gun.shotgun.count должен быть числом", "ShootLib");
			if(typeof gun.shotgun.degreesSpread != 'number')
				return Logger.LogError("{addGun} gun.shotgun.degreesSpread должен быть числом", "ShootLib");
		}
		
		_shootlib.guns.push(gun);
	},
	
	/**
	* Метод добавления оружий
	* @param guns - Массив объектов оружий.
	*/
	addGuns:function(guns){
		for(var i = 0; i < guns.length; i++)
			this.addGun(guns[i]);
	},
	
	/**
	* Метод добавления боеприпаса
	* @param ammo - Объект боеприпаса.
	*/
	addAmmo:function(ammo){
		if(typeof ammo.id != "string")
			return Logger.LogError("{addAmmo} ammo.id должен быть строкой", "ShootLib");
		if(typeof ammo.name != "string")
			return Logger.LogError("{addAmmo} ammo.name должен быть строкой", "ShootLib");
		if(typeof ammo.texture == 'string')
			ammo.texture = {name:ammo.texture};
		else if(typeof ammo.texture != 'object')
			return Logger.LogError("{addAmmo} ammo.texture должен быть объектом", "ShootLib");
		
		_shootlib.ammos.push(ammo);
	},
	
	/**
	* Метод добавления боеприпасов
	* @param ammos - Массим объектов боеприпасов.
	*/
	addAmmos:function(ammos){
		for(var i = 0; i < ammos.length; i++)
			this.addAmmo(ammos[i]);
	},
	
	/**
	* Получить объект оружия
	* @param item - ID предмета
	* @return {object,bool} - Вернет объект оружия, иначе false
	*/
	getGun:function(item){
		for(var i in _shootlib.guns){
			if(typeof(item)=='number'){
				if(ItemID[_shootlib.guns[i].id] == item)return _shootlib.guns[i];
			}else{
				if(ItemID[_shootlib.guns[i].id] == item.id)return _shootlib.guns[i];
			}
		}
		
		return false;
	},
	
	/**
	* Является ли оружием предиет
	* @param item - ID предмета
	* @return {bool} - Вернет true, если это оружие, иначе false
	*/
	isGun:function(item){
		if(this.getGun(item))
			return true;
		
		return false;
	},
	
	/**
	* Получить объект боеприпаса
	* @param item - ID предмета
	* @return {object,bool} - Вернет объект боеприпаса, иначе false
	*/
	getAmmo:function(item){
		for(var i in _shootlib.ammos){
			if(typeof(item)=='number'){
				if(ItemID[_shootlib.ammos[i].id] == item)return _shootlib.ammos[i];
			}else{
				if(ItemID[_shootlib.ammos[i].id] == item.id)return _shootlib.ammos[i];
			}
		}
		
		return false;
	},
	
	/**
	* Является ли боеприпасом предиет
	* @param item - ID предмета
	* @return {bool} - Вернет true, если это боеприпас, иначе false
	*/
	isAmmo:function(item){
		if(this.getAmmo(item))
			return true;
		
		return false;
	}
};

/**
* Выстрел мобом
* @param entity - Сущность, которая должна выстрелить.
*/
Entity.shot = function(entity){
	var gun = ShootLib.getGun(Entity.getCarriedItem(entity));
	if(gun==false)return;
	
	if(gun.shotType == ShootLib.ShotType.NORMAL)
		shotSingleBullet(gun);
	else if(gun.shotType == ShootLib.ShotType.MULTIPLE)
		shotShotgun(gun);
	
	
	var a = Entity.getLookAngle(entity);
	Entity.setLookAngle(entity, a.yaw, a.pitch+angleInRadian(gun.recoil));
	
	var shootSound = new Sound(gun.sounds.shot);
	shootSound.setInEntity(entity, 10);
	shootSound.setOnCompletion(function(){
		shootSound.destroy();
	});
	shootSound.play();
}

/**
** WORKING PART OF MODS
**/

var _shootlib = {
	settings:{
		image_button:true,
		left_handed:false,
		fire:{
			text:{
				content:"FIRE",
				size:18
			},
			bitmap:{
				name:"ui",
				coords:{
					x:544,
					y:0,
					width:544,
					height:544
				},
				size:{
					width:90,
					height:90
				}
			}
		},
		aim:{
			text:{
				content:"AIM",
				size:18
			},
			bitmap:{
				name:"ui",
				coords:{
					x:0,
					y:0,
					width:544,
					height:544
				},
				size:{
					width:90,
					height:90
				}
			}
		},
		crosshair:{
			bitmap:{
				name:"ui",
				coords:{
					x:1088,
					y:0,
					width:64,
					height:64
				},
				size:{
					width:90,
					height:90
				}
			}
		},
		crosshairGUI:{
			bitmap:{
				name:-1,
				coords:{
					x:0,
					y:0,
					width:1024,
					height:1024
				}
			}
		},
		reload:{
			text:{
				content:"8/8",
				size:16
			}
		}
	},
	guns:[],
	ammos:[],
	
	createGuns:function(){
		var guns = this.guns;
		for(var i = 0; i < guns.length; i++){
			var gun = guns[i];
			
			IDRegistry.genItemID(gun.id);
			Item.createItem(gun.id, gun.name, gun.texture,{isTech:false,stack:1});
			Item.describeItem(gun.id, {toolRender: true});
		}
	},
	
	createAmmos:function(){
		var ammos = this.ammos;
		for(var i = 0; i < ammos.length; i++){
			var ammo = ammos[i];
			
			IDRegistry.genItemID(ammo.id);
			Item.createItem(ammo.id, ammo.name, ammo.texture,{isTech:false,stack:64});
		}
	}
};

var GUI = {
	ctx:UI.getContext(),
	gui_dir:__dir__+"gui/",
	run:function(f){
		GUI.ctx.runOnUiThread(new java.lang.Runnable({
			run: function() {
				f();
			}
		}));
	},
	getPixels:function(unit){
		return Math.floor((GUI.width  / 1000) * unit);
	},
	getScaledBitmap:function(bitmap, width, height) {
		return android.graphics.Bitmap.createScaledBitmap(bitmap, width, height, false);
	},
	createImageButton:function(img, bitmap_coords, size){
		if(!bitmap_coords.x)bitmap_coords.x=0;
		if(!bitmap_coords.y)bitmap_coords.y=0;
		if(!size) size = {width: 1};
		if(!size.width)size.width = 1;
		if(!size.height)size.height = size.width;

		var spritesheet = new android.graphics.BitmapFactory.decodeFile(this.gui_dir+img+".png");
		var ExitBitmap = new android.graphics.Bitmap.createBitmap(spritesheet, bitmap_coords.x, bitmap_coords.y , bitmap_coords.width, bitmap_coords.height);
		var button = new android.widget.ImageButton(GUI.ctx);

		button.setImageBitmap(GUI.getScaledBitmap(ExitBitmap, this.getPixels(size.width), this.getPixels(size.height)));
		button.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT));
		button.setPadding(0,0,0,0);

		return button;
	},
	createDefaultButton:function(text, size){
		if(!size)size=18;
		
		var a = new android.widget.Button(GUI.ctx);
		a.setTextSize(size);
		a.setText(text);
		a.setTag(false);
		a.setSoundEffectsEnabled(false);
		a.setGravity(android.view.Gravity.CENTER);
		return a;
	},
	createButton:function(button){
		button = _shootlib.settings[button];
		var a;
		if(typeof _shootlib.settings.image_button == "string")
			a = __config__.access(_shootlib.settings.image_button)
		else
			a = _shootlib.settings.image_button;
		
		if(a==true)
			return GUI.createImageButton(button.bitmap.name, button.bitmap.coords, button.bitmap.size);
		else
			return GUI.createDefaultButton(button.text.content, button.text.size);
	},
	createImage:function(button, bitmapUrl){
		button = _shootlib.settings[button];
		
		img = button.bitmap.name == ShootLib.GUN_BITMAP?bitmapUrl:button.bitmap.name;
		bitmap_coords = button.bitmap.coords;
		size = button.bitmap.size;
		
		if(!bitmap_coords.x)bitmap_coords.x=0;
		if(!bitmap_coords.y)bitmap_coords.y=0;
		if(!size) size = {width: 1};
		if(!size.width)size.width = 1;
		if(!size.height)size.height = size.width;
		
		var spritesheet = new android.graphics.BitmapFactory.decodeFile(this.gui_dir+img+".png");
		var ExitBitmap = new android.graphics.Bitmap.createBitmap(spritesheet, bitmap_coords.x, bitmap_coords.y , bitmap_coords.width, bitmap_coords.height);
		var image = new android.widget.ImageView(GUI.ctx);
		image.setImageBitmap(GUI.getScaledBitmap(ExitBitmap, this.getPixels(size.width), this.getPixels(size.height)));
		
		return image;
	},
	createText:function(button){
		button = _shootlib.settings[button];
		
		str = button.text.content;
		size = button.text.size;
		
		if(!size)size=18;
		
		var a;
		if(typeof _shootlib.settings.image_button == "string")
			a = __config__.access(_shootlib.settings.image_button)
		else
			a = _shootlib.settings.image_button;
		
		var text = android.widget.TextView(GUI.ctx);
		text.setGravity(android.view.Gravity.CENTER);
		text.setTextColor(android.graphics.Color.parseColor("#FFFFFFFF"));
		text.setText(str);
		text.setTextSize(size);
		if(a==true)
			text.setTypeface(android.graphics.Typeface.createFromFile(FileTools.root+"games/com.mojang/innercore/mc-typeface.ttf"));
		
		return text;
	}
};

var metrics = new android.util.DisplayMetrics();
var display = GUI.ctx.getWindowManager().getDefaultDisplay();
display.getMetrics(metrics);
var _width = metrics.widthPixels,
	_height = metrics.heightPixels;

if(_width >_height){
	GUI.width = _width;
	GUI.height = _height;
}else{
	GUI.width = _height;
	GUI.height = _width;
}

_shootlib.settings.crosshairGUI.size = {width:1000 * GUI.height/GUI.width};

var resources = JSON.parse(FileTools.ReadText(__dir__+"build.config")).resources;
for(var i = 0; i < resources.length; i++){
	if(resources[i].resourceType == "gui")
		GUI.gui_dir = __dir__+resources[i].path;
}

var GUIMod = {
	fire:{
		button:GUI.createButton("fire"),
		popup:null,
		
		opened:false,
		
		open:function(){
			if(GUIMod.fire.opened == true) return;
			GUIMod.fire.opened = true;
			
			var a, gravity;
			if(typeof _shootlib.settings.left_handed == "string")
				a = __config__.access(_shootlib.settings.left_handed)
			else
				a = _shootlib.settings.left_handed;
			
			if(a==true)
				gravity = android.view.Gravity.RIGHT | android.view.Gravity.CENTER;
			else
				gravity = android.view.Gravity.LEFT | android.view.Gravity.CENTER;
			
			GUI.run(function(){
				GUIMod.fire.button = GUI.createButton("fire");
				
				GUIMod.fire.popup = new android.widget.PopupWindow(GUIMod.fire.button, android.view.ViewGroup.LayoutParams.WRAP_CONTENT, android.view.ViewGroup.LayoutParams.WRAP_CONTENT);
				GUIMod.fire.popup.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT));
				GUIMod.fire.popup.setOutsideTouchable(false);
				GUIMod.fire.popup.setSplitTouchEnabled(true);
				GUIMod.fire.popup.showAtLocation(GUI.ctx.getWindow().getDecorView(), gravity, GUI.getPixels(5), 0);
			});
		},
		reload:function(gun){
			if(gun.buttonType == ShootLib.ButtonType.CLICK){
				GUI.run(function(){
					GUIMod.fire.button.setOnClickListener(new android.view.View.OnClickListener() {
						onClick: function(b) {
							if(currentShotTicks <= 0 && !isReloading){
								shot(gun);
							}
						}
					});
					GUIMod.fire.button.setOnTouchListener(new android.view.View.OnTouchListener() {onTouch: function(a, c) {return false}});
				});
			}else if(gun.buttonType == ShootLib.ButtonType.TOUCH){
				GUI.run(function(){
					GUIMod.fire.button.setOnTouchListener(new android.view.View.OnTouchListener() {
						onTouch: function(a, c) {
							var b = c.getActionMasked();
							if (b == android.view.MotionEvent.ACTION_CANCEL || b == android.view.MotionEvent.ACTION_UP) {
								if(isShooting){
									isShooting = false;
									selectGun = null;
								}
							} else {
								if (!isShooting) {
									if(!isReloading){
										selectGun = gun;
										isShooting = true;
									}
								}
							}
							return false;
						}
					});
					GUIMod.fire.button.setOnClickListener(new android.view.View.OnClickListener() {onClick: function(b) {return false;}});
				});
			}
		},
		close:function(){
			GUIMod.fire.opened = false;
			GUI.run(function(){
				if(GUIMod.fire.popup!=null){
					GUIMod.fire.popup.dismiss();
					GUIMod.fire.popup = null;
				}
			});
		}
	},
	aim:{
		button:GUI.createButton("aim"),
		popup:null,
		
		opened:false,
		
		open:function(){
			if(GUIMod.aim.opened == true) return;
			GUIMod.aim.opened = true;
			
			var a, gravity;
			if(typeof _shootlib.settings.left_handed == "string")
				a = __config__.access(_shootlib.settings.left_handed)
			else
				a = _shootlib.settings.left_handed;
			
			if(a==true)
				gravity = android.view.Gravity.LEFT | android.view.Gravity.CENTER;
			else
				gravity = android.view.Gravity.RIGHT | android.view.Gravity.CENTER;
			
			GUI.run(function(){
				GUIMod.aim.button = GUI.createButton("aim");
				
				GUIMod.aim.popup = new android.widget.PopupWindow(GUIMod.aim.button, android.view.ViewGroup.LayoutParams.WRAP_CONTENT, android.view.ViewGroup.LayoutParams.WRAP_CONTENT);
				GUIMod.aim.popup.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT));
				GUIMod.aim.popup.setOutsideTouchable(false);
				GUIMod.aim.popup.setSplitTouchEnabled(true);
				GUIMod.aim.popup.showAtLocation(GUI.ctx.getWindow().getDecorView(), gravity, GUI.getPixels(5), 0);
			});
		},
		reload:function(gun){
			GUI.run(function(){
				GUIMod.aim.button.setOnClickListener(new android.view.View.OnClickListener() {
					onClick: function(b) {
						if(!isAim){
							Player.setFov(getFovLevel(gun.fov.level));
							if(gun.fov.link){
								GUIMod.close();
								GUIMod.open(gun, true);
							}
						}else{
							Player.resetFov();
							if(gun.fov.link){
								GUIMod.close();
								GUIMod.open(gun);
							}
						}
						isAim = !isAim;
					}
				});
			});
		},
		close:function(){
			GUIMod.aim.opened = false;
			GUI.run(function(){
				if(GUIMod.aim.popup!=null){
					GUIMod.aim.popup.dismiss();
					GUIMod.aim.popup = null;
				}
			});
		}
	},
	crosshair:{
		image:GUI.createImage("crosshair"),
		popup:null,
		
		opened:false,
		opened_gui:false,
		
		open:function(){
			if(GUIMod.crosshair.opened == true) return;
			GUIMod.crosshair.opened = true;
			GUIMod.crosshair.opened_gui = false;
			GUI.run(function(){
				GUIMod.crosshair.image = GUI.createImage("crosshair");
				
				GUIMod.crosshair.popup = new android.widget.PopupWindow(GUIMod.crosshair.image, android.view.ViewGroup.LayoutParams.WRAP_CONTENT, android.view.ViewGroup.LayoutParams.WRAP_CONTENT);
				GUIMod.crosshair.popup.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT));
				GUIMod.crosshair.popup.setOutsideTouchable(false);
				GUIMod.crosshair.popup.setSplitTouchEnabled(true);
				GUIMod.crosshair.popup.showAtLocation(GUI.ctx.getWindow().getDecorView(), android.view.Gravity.CENTER, GUI.getPixels(5), 0);
			});
		},
		openGUI:function(gun){
			if(GUIMod.crosshair.opened == true) return;
			GUIMod.crosshair.opened = true;
			GUIMod.crosshair.opened_gui = true;
			GUI.run(function(){
				GUIMod.crosshair.image = GUI.createImage("crosshairGUI", gun.fov.link);
				GUIMod.crosshair.image.setScaleType(android.widget.ImageView.ScaleType.CENTER_CROP);
				GUIMod.crosshair.image.setLayoutParams(new android.widget.LinearLayout.LayoutParams(android.view.ViewGroup.LayoutParams.MATCH_PARENT, android.view.ViewGroup.LayoutParams.MATCH_PARENT));
				
				GUIMod.crosshair.popup = new android.widget.PopupWindow();
				GUIMod.crosshair.popup.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT));
				GUIMod.crosshair.popup.setContentView(GUIMod.crosshair.image);
				GUIMod.crosshair.popup.setAnimationStyle(android.R.style.Animation_Translucent);
				GUIMod.crosshair.popup.setWidth(ViewGroup.LayoutParams.MATCH_PARENT);
				GUIMod.crosshair.popup.setHeight(ViewGroup.LayoutParams.MATCH_PARENT);
				GUIMod.crosshair.popup.setTouchable(false);
				GUIMod.crosshair.popup.showAtLocation(GUI.ctx.getWindow().getDecorView(), android.view.Gravity.CENTER | android.view.Gravity.CENTER, 0, 0);
			});
		},
		reload:function(){
			GUI.run(function(){
				if(GUIMod.crosshair.opened){
					GUIMod.crosshair.close();
					GUIMod.crosshair.open();
				}				
			});
		},
		close:function(){
			GUI.run(function(){
				GUIMod.crosshair.opened = false;
				GUIMod.crosshair.opened_gui = false;
				
				if(GUIMod.crosshair.popup!=null){
					GUIMod.crosshair.popup.dismiss();
					GUIMod.crosshair.popup = null;
				}
			});
		}
	},
	reload:{
		text:GUI.createText("reload"),
		popup:null,
		
		opened:false,
		
		open:function(){
			if(GUIMod.reload.opened == true) return;
			GUIMod.reload.opened = true;
			
			GUI.run(function(){
				GUIMod.reload.text = GUI.createText("reload");
				
				GUIMod.reload.popup = new android.widget.PopupWindow(GUIMod.reload.text, android.view.ViewGroup.LayoutParams.WRAP_CONTENT, android.view.ViewGroup.LayoutParams.WRAP_CONTENT);
				GUIMod.reload.popup.setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(android.graphics.Color.TRANSPARENT));
				GUIMod.reload.popup.setOutsideTouchable(false);
				GUIMod.reload.popup.setSplitTouchEnabled(true);
				GUIMod.reload.popup.showAtLocation(GUI.ctx.getWindow().getDecorView(), android.view.Gravity.CENTER | android.view.Gravity.BOTTOM, 0, GUI.getPixels(80));
			});
		},
		update:function(gun){
			GUI.run(function(){
				var item = Player.getCarriedItem();
				var extra = item.extra;
				GUIMod.reload.text.setText(extra.getInt("bullet")+"/"+gun.bullet.count);
			});
		},
		reload:function(gun){
			GUI.run(function(){
				GUIMod.reload.text.setOnClickListener(new android.view.View.OnClickListener() {
					onClick: function(b) {
						if(!isReloading)
							reloadAmmo(gun);
					}
				});
			});
		},
		close:function(){
			GUIMod.reload.opened = false;
			GUI.run(function(){
				if(GUIMod.reload.popup!=null){
					GUIMod.reload.popup.dismiss();
					GUIMod.reload.popup = null;
				}
			});
		}
	},
	
	open:function(gun, gui){
		if(!gui)gui = false;
		if(gui)
			this.crosshair.openGUI(gun);
		else
			this.crosshair.open();
		
		this.fire.open();
		this.aim.open();
		this.reload.open();
		this.reloadUI(gun, gui);
	},
	reloadUI:function(gun, gui){
		this.fire.reload(gun);
		this.aim.reload(gun);
		this.reload.reload(gun);
		this.reload.update(gun);
		if(gui != true)
			this.crosshair.reload(gun);
	},
	close:function(){
		this.fire.close();
		this.aim.close();
		this.reload.close();
		this.crosshair.close();
	}
};

var gunExtra = new ItemExtraData();
gunExtra.putInt('bullet', 0);

var ACCURACY = 0.55,
isAim = false,
isShooting = false,
isReloading = false,
selectGun = null;

var _LogError = Logger.LogError;
Logger.LogError = function(a,b){
	alert("[ERROR]{"+b+"}"+a);
	_LogError(a,b);
}

function angleInRadian(angle){
	return angle*Math.PI/180;
}

function lookDir(yaw, pitch){
	var vector = {};
	vector.y = Math.sin((pitch));
    vector.x = -Math.sin((yaw)) * Math.cos((pitch));
    vector.z = Math.cos((yaw)) * Math.cos((pitch));
	
    return vector
}

function getItemInInventory(ID,COUNT,DATA) {
	if(!COUNT) {
		COUNT = 1;
	}
	if(!DATA){
		DATA = 0;
	}
	for(var i = 9; i < 45; i++){
		var slot = Player.getInventorySlot(i);
		if(slot.id == ID && slot.count >= COUNT && slot.data == DATA){
			return i;
		}
	}
	return -1;
}


function getFovLevel(a){
	return 70 - a;
}

function getRate(rate){
	return 20/rate;
}

function getDefaultAccuracy(gun){
	return gun.accuracy;
}

function shotEntity(gun, vectorSpawn, vectorSpeed){
	if (vectorSpeed == null) {
        vectorSpeed = vectorSpawn
    }
	
	var ent_id = gun.bullet.entity || Native.EntityType.ARROW;
	
	var pp = Player.getPosition();
	var entity = Entity.spawn(pp.x + (vectorSpawn.x * 2), pp.y + (vectorSpawn.y * 2), pp.z + (vectorSpawn.z * 2), ent_id);
	Entity.setSkin(entity, "entity/bullet.png");
	Entity.moveToAngle(entity, vectorSpeed, gun.bullet);
	
	bullets[entity] = gun.bullet.damage;
	return entity;
}

function shotSingleBullet(gun){
	var angle = Entity.getLookAngle(Player.get());

	var d = lookDir(angle.yaw, angle.pitch);
	angle.yaw += angleInRadian(((Math.random() * ACCURACY) - (ACCURACY / 2)) * getDefaultAccuracy(gun));
	angle.pitch += angleInRadian(((Math.random() * ACCURACY) - (ACCURACY / 2)) * getDefaultAccuracy(gun));
	
	var a = shotEntity(gun, d, angle);
}

function shotShotgun(gun) {
	var shotParam = gun.shotgun;
	
    var angle = Entity.getLookAngle(Player.get());
	angle.yaw += angleInRadian(((Math.random() * ACCURACY) - (ACCURACY / 2)) * getDefaultAccuracy(gun));
	angle.pitch += angleInRadian(((Math.random() * ACCURACY) - (ACCURACY / 2)) * getDefaultAccuracy(gun));
	
	for(var i = 0; i < shotParam.count; i++){
		var yaw = angle.yaw + angleInRadian((Math.random() * shotParam.degreesSpread) - (shotParam.degreesSpread / 2));
		var pitch = angle.pitch + angleInRadian((Math.random() * shotParam.degreesSpread) - (shotParam.degreesSpread / 2));
		
		var d = lookDir(angle.yaw, angle.pitch);
		
		var a = shotEntity(gun, d, {yaw:yaw, pitch:pitch});
	}
}

var gunSound = new Sound();
var gunReloadSound = new Sound();
function shot(gun){	
	currentShotTicks = getRate(gun.rate);

	if(Player.getCarriedItem().extra.getInt('bullet')<=0){
		gunSound.setSource(gun.sounds.empty);
		gunSound.play();
		return false;
	}
	
	
	if(gun.shotType == ShootLib.ShotType.NORMAL)
		shotSingleBullet(gun);
	else if(gun.shotType == ShootLib.ShotType.MULTIPLE)
		shotShotgun(gun);
	
	
	var a = Entity.getLookAngle(Player.get());
	Entity.setLookAngle(Player.get(),a.yaw, a.pitch+angleInRadian(gun.recoil));
	
	var shootSound = new Sound(gun.sounds.shot);
	shootSound.setOnCompletion(function(){
		shootSound.destroy();
	});
	shootSound.play();
	
	var pi = Player.getCarriedItem();
	thisGunExtra = pi.extra;
	thisGunExtra.putInt('bullet', thisGunExtra.getInt('bullet')-1);
		
	Player.setCarriedItem(pi.id, pi.count, pi.data, thisGunExtra);
	GUIMod.reload.update(gun);
}

function reloadAmmo(gun){
	if(getItemInInventory(ItemID[gun.ammo]) != -1){
		isReloading = true;
		gunReloadSound.setSource(gun.sounds.reload);
		gunReloadSound.setOnCompletion(function(){
			isReloading = false;
			
			var slot_id = getItemInInventory(ItemID[gun.ammo]);
			var slot = Player.getInventorySlot(slot_id);
			if((slot.count - 1) > 0)
				Player.setInventorySlot(slot_id, slot.id, slot.count-1, slot.data);
			else
				Player.setInventorySlot(slot_id, 0, 0, 0);
			
			var a = Player.getCarriedItem();
			a.extra.putInt("bullet", gun.bullet.count);
			Player.setCarriedItem(a.id, a.count, a.data, a.extra);
			
			GUIMod.reload.update(gun);
		});
		gunReloadSound.play();
	}else{
		GUIMod.reload.text.setText("Not ammo...");
	}
}

function reloadVaribles(){
	Player.resetFov();
	gunReloadSound.stop();
	
	isAim = false;
	isReloading = false;
	isShooting = false;
	currentShotTicks = 0;
}

Callback.addCallback("PostLoaded", function(){
	_shootlib.createGuns();
	_shootlib.createAmmos();
	Callback.invokeCallback("GunsDefined");
});

var currentScreen = "null", oldItem = {id:0}, oldSlot = 0;
Callback.addCallback("NativeGuiChanged", function(a){
	switch (a) {
        case "play_screen - worlds":
            currentScreen = "not_in_game";
            break;
        case "hud_screen":
        case "in_game_play_screen":
            if (currentScreen != "not_in_game" && currentScreen != "hud_screen") {
                oldItem = {id:0};
            }
            currentScreen = "hud_screen";
            break;
        default:
			GUIMod.close();
            currentScreen = a;
			break;
    }
});
Callback.addCallback("tick", function(){
	if(currentScreen == "hud_screen" || currentScreen == "null") {
		if (Player.getCarriedItem().id != oldItem.id) {
			Callback.invokeCallback("ChangeCarriedItem", Player.getCarriedItem(), oldItem);
		} else {
			if (Player.getSelectedSlotId() != oldSlot) {
				Callback.invokeCallback("ChangeCarriedItem", Player.getCarriedItem(), oldItem);
			}
		}
		oldItem = Player.getCarriedItem();
		oldSlot = Player.getSelectedSlotId();
	}
	
	if (isShooting) {
		
		new java.lang.Runnable({
			run: function() {
				if(currentShotTicks <= 0){
					shot(selectGun);
				}
			}
		}).run();
	}
	
	if (currentShotTicks > 0) {
		currentShotTicks--;
	}
});

Callback.addCallback("ChangeCarriedItem", function(n,o){
	reloadVaribles();
	
	if(ShootLib.isGun(n)){
		if(n.extra==null){
			Player.setCarriedItem(n.id, n.count, n.data, gunExtra);
		}
	}
	
	
	if(ShootLib.isGun(n) && ShootLib.isGun(o)){
		GUIMod.reloadUI(ShootLib.getGun(n));
	}else if(!ShootLib.isGun(n) && ShootLib.isGun(o)){
		GUIMod.close();
	}else if(ShootLib.isGun(n) && !ShootLib.isGun(o)){
		GUIMod.open(ShootLib.getGun(n));
	}
});

var bullets = {},
entitys_hurt = {};
Callback.addCallback("ProjectileHit", function (p,i,t) {
	if(bullets.hasOwnProperty(p)){
		if(t.entity == -1){
			Entity.remove(p)
		}else{
			entitys_hurt[t.entity] = bullets[p];
			Entity.remove(p);
		}
		delete(bullets[p]);
	}
});

Callback.addCallback("EntityHurt", function (a,v) {
	if(a == Player.get() && entitys_hurt.hasOwnProperty(v)){
		if(entitys_hurt[v] == ShootLib.MAX_DAMAGE){
			Entity.damageEntity(v, Entity.getHealth(v));
		}else{
			Entity.damageEntity(v, entitys_hurt[v]);
		}
		delete(entitys_hurt[v]);
		Game.prevent();
	}	
});

Callback.addCallback("DestroyBlockStart", function(){
	if(ShootLib.isGun(Player.getCarriedItem())){
		Game.prevent();
	}
});

EXPORT("ShootLib", ShootLib);
EXPORT("Entity", Entity);