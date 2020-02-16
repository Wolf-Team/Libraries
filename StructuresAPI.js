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
    version: 3,
    shared: false,
    api: "CoreEngine"
});

var StructuresDB = {
	structures:{},
	dir:"structures"
}

var Structure = function(name, alerted){
	if(alerted === undefined) alerted = true;
	this.getName = function(){
		return name;
	}
	
	var structure = [];
	var chests = {};
	
	/* READ STRUCTURE */
	if(!StructuresDB.structures.hasOwnProperty(name)){
		StructuresDB.structures[name] = this;

		var path = __dir__ + StructuresDB.dir + "/" + name + ".struct";

		if(FileTools.isExists(path)){
			read = JSON.parse(FileTools.ReadText(path));
			if(read){
				if(read.version){
					switch(read.version){
						case 1:
							structure = read.struture;
							if(read.chests)
								chests = read.chests;

						break;
						default:
							Translation.sprintf("Unknown version \"%s\".", read.version);
						break;
					}
				}else{
					structure = read;
				}
			}
		}else{
			if(alerted) alert(Translation.sprintf("Structure \"%s\" not found.", name));
		}	
	}
	
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
					id:slot.id,
					data:slot.data,
					count:slot.count
				};
				chest.push([i, item]);
			}

		}
		chests[name] = chest;
	}
	
	this.save = function(){
		if(!FileTools.isExists(__dir__ + StructuresDB.dir))
			FileTools.mkdir(__dir__ + StructuresDB.dir);
		
		for(var i = 0; i < structure.length; i++){
			if(structure[i][3] && !structure[i][3].id){
				structure[i][3] = getBlockSID(structure[i][3]);
			}else{
				structure[i][3].id = getBlockSID(structure[i][3].id);
			
				if(structure[i][3].data == 0)
					structure[i][3] = structure[i][3].id;
			}
		}
		
		let saveObject = {
			version:1,
			struture:structure
		};

		if(Object.keys(chests).length){
			for(let i in chests){
				for(let j = 0, l = chests[i].length; j < l; j++){
					chests[i][j][1].id = getBlockSID(chests[i][j][1].id);
				}
			}
			saveObject.chests = chests;
		}

		FileTools.WriteText(__dir__ + StructuresDB.dir + "/" + name + ".struct", JSON.stringify(saveObject));
	}
	
	this.get = function(x, y, z, rotate_y){
		if(rotate_y === undefined) rotate_y = false;
		var rotates = rotate_y == true ? Structure.ROTATE_Y : Structure.ROTATE_ALL;
		
		for(var i = 0; i < rotates.length; i++){
			var rotate = rotates[i];
			for(var k = 0; k < structure.length; k++){
				var block = structure[k], id, data =0;
				var dx = block[0] * rotate[0] + block[1] * rotate[1] + block[2] * rotate[2];
				var dy = block[0] * rotate[3] + block[1] * rotate[4] + block[2] * rotate[5];
				var dz = block[0] * rotate[6] + block[1] * rotate[7] + block[2] * rotate[8];
				
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
				
				if(_block.id == id && _block.data == data && k == structure.length-1) return true;
				
			}
		}
		
		return false;
	}

	this.set = function (x, y, z, rotate, destroy, progressively, time) {
		if (rotate === undefined) rotate = Structure.ROTATE_NONE;
		if (destroy === undefined) destroy = false;
		if (progressively === undefined) progressively = false;
		if (time === undefined) time = 0;

		if (rotate[0] instanceof Array) {
			if (rotate.indexOf(Structure.ROTATE_NONE) == -1)
				rotate.push(Structure.ROTATE_NONE);

			rotate = rotate[Math.round(rand(0, rotate.length - 1))];
		}

		new java.lang.Thread(function () {
			for (var i = 0; i < structure.length; i++) {
				var block = structure[i];
				var id, data = 0;

				if (typeof block[3] == "number") {
					id = block[3];
				} else {
					id = block[3].id || 2;
					data = block[3].data || block[3].meta || 0;
				}

				var dx = block[0] * rotate[0] + block[1] * rotate[1] + block[2] * rotate[2];
				var dy = block[0] * rotate[3] + block[1] * rotate[4] + block[2] * rotate[5];
				var dz = block[0] * rotate[6] + block[1] * rotate[7] + block[2] * rotate[8];

				if (!destroy){
					World.setBlock(x + dx, y + dy, z + dz, id, data);
					if(block[4]){
						let TE = World.getContainer(x + dx, y + dy, z + dz);

						let chest = chests[block[4]];
						for(let i = 0, l = chest.length; i < l; i++){
							TE.setSlot(chest[i][0], chest[i][1].id, chest[i][1].count, chest[i][1].data || 0);
						}
					}
				}else{
					World.setBlock(x + dx, y + dy, z + dz, 0, 0)
				}

				if(progressively)java.lang.Thread.sleep(time || 100);
			}
		}).start();
	}
};

/* ROTATE CONSTANTS */
Structure.ROTATE_NONE = [
	1,0,0,
	0,1,0,
	0,0,1
];
	
Structure.ROTATE_90Y = [
	0,0,1,
	0,1,0,
	-1,0,0
];
Structure.ROTATE_180Y = [
	0,0,1,
	0,1,0,
	1,0,0
];
Structure.ROTATE_270Y = [
	0,0,-1,
	0,1,0,
	1,0,0
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
	Structure.ROTATE_90Y,
	Structure.ROTATE_270Y,
	Structure.ROTATE_180Y,
	Structure.ROTATE_NONE
];

