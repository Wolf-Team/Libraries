/*
  _____ _                   _                           _     ____  ___ 
 / ____| |_ _ __ _   _  ___| |_ _   _ _ __  ___  ___   / \   |  _ \|_ _|
 \___ \| __| '__| | | |/ __| __| | | | '__|/ _ \/ __| / _ \  | |_) || | 
  ___) | |_| |  | |_| | (__| |_| |_| | |  |  __/\__ \/ ___ \ |  __/ | | 
 |____/ \__|_|   \__,_|\___|\__|\__,_|_|   \___||___/_/   \_\|_|   |___|
                                                                                              
                                                                
    StructuresAPI

    Внимание! Запрещено:
    1.Распространение библиотеки на сторонних источниках без указание ссылки на официальное сообщество
    2.Изменение кода
    3.Явное копирование кода

    Используя библиотеку вы автоматически соглашаетесь с этими правилами.

    ©WolfTeam ( https://vk.com/wolf___team )
*/
/*  ChangeLog:
	v1.3
	- StructuresAPI удален.
	- Добавлен объект Rotate. Используется для сложных поворотов.
	- Метод структуры get был изменен. struct.get(x, y, z, rotates, return_index).
	- Метод структуры set был изменен. struct.set(x, y, z, rotate, progressively, time).
	- Добавлен метод destroy(x, y, z, rotates, progressively, time) для структуры.
	- Добавлен метод check(...) для структуры. Эквивалентен методу get(...).
	- Добавлен метод Structure.setInWorld(name, ...). Альтернатива Structure.get(name).set(...).
	- Добавлен метод Structure.destroyInWorld(name, ...). Альтернатива Structure.get(name).destroy(...).
	- Добавлены константы Structure.PROGRESSIVELY и Structure.NOT_PROGRESSIVELY.
	- Добавлены константы Structure.MIRROR_X, Structure.MIRROR_Y и Structure.MIRROR_Z.
	- Исправлена установка блоков добавленных модом.
	- Исправлено сохранение предметов и блоков.
	- Исправлен поворот на 180 градусов по Y.
	- Сохраняются TileEntity
	v1.2
	- Библиотека переписана. Объект StructuresAPI устарел.
	- Сохраняется содержимое сундуков, печей и воронок
	v1.1
	- Добавлен метод StructuresAPI.init(string NameFolder) - Задает папку со структурами.
	- Изменен метод StructuresAPI.set(name, x, y, z, rotate, destroy, progressively, time) - Добавлены параметры (Автор ToxesFoxes https://vk.com/tmm_corporation )
	 * destroy - Если true, структура будет "уничтожаться"
	 * progressively - Если true, структура будет постепенно "строиться/уничтожаться"
	 * time - Время в миллисекундах между установкой/уничтожением блоков
*/

LIBRARY({
    name: "StructuresAPI",
    version: 5,
    shared: false,
    api: "CoreEngine"
});

var StructuresDB = {
	structures:{},
	dir:"structures",
	versionSaver:2
}

