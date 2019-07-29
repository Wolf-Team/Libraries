LIBRARY({
    name: "StructuresAPI", // по этому имени библиотека будет импортирована
    version: 1, // код версии должен быть целым числом больше 0, при каждом обновлении библиотеки его надо увеличивать и указывать в документации к ней
    shared: false, // если true, то библиотека будет глобальной
    api: "CoreEngine" // название API, которое использует библиотека
});

var StructuresAPI = {
	ROTATE_NONE:[
		1,0,0,
		0,1,0,
		0,0,1
	],
	
	ROTATE_90Y: [
		0,0,1,
		0,1,0,
		-1,0,0
	],
	ROTATE_180Y:[
		0,0,1,
		0,1,0,
		1,0,0
	],
	ROTATE_270Y:[
		0,0,-1,
		0,1,0,
		1,0,0
	],
	
	ROTATE_90X: [
		1,0,0,
		0,0,-1,
		0,1,0
	],
	ROTATE_180X:[
		1,0,0,
		0,-1,0,
		0,0,-1
	],
	ROTATE_270X:[
		1,0,0,
		0,0,1,
		0,-1,0
	],
	
	ROTATE_90Z: [
		0,-1,0,
		1,0,0,
		0,0,1
	],
	ROTATE_180Z:[
		-1,0,0,
		0,-1,0,
		0,0,1
	],
	ROTATE_270Z:[
		0,1,0,
		-1,0,0,
		0,0,1
	],
	
	dir:"structures",
	structures:{},
	
	init:function(params){
		
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
	
	set:function(name, x, y, z, rotate){
		if(rotate === undefined)rotate = StructuresAPI.ROTATE_NONE;
			
		if(rotate[0] instanceof Array){
			if(rotate.indexOf(StructuresAPI.ROTATE_NONE) == -1)
				rotate.push(StructuresAPI.ROTATE_NONE);
			
			rotate = rotate[Math.round(rand(0, rotate.length-1))];
		}
		
		var arr = this.get(name);
		
		if(arr === false)return false;
		
		for(var i = 0; i < arr.length; i++){
			var block = arr[i];
			var id, data = 0;
			
			if(typeof block[3] == "number"){
				id = block[3];
			}else{
				id = block[3].id || 2;
				data = block[3].data || block[3].meta || 0;
			}
			
			var dx = block[0] * rotate[0] + block[1] * rotate[1] + block[2] * rotate[2];
			var dy = block[0] * rotate[3] + block[1] * rotate[4] + block[2] * rotate[5];
			var dz = block[0] * rotate[6] + block[1] * rotate[7] + block[2] * rotate[8];
			
			World.setBlock(x + dx, y + dy, z + dz, id, data) 
		}
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
				var arr = [];
				
				var center_x = args.indexOf("-x")!=-1 ? args[args.indexOf("-x") + 1] : g_center!= null? g_center.x : pos.pos1.x;
				var center_y = args.indexOf("-y")!=-1 ? args[args.indexOf("-y") + 1] : g_center!= null? g_center.y : pos.pos1.y;
				var center_z = args.indexOf("-z")!=-1 ? args[args.indexOf("-z") + 1] : g_center!= null? g_center.z : pos.pos1.z;
				
				for(x = pos.pos1.x; x <= pos.pos2.x; x++)
					for(y = pos.pos1.y; y <= pos.pos2.y; y++)
						for(z = pos.pos1.z; z <= pos.pos2.z; z++){
							var block = World.getBlock(x,y,z);
							if(args.indexOf("-a") == -1 && block.id == 0) continue;
							
							arr.push([
								x - center_x,
								y - center_y,
								z - center_z,
								block
							]);
						}
					
				StructuresAPI.save(args[0], arr);
				Game.message(Translation.sprintf("Saved to %s", StructuresAPI.dir+"/"+args[0]+".struct"));
			}
		});
	});
}

function rand(min, max){
	if(min === undefined)min=0;
	if(max === undefined)max=min+1;
	
	return (max-min) * Math.random() + min;
}


function getBlockSID(ID){
	return IDRegistry.getNameByID(ID) || ID;
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

if(!Translation.sprintf){
	Translation.sprintf = function(){
		var str = Translation.translate(arguments[0]);
		
		for(var i = 1; i < arguments.length; i++)
			str = str.replace("%s", arguments[i]);
		
		return str;
	};
}

EXPORT("StructuresAPI", StructuresAPI);