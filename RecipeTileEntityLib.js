/*
  ____             _            _____ _ _       _____       _   _ _         _     _ _     
 |  _ \  ___   ___(_)_ __   ___|_   _(_) | ___ | ____|_ __ | |_(_) |_ _   _| |   (_) |__  
 | |_) |/ _ \ / __| | '_ \ / _ \ | | | | |/ _ \|  _| | '_ \| __| | __| | | | |   | | '_ \ 
 |  _ <|  __/| (__| | |_) |  __/ | | | | |  __/| |___| | | | |_| | |_| |_| | |___| | |_) |
 |_| \_\\___| \___|_| .__/ \___| |_| |_|_|\___||_____|_| |_|\__|_|\__|\__, |_____|_|_.__/ 
                    |_|                                               |___/                     
                                                                
    RecipeTileEntityLib v1.1

    Внимание! Запрещено:
    1.Распространение библиотеки на сторонних источниках без указание ссылки на официальное сообщество
    2.Изменение кода
    3.Явное копирование кода

    Используя библиотеку вы автоматически соглашаетесь с этими правилами.

    ©WolfTeam ( https://vk.com/wolf___team )
 */
/*ChangeLog:
	v.1.1
		- Merge methods registerGridCraftTable and registerTimerGridCraftTable
		- Merge methods registerCraftTable and registerTimerCraftTable
		- Fixed method name from getTickResipes to getTickRecipes
		- Added the ability to use your item IDs.
		- For recipes, the time multiplier parameter has been added.
	v.1
		- release
*/
LIBRARY({
    name: "RecipeTileEntityLib",
    version: 1,
    api: "CoreEngine"
});