var Structure = function(name, alerted){
	if(alerted === undefined) alerted = true;
	this.getName = function(){
		return name;
	}
	
	if(!StructuresDB.structures.hasOwnProperty(name))
		StructuresDB.structures[name] = this;
	
	var structure = [];
	var chests = {};
	var TileEntitys = {};
	
	this.clear = function(){
		structure = [];
		chests = {};
	}
	
	this.addBlock = function(x,y,z, block, data, name_te){
		if(typeof block == 'number'){
			block = {
				id:block,
				data: data || 0
			};
		}else{
			name_te = data;
		}

		
		structure.push([x,y,z, block, name_te]);
	}

	this.addChest = function(name, te){
		let chest = [];
		let size = te.getSize();

		for(let i = 0; i < size; i++){
			let slot = te.getSlot(i);
			if(slot && slot.id != 0 && slot.count > 0){
				let item = {
					id: getSID(slot.id),
					data:slot.data,
					count:slot.count
				};
				chest.push([i, item]);
			}

		}
		chests[name] = chest;
	}
	
	this.addTileEntity = function(name, te){
		TileEntitys[name] = {
			data:te.data
		};
		
		let slots = te.container.slots;
		let _slots = {};
		for(let i in slots){
			if(slots[i].id){
				_slots[i] = {
					id:getSID(slots[i].id),
					count:slots[i].count,
					data:slots[i].data
				};
			}
		}
		
		if(Object.keys(_slots).length)
			TileEntitys[name].slots = _slots;
	}
	
	this.save = function(){
		if(!FileTools.isExists(__dir__ + StructuresDB.dir))
			FileTools.mkdir(__dir__ + StructuresDB.dir);
		
		for(var i = 0; i < structure.length; i++){
			if(structure[i][3] && !structure[i][3].id){
				structure[i][3] = getSID(structure[i][3]);
			}else{
				structure[i][3].id = getSID(structure[i][3].id);
			
				if(structure[i][3].data == 0)
					structure[i][3] = structure[i][3].id;
			}
		}
		
		let saveObject = {
			version:StructuresDB.versionSaver,
			structure:structure
		};

		if(Object.keys(chests).length){
			for(let i in chests){
				for(let j = 0, l = chests[i].length; j < l; j++){
					chests[i][j][1].id = getSID(chests[i][j][1].id);
				}
			}
			saveObject.chests = chests;
		}
		
		if(Object.keys(TileEntitys).length)
			saveObject.te = TileEntitys;

		FileTools.WriteText(__dir__ + StructuresDB.dir + "/" + name + ".struct", JSON.stringify(saveObject));
	}
	
	this.get = function(x, y, z, rotates, return_index){
		if(rotates == undefined) rotates = [Structure.ROTATE_NONE];
		if(rotates === true) rotates = Structure.ROTATE_Y;
		
		if(rotates instanceof Array && !(rotates[0] instanceof Array || rotates[0] instanceof Rotate)){
			rotates = [rotates];
		}
		
		
		for(var i = 0; i < rotates.length; i++){
			
			var rotate = rotates[i];
			
			if(rotate instanceof Array && !(rotate[0] instanceof Array))
				rotate = [rotate];
				
			if(rotate instanceof Rotate)
				rotate = rotate.get();
			
			for(var k = 0; k < structure.length; k++){
				var block = structure[k], id, data = 0;
				
				var dx = block[0];
				var dy = block[1];
				var dz = block[2];
				
				for(let j = 0, l = rotate.length; j < l; j++){
					let _dx = dx * rotate[j][0] + dy * rotate[j][1] + dz * rotate[j][2];
					let _dy = dx * rotate[j][3] + dy * rotate[j][4] + dz * rotate[j][5];
					let _dz = dx * rotate[j][6] + dy * rotate[j][7] + dz * rotate[j][8];
					dx = _dx;
					dy = _dy;
					dz = _dz;
				}
				
				if(typeof block[3] == "number")
					id = block[3];
				else if(typeof block[3] == "string")
					id = BlockID[block[3]];
				else{
					id = block[3].id;
					data = block[3].data;
				}
					
				_block = World.getBlock(x + dx, y+dy, z+dz);
				if(_block.id != id || _block.data != data) break;
				
				if(_block.id == id && _block.data == data && k == structure.length-1)
					return return_index ? i : true;
				
			}
		}
		
		return return_index ? -1 : false;
	}
	
	this.check = this.get;
	
	this.set = function(x, y, z, rotate, progressively, time){
		if (rotate === undefined) rotate = Structure.ROTATE_NONE;
		if (progressively === undefined) progressively = Structure.NOT_PROGRESSIVELY;
		if (time === undefined) time = 0;
		
		if(rotate instanceof Array && (rotate[0] instanceof Array || rotate[0] instanceof Rotate))
			rotate = rotate[Math.round(rand(0, rotate.length - 1))];
		
		if(rotate instanceof Rotate)
			rotate = rotate.get();
		else
			rotate = [rotate];
		
		new java.lang.Thread(function () {
			for (var i = 0; i < structure.length; i++) {
				var block = structure[i];
				var id, data = 0;

				if(typeof block[3] == "number")
					id = block[3];
				else if(typeof block[3] == "string")
					id = BlockID[block[3]];
				else{
					id = block[3].id || 1;
					data = block[3].data;
				}
				
				var dx = block[0];
				var dy = block[1];
				var dz = block[2];
				
				for(var j = 0, l = rotate.length; j < l; j++){
					let _dx = dx * rotate[j][0] + dy * rotate[j][1] + dz * rotate[j][2];
					let _dy = dx * rotate[j][3] + dy * rotate[j][4] + dz * rotate[j][5];
					let _dz = dx * rotate[j][6] + dy * rotate[j][7] + dz * rotate[j][8];
					dx = _dx;
					dy = _dy;
					dz = _dz;
				}
				
				World.setBlock(x + dx, y + dy, z + dz, id, data);
				if(block[4]){
					if([54, 61, 62, 154].indexOf(id) != -1){
						let TE = World.getContainer(x + dx, y + dy, z + dz);

						let chest = chests[block[4]];
						for(let j = 0, l = chest.length; j < l; j++){
							let item_id = chest[j][1].id;
							
							if(isNaN(parseInt(item_id)))
								item_id = BlockID[item_id] || ItemID[item_id];
							
							TE.setSlot(chest[j][0], item_id, chest[j][1].count, chest[j][1].data || 0);
						}
					}else{
						let te_storage = TileEntitys[block[4]];
						let TE = World.addTileEntity(x + dx, y + dy, z + dz);
						TE.data = te_storage.data;
						
						if(te_storage.slots){
							for(let j in te_storage.slots){
								let slot = te_storage.slots[j];
								let item_id = slot.id;
								
								if(isNaN(parseInt(item_id)))
									item_id = BlockID[item_id] || ItemID[item_id];
								
								TE.container.setSlot(j, item_id, slot.count, slot.data);
							}
						}
					}
				}

				if(progressively)java.lang.Thread.sleep(time || 100);
			}
		}).start();
	}
	
	this.destroy = function(x,y,z, rotates, progressively, time){
		if (rotates === undefined) rotates = Structure.ROTATE_NONE;
		if (progressively === undefined) progressively = Structure.NOT_PROGRESSIVELY;
		if (time === undefined) time = 100;
		
		let index = this.get(x, y, z, rotates, true);
		if(index != -1){
			let rotate = rotates[index];
			
			if(rotate instanceof Array && !(rotate[0] instanceof Array))
				rotate = [rotate];
				
			if(rotate instanceof Rotate)
				rotate = rotate.get();
			
			new java.lang.Thread(function () {
				for (var i = 0; i < structure.length; i++) {
					var block = structure[i];
					
					var dx = block[0];
					var dy = block[1];
					var dz = block[2];
					
					for(var j = 0, l = rotate.length; j < l; j++){
						let _dx = dx * rotate[j][0] + dy * rotate[j][1] + dz * rotate[j][2];
						let _dy = dx * rotate[j][3] + dy * rotate[j][4] + dz * rotate[j][5];
						let _dz = dx * rotate[j][6] + dy * rotate[j][7] + dz * rotate[j][8];
						dx = _dx;
						dy = _dy;
						dz = _dz;
					}
					
					World.setBlock(x + dx, y + dy, z + dz, 0);

					if(progressively)
						java.lang.Thread.sleep(time);
				}
			}).start();
		
		}
	}

	/* READ STRUCTURE */
	var path = __dir__ + StructuresDB.dir + "/" + name + ".struct";

	if(FileTools.isExists(path)){
		read = JSON.parse(FileTools.ReadText(path));
		if(read){
			let version = 0;
			if(read.version){
				version = read.version;
				switch(read.version){
					case 2:
						structure = read.structure;
						if(read.chests) chests = read.chests;
						if(read.te) TileEntitys = read.te;
					break;
					case 1:
						structure = read.struture;
						if(read.chests) chests = read.chests;
					break;
					default:
						Translation.sprintf("Unknown version \"%s\".", read.version);
					break;
				}
			}else{
				structure = read;
			}
			
			if(version!=StructuresDB.version)
				this.save();
		}
	}else{
		if(alerted) alert(Translation.sprintf("Structure \"%s\" not found.", name));
	}	
};