Structure.get = function(name, alerted) {
	if(StructuresDB.structures.hasOwnProperty(name))
		return StructuresDB.structures[name];
	else
		return new Structure(name, alerted);
}
Structure.init = function(folderName){
	if(typeof dir != "string" && !(dir instanceof java.lang.String))
		throw "dir is not string.";
		
	StructuresDB.dir = dir;
}


/* OTHER FUNCTIONS */
function rand(min, max){
	if(min === undefined)min=0;
	if(max === undefined)max=min+1;
	
	return (max-min) * Math.random() + min;
}

function getBlockSID(ID){
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
				let chest = 0;
				
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
							
							if([54, 61, 62, 154].indexOf(block.id) != -1){
								struct.addBlock(x - center_x, y - center_y, z - center_z, block, "chest_"+chest);
								struct.addChest("chest_"+chest, World.getContainer(x, y, z));
								chest++;
							} else {
								struct.addBlock(x - center_x, y - center_y, z - center_z, block);
							}

						}
				
				struct.save();
				Game.message(Translation.sprintf("Saved to %s", StructuresAPI.dir+"/"+args[0]+".struct"));
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

/* OUTDATED */
var StructuresAPI = {
	
	dir:"structures",
	structures:{},
	
	init:function(dir){
		if(typeof dir != "string" && !(dir instanceof java.lang.String))
			throw "dir is not string.";
		
		this.dir = dir;
	},
	
	get:function(name){
		if(!this.structures.hasOwnProperty(name)){
			var path = __dir__ + this.dir + "/" + name + ".struct";
			
			if(FileTools.isExists(path)){
				this.structures[name] = JSON.parse(FileTools.ReadText(path));
			}else{
				alert(Translation.sprintf("Structure \"%s\" not found.", name));
				return false;
			}
		}
		return this.structures[name];
	},
	
	getStructures:function(name, x, y, z, rotate_y){
		if(rotate_y === undefined) rotate_y = false;
		var rotates = rotate_y == true ? StructuresAPI.ROTATE_Y : StructuresAPI.ROTATE_ALL;
		
		var struct = this.get(name);
		if(struct == false) return;
		
		for(var i = 0; i < rotates.length; i++){
			var rotate = rotates[i];
			for(var k = 0; k < struct.length; k++){
				var block = struct[k], id, data =0;
				var dx = block[0] * rotate[0] + block[1] * rotate[1] + block[2] * rotate[2];
				var dy = block[0] * rotate[3] + block[1] * rotate[4] + block[2] * rotate[5];
				var dz = block[0] * rotate[6] + block[1] * rotate[7] + block[2] * rotate[8];
				
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
				
				if(_block.id == id && _block.data == data && k == struct.length-1) return true;
				
			}
		}
		
		return false;
	},
	
	save:function(name, obj){
		if(!FileTools.isExists(__dir__ + this.dir))
			FileTools.mkdir(__dir__ + this.dir);
		
		for(var i = 0; i < obj.length; i++){
			obj[i][3].id = getBlockSID(obj[i][3].id);
			
			if(obj[i][3].data == 0)
				obj[i][3] = obj[i][3].id;
		}
		
		this.structures[name] = obj;
		FileTools.WriteText(__dir__ + this.dir + "/" + name + ".struct", JSON.stringify(obj));
	},
	
	set: function (name, x, y, z,rotate, destroy, progressively, time) {
		if (rotate === undefined) rotate = StructuresAPI.ROTATE_NONE;

		if (rotate[0] instanceof Array) {
			if (rotate.indexOf(StructuresAPI.ROTATE_NONE) == -1)
				rotate.push(StructuresAPI.ROTATE_NONE);

			rotate = rotate[Math.round(rand(0, rotate.length - 1))];
		}

		var arr = this.get(name);

		if (arr === false) return false;
		new java.lang.Thread(function () {
			for (var i = 0; i < arr.length; i++) {
				var block = arr[i];
				var id, data = 0;

				if (typeof block[3] == "number") {
					id = block[3];
				} else {
					id = block[3].id || 2;
					data = block[3].data || block[3].meta || 0;
				}

				var dx = block[0] * rotate[0] + block[1] * rotate[1] + block[2] * rotate[2];
				var dy = block[0] * rotate[3] + block[1] * rotate[4] + block[2] * rotate[5];
				var dz = block[0] * rotate[6] + block[1] * rotate[7] + block[2] * rotate[8];

				if (!destroy) World.setBlock(x + dx, y + dy, z + dz, id, data)
				else World.setBlock(x + dx, y + dy, z + dz, 0, 0)
				if(progressively)java.lang.Thread.sleep(time || 100);
			}
		}).start();
	}
}

StructuresAPI.ROTATE_RANDOM = [
	StructuresAPI.ROTATE_180X,
	StructuresAPI.ROTATE_180Y,
	StructuresAPI.ROTATE_180Z,
	StructuresAPI.ROTATE_270X,
	StructuresAPI.ROTATE_270Y,
	StructuresAPI.ROTATE_270Z,
	StructuresAPI.ROTATE_90X,
	StructuresAPI.ROTATE_90Y,
	StructuresAPI.ROTATE_90Z,
	StructuresAPI.ROTATE_NONE
];
StructuresAPI.ROTATE_ALL = StructuresAPI.ROTATE_RANDOM;
StructuresAPI.ROTATE_Y = [
	StructuresAPI.ROTATE_90Y,
	StructuresAPI.ROTATE_270Y,
	StructuresAPI.ROTATE_180Y,
	StructuresAPI.ROTATE_NONE
];
EXPORT("StructuresAPI", StructuresAPI);