var RecipeTE = {
	
	mechanisms:{},//Механизмы
	recipes:{},//Рецепты
	
	registerMechanism:function(obj){
		var name = obj.name;
		this.mechanisms[name] = obj;
		this.recipes[name] = [];
	},
	
	registerGridCraftTable:function(name/*or obj*/, columns, rows, name_elements, timer){
		if(typeof name == "object"){
			rows = name.rows || 1;
			columns = name.columns || name.cols;
			timer = name.timer || name.time || name.progress || null;
			name_elements = name.elements || null;
			name = name.name;
		}
		
		if(!rows) rows = 1;
		
		if(typeof name_elements == "number"){
			timer = name_elements;
			name_elements = {};
		}
		
		if(!name_elements)
			name_elements = {};
		
		if(!name_elements.input)
			name_elements.input = "inputSlot";
		
		if(!name_elements.output)
			name_elements.output = "outputSlot";
		
		if(!name) throw "Задайте идентификатор механизма.";
		if(this.isRegistered(name)) throw "Механизм \""+name+"\" уже зарегистрирован.";
		
		if(!columns) throw "Задайте количество колонок в сетке механизма.";
		
		if(name_elements.input instanceof Array && name_elements.input != rows * columns)
			 throw "Кол-во входных слотов должно соответствовать "+(rows*columns)+"(rows*columns).";
		 
		var machine = {
			name:name,
			rows:rows,
			columns:columns
		};
		
		if(timer && timer > 0){
			machine.timer = timer;
			if(!name_elements.progress)
				name_elements.progress = "progressScale";
		}
		
		machine.elements = name_elements;
		
		this.registerMechanism(machine)
	},
	
	registerCraftTable:function(name/*or obj*/, slots, name_elements, timer){
		if(typeof name == "object"){
			slots = name.slots;
			name_elements = name.elements;
			timer = name.timer || name.time || name.progress || null;
			name = name.name;
		}
		this.registerGridCraftTable(name, slots, 1, name_elements, timer);
	},
	
	isRegistered:function(mechanism){
		return this.mechanisms.hasOwnProperty(mechanism);
	},
	
	getMechanism:function(name){
		if(this.isRegistered(name))
			return this.mechanisms[name];
		
		return false;
	},
	
	addRecipe:function(mechanism, result, recipe, ingridients, time_multiple, craft){
		if(!this.isRegistered(mechanism))
			throw "Механизм не зарегистрирован.";
		
		var mechanism_info = this.getMechanism(mechanism);
		
		if(typeof(result) == "string" || typeof(result) == "number"){
			result = {
				id:result,
				count:1,
				data:0
			};
		}
		
		if(typeof result.id == 'string'){
			if(ItemID[result.id])
				result.id = ItemID[result.id];
			else if(BlockID[result.id])
				result.id = BlockID[result.id]
			else
				throw "Не найден предмет "+result.id;
		}
		
		result.count = result.count || 1;
		result.data = result.data || 0;
		
		if(typeof recipe != "string")
			throw "Рецепт должен быть строкой";
		
		if(recipe.length > (mechanism_info.rows * mechanism_info.columns) )
			throw "Количество строк в рецепте не должны превешать, количество ячеек верстака.";
		
		if(typeof ingridients != "object" || ingridients instanceof Array)
			throw "Ингридиенты должны быть перечисленны через объект.";
			
		if(!ingridients.hasOwnProperty(" "))
                ingridients[" "] = {id:0, data:0};
            
        ingridients["air"] = {id:0, data:0};
		
		if(typeof time_multiple == "function"){
			craft = time_multiple;
			time_multiple = 1;
		}
		
        this.recipes[mechanism].push({
            recipe:recipe,
            ingridients:ingridients,
            result:result,
			time:time_multiple || 1,
            craft:craft || RecipeTE.defaultCraftEvent,
			type:"line"
        });
	},
	
	addGridRecipe:function(mechanism, result, recipe, ingridients, time_multiple, craft){
		if(!this.isRegistered(mechanism))
			throw "Механизм не зарегистрирован.";
		
		var mechanism_info = this.getMechanism(mechanism);
		
		if(typeof(result) == "string" || typeof(result) == "number"){
			result = {
				id:result,
				count:1,
				data:0
			};
		}
		
		if(typeof result.id == 'string'){
			if(ItemID[result.id])
				result.id = ItemID[result.id];
			else if(BlockID[result.id])
				result.id = BlockID[result.id]
			else
				throw "Не найден предмет "+result.id;
		}
		
		result.count = result.count || 1;
		result.data = result.data || 0;
		
		if(!recipe instanceof Array)
			throw "Рецепт должен быть массивом";
		
		if(recipe.length > mechanism_info.rows)
			throw "Количество строк в рецепте не должны превешать, количество строк сетки верстака.";
		
		for(var i = 1; i < recipe.length; i++){
            if(recipe[0].length != recipe[i].length)
                throw "Строки должны быть одной длинны";
			
			if(recipe[i].length > mechanism_info.columns){
				throw "Строка не должны быть больше, чем количество столбцов сетки верстака.";
			}
        }
        
		if(typeof ingridients != "object" || ingridients instanceof Array)
			throw "Ингридиенты должны быть перечисленны через объект.";
			
		if(!ingridients.hasOwnProperty(" "))
                ingridients[" "] = {id:0, data:0};
            
        ingridients["air"] = {id:0, data:0};
		
		if(typeof time_multiple == "function"){
			craft = time_multiple;
			time_multiple = 1;
		}
		
        this.recipes[mechanism].push({
            recipe:recipe,
            ingridients:ingridients,
            result:result,
			time:time_multiple || 1,
            craft:craft || RecipeTE.defaultCraftEvent,
			type:"grid"
        });
	},
	
	getRecipes:function(name){
		if(!this.isRegistered(name))
			throw "Механизм не зарегистрирован.";
		
		return this.recipes[name];
	},
	
	getTickRecipes:function(name, TE, condition){
		if(!condition) condition = function(){return true;};
		
		if(!this.isRegistered(name))
			throw "Механизм не зарегистрирован.";
		
		var mechanism = this.getMechanism(name);
		var changed = false;
		var result = false;
		var outputSlot = TE.container.getSlot(mechanism.elements.output);
		var resipes = this.getRecipes(name);
		if(resipes.length == 0) return false;
		
		if(!TE.data.resipete)
			TE.data.resipete = {};
		
		if(!TE.data.resipete.outputSlot)
			TE.data.resipete.outputSlot = {id:0, data:0, count:0};
		
		if(!TE.data.resipete.outputSlot)
			TE.data.resipete.outputSlot = {id:0, data:0, count:0};
		
		
		for(var i = 0; i < mechanism.rows; i++){
			for(var ii = 0; ii < mechanism.columns; ii++){
				var input_slot_name;
				if(typeof mechanism.elements.input == 'string')
					input_slot_name = mechanism.elements.input+ (i * mechanism.columns + ii);
				else
					input_slot_name = mechanism.elements.input[i * mechanism.columns + ii];
					

				var slot = TE.container.getSlot(input_slot_name);
				
				if(!TE.data.resipete[input_slot_name])
					TE.data.resipete[input_slot_name] = {id:0, data:0, count:0};
				
				if(	TE.data.resipete[input_slot_name].id != slot.id ||
					TE.data.resipete[input_slot_name].data!= slot.data ||
					TE.data.resipete[input_slot_name].count!= slot.count){
					changed = true;
				}
				
				TE.data.resipete[input_slot_name] = {
					id:slot.id,
					data:slot.data,
					count:slot.count
				};
				
			}
		}
		
		if(mechanism.timer){
			if(!TE.data.resipete.tick)
				TE.data.resipete.tick = 0;
			
			if(changed == false){
				if(TE.data.resipete.recipe != null){
					if(TE.data.resipete.tick < (mechanism.timer * TE.data.resipete.recipe.time)){
						if(condition(TE))
							TE.data.resipete.tick++;
						
					}else{
						TE.data.resipete.tick = 0;
						TE.container.setSlot(mechanism.elements.output, TE.data.resipete.recipe.result.id, outputSlot.count + TE.data.resipete.recipe.result.count, TE.data.resipete.recipe.result.data);
						
						if(TE.data.resipete.recipe.craft)
							TE.data.resipete.recipe.craft(TE, mechanism);
						else
							RecipeTE.defaultCraftEvent(TE, mechanism);
						
						TE.data.resipete.recipe = null;
					}
				}
				
				if(!condition(TE)){
					TE.data.resipete.tick = 0;
				}
			}
			
			if((TE.data.resipete.outputSlot.id != outputSlot.id ||
				TE.data.resipete.outputSlot.data != outputSlot.data ||
				TE.data.resipete.outputSlot.count != outputSlot.count)){
				
				if(TE.data.resipete.outputSlot.id == outputSlot.id && TE.data.resipete.outputSlot.count-1 == outputSlot.count){
					Player.addItemToInventory(outputSlot.id, outputSlot.count, outputSlot.data);
					TE.container.clearSlot(mechanism.elements.output);
				}
				if(TE.data.resipete.recipe == null){
					changed = true;
				}
			}
			
			if(changed === true){
				//Должно происходить при изменении
				resipe_label: for(var a in resipes){
					var recipe = resipes[a];
					switch(recipe.type){
						case "grid":
							var state = 0;
					
							var _i = 0, _ii = 0;
							
							for(var i = 0; i < mechanism.rows; i++){//lines
								for(var ii = 0; ii < mechanism.columns; ii++){//columns
									var input_slot_name;
									if(typeof mechanism.elements.input == 'string')
										input_slot_name = mechanism.elements.input+ (i * mechanism.columns + ii);
									else
										input_slot_name = mechanism.elements.input[i * mechanism.columns + ii];

									var input = TE.container.getSlot(input_slot_name);
									if(state == 1){
										 var ing = recipe.recipe[i - _i];
										 if(ing)
											 ing = ing[ii - _ii];
										 
										 if(!ing)
											 ing = "air";
											
										 if(input.id != recipe.ingridients[ing].id){
											if(recipe.ingridients[recipe.recipe[0][0]].id == 0)
												state = 0;
											else
												state = 2;
										 }
										 
									}
									
									if(state == 0){
										if(i < ((mechanism.rows+1) - recipe.recipe.length) && ii < ((mechanism.columns+1) - recipe.recipe[0].length)){
											var ing = recipe.recipe[0][0];
											if(input.id == recipe.ingridients[ing].id){
												_i = i;
												_ii = ii;
												state = 1;
											}
										}else{
											if(input.id != 0)
												state = 2;
										}
									}
								}
							}
							
							if(state == 1 && (outputSlot.id == 0 || outputSlot.id == recipe.result.id)){
								if(TE.data.resipete.recipe == null){
									TE.data.resipete.tick = 0;
									TE.data.resipete.recipe = recipe;
								}
								
								result = true;
								break resipe_label;
							}else{
								continue resipe_label;
							}
						break;
						case "line":
							var input_count = mechanism.rows * mechanism.columns;
							var craft = false;
							var _i = 0;
							
							for(var i = 0; i < (input_count); i++){
								var input_slot_name;
								if(typeof mechanism.elements.input == 'string')
									input_slot_name = mechanism.elements.input+ i;
								else
									input_slot_name = mechanism.elements.input[i];

								var input = TE.container.getSlot(input_slot_name);
								
								if(i < (input_count + 1) - recipe.recipe.length && craft === false){
									var ing = recipe.recipe[0];
									if(input.id == recipe.ingridients[ing].id){
										_i = i;
										craft = true;
									}else if(input.id != 0){
										continue resipe_label;
									}
								}else if(craft === true){
									var ing = recipe.recipe[i - _i];
									if(!ing) ing = "air";
									
									if(input.id != recipe.ingridients[ing].id){
										continue resipe_label;
									}
								}else{
									continue resipe_label;
								}
							}
							
							if(craft && (outputSlot.id == 0 || outputSlot.id == recipe.result.id)){
								if(TE.data.resipete.recipe == null){
									TE.data.resipete.tick = 0;
									TE.data.resipete.recipe = recipe;
								}
								result = true;
								break resipe_label;
							}
								
						break;
					}
				}
				
				if(!result){
					TE.data.resipete.tick = 0;
					TE.data.resipete.recipe = null;
				}
				
			}
			
			var _time = TE.data.resipete.recipe ? TE.data.resipete.recipe.time : 1;
			
			TE.container.setScale(mechanism.elements.progress, TE.data.resipete.tick / (mechanism.timer * _time));
			

		}else{
			if(changed === true){
				
				resipe_label: for(var a in resipes){
					var recipe = resipes[a];
					switch(recipe.type){
						case "grid":
							var state = 0;
					
							var _i = 0, _ii = 0;
							
							for(var i = 0; i < mechanism.rows; i++){//lines
								for(var ii = 0; ii < mechanism.columns; ii++){//columns
									var input_slot_name;
									if(typeof mechanism.elements.input == 'string')
										input_slot_name = mechanism.elements.input+ (i * mechanism.columns + ii);
									else
										input_slot_name = mechanism.elements.input[i * mechanism.columns + ii];

									var input = TE.container.getSlot(input_slot_name);
									if(state == 1){
										 var ing = recipe.recipe[i - _i];
										 if(ing)
											 ing = ing[ii - _ii];
										 
										 if(!ing)
											 ing = "air";
											
										 if(input.id != recipe.ingridients[ing].id){
											if(recipe.ingridients[recipe.recipe[0][0]].id == 0)
												state = 0;
											else
												state = 2;
										 }
										 
									}
									
									if(state == 0){
										if(i < ((mechanism.rows+1) - recipe.recipe.length) && ii < ((mechanism.columns+1) - recipe.recipe[0].length)){
											var ing = recipe.recipe[0][0];
											if(input.id == recipe.ingridients[ing].id){
												_i = i;
												_ii = ii;
												state = 1;
											}
										}else{
											if(input.id != 0)
												state = 2;
										}
									}
								}
							}
							
							if(state == 1 && condition(TE)){
								TE.container.setSlot(mechanism.elements.output, recipe.result.id, recipe.result.count, recipe.result.data);
								TE.data.resipete.recipe = recipe;
								result = true;
								break resipe_label;
							}else{
								continue resipe_label;
							}
						break;
						case "line":
							var input_count = mechanism.rows * mechanism.columns;
							var craft = false;
							var _i = 0;
							
							for(var i = 0; i < (input_count); i++){
								var input_slot_name;
								if(typeof mechanism.elements.input == 'string')
									input_slot_name = mechanism.elements.input+ i;
								else
									input_slot_name = mechanism.elements.input[i];

								var input = TE.container.getSlot(input_slot_name);
								
								if(i < (input_count + 1) - recipe.recipe.length && craft === false){
									var ing = recipe.recipe[0];
									if(input.id == recipe.ingridients[ing].id){
										_i = i;
										craft = true;
									}else if(input.id != 0){
										continue resipe_label;
									}
								}else if(craft === true){
									var ing = recipe.recipe[i - _i];
									if(!ing) ing = "air";
									
									if(input.id != recipe.ingridients[ing].id){
										continue resipe_label;
									}
								}else{
									continue resipe_label;
								}
							}
							
							if(craft && condition(TE)){
								TE.container.setSlot(mechanism.elements.output, recipe.result.id, recipe.result.count, recipe.result.data);
								TE.data.resipete.recipe = recipe;
								result = true;
								break resipe_label;
							}
								
						break;
					}
				}
				
				if(result == false)
					TE.container.clearSlot(mechanism.elements.output);
				
			}else{
				if((TE.data.resipete.outputSlot.id != outputSlot.id ||
					TE.data.resipete.outputSlot.data != outputSlot.data ||
					TE.data.resipete.outputSlot.count != outputSlot.count)){
					
					if(outputSlot.id == 0 || TE.data.resipete.outputSlot.count-1 == outputSlot.count){
						
						if(TE.data.resipete.outputSlot.count-1 == outputSlot.count){
							Player.addItemToInventory(outputSlot.id, outputSlot.count, outputSlot.data);
							TE.container.clearSlot(mechanism.elements.output);
						}
						
						if(TE.data.resipete.recipe.craft)
							TE.data.resipete.recipe.craft(TE, mechanism);
						else
							RecipeTE.defaultCraftEvent(TE, mechanism);
						
						for(var i = 0; i < mechanism.rows * mechanism.columns; i++){
							var input_slot_name;
							if(typeof mechanism.elements.input == 'string')
								input_slot_name = mechanism.elements.input+ i;
							else
								input_slot_name = mechanism.elements.input[i];

							var slot = TE.container.getSlot(input_slot_name);
							if(slot.count > 0){
								slot.count--;
								
								if(slot.count == 0)
									slot.data = slot.id = slot.count;
							}
						}
					}
				}
				
				if(!condition(TE))
					TE.container.clearSlot(mechanism.elements.output);
			}
				
		}
		
		TE.data.resipete.outputSlot = {
			id:outputSlot.id,
			data:outputSlot.data,
			count:outputSlot.count
		};
	},
	
	outputSlotValid:function(){return false;},
	
	defaultCraftEvent:function(TE, mechanism){
		for(var i = 0; i < mechanism.rows * mechanism.columns; i++){
			var input_slot_name;
			if(typeof mechanism.elements.input == 'string')
				input_slot_name = mechanism.elements.input+ (i);
			else
				input_slot_name = mechanism.elements.input[i];
			
			var slot = TE.container.getSlot(input_slot_name);
			if(slot.count > 0){
				slot.count--;
				
				if(slot.count == 0)
					slot.data = slot.id = slot.count;
			}
		}
	},
	
	//Заглушки для модов, которые использовали первую версию.
	getTickResipes:function(a,b,c){
		this.getTickRecipes(a,b,c);
	},
	
	registerTimerGridCraftTable:function(name, columns, rows, timer){
		this.registerGridCraftTable(name, columns, rows, timer);
	},
	
	registerTimerCraftTable:function(name, slots, timer){
		this.registerTimerGridCraftTable(name, slots, 1, timer);
	},
};

EXPORT("RecipeTE", RecipeTE);