var Rotate = function(r){
	var rotates = [];
	
	this.addRotate = function(matrix){
		if(!matrix instanceof Array && !matrix instanceof Rotate)
			throw "is not matrix";
		
		if(matrix instanceof Rotate)
			return this.addRotates(matrix.get());
		
		if(matrix.length != 9) throw "Not 9 number";
		
		for(let i = 0; i < 9; i++)
			if(Math.abs(matrix[i]) > 1)
				throw "Not normal matrix";
		
		rotates.push(matrix);
	}
	
	this.add = this.addRotate;
	
	this.addRotates = function(rotates){
		if(!rotates instanceof Array) throw "is not array";
		
		for(let i = 0; i < rotates.length; i++)
			this.addRotate(rotates[i]);
	}
	
	this.adds = this.addRotates;
	
	this.get = function(){
		return rotates;
	}

	if(r){
		if(r instanceof Array && (r[0] instanceof Array || r[0] instanceof Rotate)){
			this.addRotates(r);
		}else{
			this.addRotate(r);
		}
	}
}

/* ROTATE CONSTANTS */
Structure.ROTATE_NONE = [
	1,0,0,
	0,1,0,
	0,0,1
];
	
Structure.ROTATE_90Y = [
	0,0,-1,
	0,1,0,
	1,0,0
];
Structure.ROTATE_180Y = [
	-1,0,0,
	0,1,0,
	0,0,-1
];
Structure.ROTATE_270Y = [
	0,0,1,
	0,1,0,
	-1,0,0
];
	
Structure.ROTATE_90X = [
	1,0,0,
	0,0,-1,
	0,1,0
];
Structure.ROTATE_180X = [
	1,0,0,
	0,-1,0,
	0,0,-1
];
Structure.ROTATE_270X = [
	1,0,0,
	0,0,1,
	0,-1,0
];
	
Structure.ROTATE_90Z = [
	0,-1,0,
	1,0,0,
	0,0,1
];
Structure.ROTATE_180Z = [
	-1,0,0,
	0,-1,0,
	0,0,1
];
Structure.ROTATE_270Z = [
	0,1,0,
	-1,0,0,
	0,0,1
];

Structure.ROTATE_RANDOM = [
	Structure.ROTATE_180X,
	Structure.ROTATE_180Y,
	Structure.ROTATE_180Z,
	Structure.ROTATE_270X,
	Structure.ROTATE_270Y,
	Structure.ROTATE_270Z,
	Structure.ROTATE_90X,
	Structure.ROTATE_90Y,
	Structure.ROTATE_90Z,
	Structure.ROTATE_NONE
];
Structure.ROTATE_ALL = Structure.ROTATE_RANDOM;
Structure.ROTATE_Y = [
	Structure.ROTATE_NONE,
	Structure.ROTATE_90Y,
	Structure.ROTATE_180Y,
	Structure.ROTATE_270Y
];

Structure.MIRROR_X = [
	-1,0,0,
	0,1,0,
	0,0,1
];
Structure.MIRROR_Y = [
	1,0,0,
	0,-1,0,
	0,0,1
];
Structure.MIRROR_Z = [
	1,0,0,
	0,1,0,
	0,0,-1
];

Structure.PROGRESSIVELY = true;
Structure.NOT_PROGRESSIVELY = false;

Structure.get = function(name, alerted) {
	if(StructuresDB.structures.hasOwnProperty(name))
		return StructuresDB.structures[name];
	else
		return new Structure(name, alerted);
}
Structure.init = function(dir){
	if(typeof dir != "string" && !(dir instanceof java.lang.String))
		throw "dir is not string.";
		
	StructuresDB.dir = dir;
}
Structure.setInWorld = function(name, x, y, z, rotate, progressively, time){
	Structure.get(name).set(x, y, z, rotate, progressively, time);
}
Structure.destroyInWorld = function(name, x, y, z, rotate, progressively, time){
	Structure.get(name).destroy(x, y, z, rotate, progressively, time);
}

/* OTHER FUNCTIONS */
function rand(min, max){
	if(min === undefined)min=0;
	if(max === undefined)max=min+1;
	
	return (max-min) * Math.random() + min;
}

function getSID(ID){
	return IDRegistry.getNameByID(ID) || ID;
}


/* WorldEdit */
if(JSON.parse(FileTools.ReadText(__dir__+"build.config")).defaultConfig.buildType == "develop"){
	ModAPI.addAPICallback("WorldEdit", function(WorldEdit){
		var g_center = null;
		
		Callback.addCallback("ItemUse", function(c,i){
			if(i.id == 268){
				g_center = c;
				Game.message("Центр установлен.");
			}
			if(i.id == 271){
				g_center = null;
			}
		});
		Callback.addCallback("DestroyBlockStart", function() {
			if(Player.getCarriedItem().id == 271){
				g_center = null;
			}
		});
		
		WorldEdit.addCommand({
			name:"/save",
			description:"Save structure.",
			args:"<file_name> [-a] [-x] [-y] [-z]",
			selectedArea:true,
			event:function(args){
				var pos = WorldEdit.getPosition();
				let chest = 0, te = 0;
				
				let struct = Structure.get(args[0], false);
				struct.clear();
				
				var center_x = args.indexOf("-x")!=-1 ? args[args.indexOf("-x") + 1] : g_center!= null? g_center.x : pos.pos1.x;
				var center_y = args.indexOf("-y")!=-1 ? args[args.indexOf("-y") + 1] : g_center!= null? g_center.y : pos.pos1.y;
				var center_z = args.indexOf("-z")!=-1 ? args[args.indexOf("-z") + 1] : g_center!= null? g_center.z : pos.pos1.z;
				
				for(x = pos.pos1.x; x <= pos.pos2.x; x++)
					for(y = pos.pos1.y; y <= pos.pos2.y; y++)
						for(z = pos.pos1.z; z <= pos.pos2.z; z++){
							var block = World.getBlock(x,y,z);
							if(args.indexOf("-a") == -1 && block.id == 0) continue;
							
							let TE = World.getTileEntity(x,y,z);
							
							if([54, 61, 62, 154].indexOf(block.id) != -1){
								struct.addBlock(x - center_x, y - center_y, z - center_z, block, "chest_" + chest);
								struct.addChest("chest_"+chest, World.getContainer(x, y, z));
								chest++;
							} else if(TE){
								struct.addBlock(x - center_x, y - center_y, z - center_z, block, "TE_" + te);
								struct.addTileEntity("TE_" + te, TE);
								te++;
							}else{
								struct.addBlock(x - center_x, y - center_y, z - center_z, block);
							}

						}
				
				struct.save();
				Game.message(Translation.sprintf("Saved to %s", StructuresDB.dir+"/"+args[0]+".struct"));
			}
		});
	});
}

/*Language*/
Translation.addTranslation("Saved to %s",{
	ru:"Сохранено в %s",
	en:"Saved to %s",
});
Translation.addTranslation("Save structure.",{
	ru:"Сохранить структуру.",
	en:"Save structure.",
});
Translation.addTranslation("Structure \"%s\" not found.",{
	ru:"Структура \"%s\" не найдена.",
	en:"Structure \"%s\" not found.",
});
Translation.addTranslation("Unknown version \"%s\".", {
	ru:"Неизвестная версия \"%s\".",
	en:"Unknown version \"%s\".",
});

if(!Translation.sprintf){
	Translation.sprintf = function(){
		var str = Translation.translate(arguments[0]);
		
		for(var i = 1; i < arguments.length; i++)
			str = str.replace("%s", arguments[i]);
		
		return str;
	};
}

EXPORT("Structure", Structure);
EXPORT("Rotate", Rotate);
