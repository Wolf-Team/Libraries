/*
  ____             _            _____ _ _       _____       _   _ _         _     _ _     
 |  _ \  ___   ___(_)_ __   ___|_   _(_) | ___ | ____|_ __ | |_(_) |_ _   _| |   (_) |__  
 | |_) |/ _ \ / __| | '_ \ / _ \ | | | | |/ _ \|  _| | '_ \| __| | __| | | | |   | | '_ \ 
 |  _ <|  __/| (__| | |_) |  __/ | | | | |  __/| |___| | | | |_| | |_| |_| | |___| | |_) |
 |_| \_\\___| \___|_| .__/ \___| |_| |_|_|\___||_____|_| |_|\__|_|\__|\__, |_____|_|_.__/ 
                    |_|                                               |___/                     
                                                                
    RecipeTileEntityLib v2.1

    Внимание! Запрещено:
    1.Распространение библиотеки на сторонних источниках без указание ссылки на официальное сообщество
    2.Изменение кода
    3.Явное копирование кода

    Используя библиотеку вы автоматически соглашаетесь с этими правилами.

    ©WolfTeam ( https://vk.com/wolf___team )
*/
/*ChangeLog:
    v.2.1
        - Fix errors
        - Shared
        - Integration with RecipeViewer
        - Fix recipe with mod's items
        - The setWorkbench method was added to the tileentity of the workbench
    v.2.0
        - The library has been rewritten
        - Added the ability to create shapeless recipes
    v.1.2
        - Fix change of craft with the same ingredients
        - Removed method registerTimerGridCraftTable
        - Removed method registerTimerCraftTable
        - Removed method getTickResipes
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
    version: 21,
    api: "CoreEngine",
    shared:true
});

var RecipeTE = {
    AIR_ITEM:{id:0, count:1, data:0},

    addWorckbench:function(sid, Prototype){
        RecipeTEDev.mechanisms[sid] = {
            sid:        sid,
            cols:       Prototype.Columns || Prototype.columns || Prototype.Cols || Prototype.cols || Prototype.Slots || Prototype.slots,
            rows:       Prototype.Rows || Prototype.rows || 1,
            gui:        Prototype.GuiScreen,
            rv_gui:     Prototype.RVGuiScreen || null,
            input:      Prototype.Input || Prototype.input || "inputSlot",
            output:     Prototype.Output || Prototype.output || "outputSlot",
            scale:      Prototype.scale || Prototype.scale || "progressScale",
            time:       Prototype.Time || Prototype.time || 0,
            data_input:{},
            data_output:{id:0, data:0, count:0}
        };
        RecipeTEDev.recipes[sid] = [];
    },

    registerWorkbench:function(sid, Prototype){
        if(!sid || typeof(sid) != "string")
            throw "Укажите строковый ID блока.";

        if(this.isRegistered(sid))
            throw "Верстак \"" + sid + "\" уже зарегистрирован.";

        this.addWorckbench(sid, Prototype);
        
        Prototype._Condition = Prototype.condition || function(){return true;};
        
        Prototype._tick = Prototype.tick || function(){};

        //Prototype._workbench_info = RecipeTEDev.mechanisms[sid];

        //Prototype._workbench_info.gui.getWindow("main").getContentProvider().content.elements[Prototype._workbench_info.output].isValid = RecipeTEDev.outputSlotValid;

        Prototype.getGuiScreen = function(){
            return this._workbench_info.gui;
        }

        Prototype.setWorkbench = function(sid){
            if(!RecipeTE.isRegistered(sid))
                throw "Верстак \"" + sid + "\" не зарегистрирован.";

            this._workbench_info = RecipeTEDev.mechanisms[sid];

            this._workbench_info.gui.getWindow("main").getContentProvider().content.elements[Prototype._workbench_info.output].isValid = RecipeTEDev.outputSlotValid;
        }

        Prototype.setWorkbench(sid);

        if(Prototype._workbench_info.time == 0)
            Prototype.tick = RecipeTEDev.WorkbenchTick;
        else
            Prototype.tick = RecipeTEDev.FurnaceTick;

        TileEntity.registerPrototype(BlockID[sid], Prototype);
    },

    isRegistered:function(sid){
        return RecipeTEDev.mechanisms.hasOwnProperty(sid);
    },

    addRecipe:function(sid, result, ingridients,  time_multiple, craft){
        
        let workbench = RecipeTEDev.mechanisms[sid];
        let _ing = {};
        let c = 0;
        for(let i in ingridients){
            if(["string", "number"].indexOf(typeof(ingridients[i])) != -1){
                ingridients[i] = {
                    id:ingridients[i],
                    count: 1
                };
            }
            if(typeof ingridients[i].id == 'string'){
                if(ItemID[ingridients[i].id])
                    ingridients[i].id = ItemID[ingridients[i].id];
                else if(BlockID[ingridients[i].id])
                    ingridients[i].id = BlockID[ingridients[i].id]
                else
                    throw "Не найден предмет "+ingridients[i].id;
            }
            if(ingridients[i].id === undefined)
                throw "Не верный ингридиент.";

            if(ingridients[i].id == 0)
                continue;

            if(!ingridients[i].count)
                ingridients[i].count = 1;

            c += ingridients[i].count;

            _ing[ingridients[i].id] = ingridients[i];
        }
        
        if( c > workbench.cols * workbench.rows)
            throw "Количество ингридиентов не должно превешать, количество ячеек сетки верстака.";

        //Стандартные значения результата
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
        } else if(result == undefined){
            return "Результат не задан.";
        } else if(result.id == undefined){
            return "ID результата не задан.";
        }
        
        result.count = result.count || 1;
        result.data = result.data || 0;
        
        //time_multiple используется как craft
        if(typeof time_multiple == "function"){
            craft = time_multiple;
            time_multiple = 1;
        }

        RecipeTEDev.recipes[sid].push({
            count:c,
            ingridients:_ing,
            result:result,
            time:time_multiple || 1,
            craft:craft || RecipeTE.defaultCraftEvent,
            type:"not_shape"
        });
    },

    addShapeRecipe:function(sid, result, recipe, ingridients, time_multiple, craft){
        if(!this.isRegistered(sid))
            throw "Верстак \"" + sid + "\" не зарегистрирован.";

        let workbench = RecipeTEDev.mechanisms[sid];
        let type = "grid";
        if(typeof(recipe) == "string"){
            type = "line";
            if(recipe.length > workbench.cols * workbench.rows)
                throw "Количество ингридиентов в рецепте не должны превешать, количество ячеек верстака.";
        }else{
            if(!recipe instanceof Array)
                throw "Рецепт должен быть массивом.";
            
            if(recipe.length > workbench.rows)
                throw "Количество строк в рецепте не должны превешать, количество строк сетки верстака.";

            for(var i = 1; i < recipe.length; i++){
                if(recipe[0].length != recipe[i].length)
                    throw "Строки должны быть одной длинны";
                
                if(recipe[i].length > workbench.cols){
                    throw "Строка не должны быть больше, чем количество столбцов сетки верстака.";
                }
            }
        }

        //
        for(let i in ingridients){
            if(["string", "number"].indexOf(typeof(ingridients[i])) != -1){
                ingridients[i] = {
                    id:ingridients[i],
                    count: 1
                };
            }
            if(typeof ingridients[i].id == 'string'){
                if(ItemID[ingridients[i].id])
                    ingridients[i].id = ItemID[ingridients[i].id];
                else if(BlockID[ingridients[i].id])
                    ingridients[i].id = BlockID[ingridients[i].id]
                else
                    throw "Не найден предмет "+ingridients[i].id;
            }
            
            if(ingridients[i].id === undefined)
                throw "Не верный ингридиент.";

            if(!ingridients[i].count)
                ingridients[i].count = 1;
        }

        //Стандартные значения результата
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
        } else if(result === undefined){
            return "Результат не задан.";
        } else if(result.id === undefined){
            return "ID результата не задан.";
        }
        
        result.count = result.count || 1;
        result.data = result.data || 0;

        //time_multiple используется как craft
        if(typeof time_multiple == "function"){
            craft = time_multiple;
            time_multiple = 1;
        }

        RecipeTEDev.recipes[sid].push({
            recipe:recipe,
            ingridients:ingridients,
            result:result,
            time:time_multiple || 1,
            craft:craft || RecipeTE.defaultCraftEvent,
            type:type
        });
    },

    getRecipes:function(sid){
        if(!this.isRegistered(sid))
            throw "Верстак \"" + sid + "\" не зарегистрирован.";
        
        return RecipeTEDev.recipes[sid];
    },

    defaultCraftEvent:function(TE){
        for(var i = 0; i < TE._workbench_info.rows * TE._workbench_info.cols; i++){
            var input_slot_name;
            if(typeof TE._workbench_info.input == 'string')
                input_slot_name = TE._workbench_info.input+ (i);
            else
                input_slot_name = TE._workbench_info.input[i];
            
            var slot = TE.container.getSlot(input_slot_name);
            if(slot.count > 0){
                slot.count--;
                
                if(slot.count == 0)
                    slot.data = slot.id = slot.count;
            }
        }
    }
}

var RecipeTEDev = {
    mechanisms:{},
    recipes:{},

    isOpen:function(TE){
        return TE.container.isOpened();
    },

    getChangeWorkbenchInputs:function(TE){
        let changed = false;
        for(let i = 0; i < TE._workbench_info.rows; i++){
                for(let ii = 0; ii < TE._workbench_info.cols; ii++){
                    let input_slot_name;
                    if(typeof TE._workbench_info.input == 'string')
                        input_slot_name = TE._workbench_info.input+ (i * TE._workbench_info.cols + ii);
                    else
                        input_slot_name = TE._workbench_info.input[i * TE._workbench_info.cols + ii];
                        

                    let slot = TE.container.getSlot(input_slot_name);
                    
                    if(!TE._workbench_info.data_input[input_slot_name])
                        TE._workbench_info.data_input[input_slot_name] = {id:0, data:0, count:0};
                    
                    if( TE._workbench_info.data_input[input_slot_name].id    != slot.id    ||
                        TE._workbench_info.data_input[input_slot_name].data  != slot.data  ||
                        TE._workbench_info.data_input[input_slot_name].count != slot.count ){
                        changed = true;
                    }
                    
                    TE._workbench_info.data_input[input_slot_name] = {
                        id:slot.id,
                        data:slot.data,
                        count:slot.count
                    };
                    
                }
            }

        return changed;
    },

    WorkbenchTick:function(){
        if(!RecipeTEDev.isOpen(this)) return;

        if(this._Condition()) {
            let changed = RecipeTEDev.getChangeWorkbenchInputs(this);
            let outputSlot = this.container.getSlot(this._workbench_info.output);
            if(changed){
                let resipes = RecipeTE.getRecipes(this._workbench_info.sid),
                    result = false;

                recipe_label: for(var a in resipes){
                    let recipe = resipes[a],
                        input_slot_name,
                        input_count,
                        _i, _j,
                        select = false;

                    switch(recipe.type){
                        case "grid":
                            for(let i = 0; i < this._workbench_info.rows; i++){
                                for(let j = 0; j < this._workbench_info.cols; j++){

                                    //Остановка перебора строк, переход к следующему рецепту
                                    if(i > this._workbench_info.rows - recipe.recipe.length && !select)
                                        continue recipe_label;

                                    //Остановка перебора ячеек, переход к следующей строке
                                    if(j > this._workbench_info.cols - recipe.recipe[0].length && !select)
                                        break;

                                    //Получение имени входного слота
                                    if(typeof this._workbench_info.input == 'string')
                                        input_slot_name = this._workbench_info.input+ (i * this._workbench_info.cols + j);
                                    else
                                        input_slot_name = this._workbench_info.input[i * this._workbench_info.cols + j];

                                    //Получение предмета слота
                                    let input = this.container.getSlot(input_slot_name);

                                    if(select){//Проверка рецепта
                                        let ing = recipe.recipe[i - _i];
                                        if(ing)
                                            ing = ing[j - _j];

                                        if(ing){
                                            ing = recipe.ingridients[ing] || RecipeTE.AIR_ITEM;
                                        }else{
                                            ing = RecipeTE.AIR_ITEM;
                                        }

                                        if(input.id != ing.id){
                                            if((recipe.ingridients[recipe.recipe[0][0]]  || RecipeTE.AIR_ITEM).id == 0){
                                                select = false;
                                                i = _i;
                                                j = _j;
                                            } else
                                                continue recipe_label;
                                        }
                                    }else{//Поиск старта рецепта
                                        //Получить нужный ингридиент
                                        let ing = recipe.ingridients[recipe.recipe[0][0]] || RecipeTE.AIR_ITEM;
                                        
                                        if(ing.id == input.id){
                                            _i = i;
                                            _j = j;
                                            select = true;
                                        }else if(input.id != 0){
                                            continue recipe_label;
                                        }
                                    }
                                }
                            }
                        break;
                        case "line":
                            input_count = this._workbench_info.rows * this._workbench_info.cols;

                            for(var i = 0; i < (input_count); i++){
                                if(i > input_count - recipe.recipe.length  && !select)
                                    continue recipe_label;

                                if(typeof this._workbench_info.input == 'string')
                                    input_slot_name = this._workbench_info.input+ i;
                                else
                                    input_slot_name = this._workbench_info.input[i];

                                let input = this.container.getSlot(input_slot_name);
                                
                                if(select){
                                    let ing = recipe.ingridients[recipe.recipe[i - _i]] || RecipeTE.AIR_ITEM;
                                    if(input.id != ing.id){
                                        continue recipe_label;
                                    }
                                }else{
                                    let ing = recipe.ingridients[recipe.recipe[0]] || RecipeTE.AIR_ITEM;
                                    if(input.id == ing.id){
                                        _i = i;
                                        select = true;
                                    }else if(input.id != 0){
                                        continue recipe_label;
                                    }
                                }
                            }
                        break;
                        case "not_shape":
                            input_count = this._workbench_info.rows * this._workbench_info.cols,
                                _recipe = {};

                            for(var i = 0; i < (input_count); i++){
                                if(!select && i > input_count - recipe.count)
                                    continue recipe_label;

                                if(typeof this._workbench_info.input == 'string')
                                    input_slot_name = this._workbench_info.input+ i;
                                else
                                    input_slot_name = this._workbench_info.input[i];

                                let input = this.container.getSlot(input_slot_name);
                                
                                if(recipe.ingridients.hasOwnProperty(input.id)){
                                    if(select){
                                        if(_recipe.hasOwnProperty(input.id))
                                            _recipe[input.id]++;
                                        else
                                            _recipe[input.id] = 1;    

                                        if(_recipe[input.id] > recipe.ingridients[input.id].count)
                                            continue recipe_label;
                                    }else{
                                        _recipe[input.id] = 1;
                                        select = true;
                                    }
                                }else if(input.id != 0){
                                    continue recipe_label;
                                }
                            }

                            for(var i in recipe.ingridients){

                                if(_recipe[i] != recipe.ingridients[i].count)
                                    continue recipe_label;
                            }
                        break;
                    }


                    if(select && (outputSlot.id == 0 ||(outputSlot.id == recipe.result.id && outputSlot.data == recipe.result.data))){
                        this.container.setSlot(this._workbench_info.output, recipe.result.id, recipe.result.count, recipe.result.data);
                        this.data._recipe = recipe;
                        result = true;
                        break;
                    }
                }

                if(!result)
                    this.container.clearSlot(this._workbench_info.output);
            }else{
                if((this._workbench_info.data_output.id != outputSlot.id ||
                    this._workbench_info.data_output.data != outputSlot.data ||
                    this._workbench_info.data_output.count != outputSlot.count)){
                    
                    if(outputSlot.id == 0 || this._workbench_info.data_output.count-1 == outputSlot.count){
                        
                        if(this._workbench_info.data_output.count-1 == outputSlot.count){
                            Player.addItemToInventory(outputSlot.id, outputSlot.count, outputSlot.data);
                            this.container.clearSlot(this._workbench_info.output);
                        }
                        
                        if(this.data._recipe.craft && typeof(this.data._recipe.craft) == "function")
                            this.data._recipe.craft(this);
                        else
                            RecipeTE.defaultCraftEvent(this);
                        
                        
                    }
                }
            }

            this._workbench_info.data_output = {
                id:outputSlot.id,
                data:outputSlot.data,
                count:outputSlot.count
            };
        }else{
            this.container.clearSlot(this._workbench_info.output);
        }

        this._tick();
    },

    FurnaceTick:function(){
        if(!RecipeTEDev.isOpen(this) && !this.data._active) return;

        if(this._Condition()) {
            let changed = RecipeTEDev.getChangeWorkbenchInputs(this);
            let outputSlot = this.container.getSlot(this._workbench_info.output);

            if(changed){
                let resipes = RecipeTE.getRecipes(this._workbench_info.sid),
                    result = false;

                recipe_label: for(var a in resipes){
                    let recipe = resipes[a],
                        input_slot_name,
                        input_count,
                        _i, _j,
                        select = false;

                    if(outputSlot.id != 0  && (outputSlot.id != recipe.result.id || outputSlot.data != recipe.result.data))
                        continue recipe_label;

                    switch(recipe.type){
                        case "grid":
                            for(let i = 0; i < this._workbench_info.rows; i++){
                                for(let j = 0; j < this._workbench_info.cols; j++){

                                    //Остановка перебора строк, переход к следующему рецепту
                                    if(i > this._workbench_info.rows - recipe.recipe.length && !select)
                                        continue recipe_label;

                                    //Остановка перебора ячеек, переход к следующей строке
                                    if(j > this._workbench_info.cols - recipe.recipe[0].length && !select)
                                        break;

                                    //Получение имени входного слота
                                    if(typeof this._workbench_info.input == 'string')
                                        input_slot_name = this._workbench_info.input+ (i * this._workbench_info.cols + j);
                                    else
                                        input_slot_name = this._workbench_info.input[i * this._workbench_info.cols + j];

                                    //Получение предмета слота
                                    let input = this.container.getSlot(input_slot_name);

                                    if(select){//Проверка рецепта
                                        let ing = recipe.recipe[i - _i];
                                        if(ing)
                                            ing = ing[j - _j];

                                        if(ing){
                                            ing = recipe.ingridients[ing] || RecipeTE.AIR_ITEM;
                                        }else{
                                            ing = RecipeTE.AIR_ITEM;
                                        }

                                        if(input.id != ing.id){
                                            if(recipe.ingridients[recipe.recipe[0][0]].id == 0){
                                                select = false;
                                                i = _i;
                                                j = _j;
                                            } else
                                                continue recipe_label;
                                        }
                                    }else{//Поиск старта рецепта
                                        //Получить нужный ингридиент
                                        let ing = recipe.ingridients[recipe.recipe[0][0]] || RecipeTE.AIR_ITEM;
                                        
                                        if(ing.id == input.id){
                                            _i = i;
                                            _j = j;
                                            select = true;
                                        }else if(input.id != 0){
                                            continue recipe_label;
                                        }
                                    }
                                }
                            }
                        break;
                        case "line":
                            input_count = this._workbench_info.rows * this._workbench_info.cols;

                            for(var i = 0; i < (input_count); i++){
                                if(i > input_count - recipe.recipe.length  && !select)
                                    continue recipe_label;

                                if(typeof this._workbench_info.input == 'string')
                                    input_slot_name = this._workbench_info.input+ i;
                                else
                                    input_slot_name = this._workbench_info.input[i];

                                let input = this.container.getSlot(input_slot_name);
                                
                                if(select){
                                    let ing = recipe.ingridients[recipe.recipe[i - _i]] || RecipeTE.AIR_ITEM;
                                    if(input.id != ing.id){
                                        continue recipe_label;
                                    }
                                }else{
                                    let ing = recipe.ingridients[recipe.recipe[0]] || RecipeTE.AIR_ITEM;
                                    if(input.id == ing.id){
                                        _i = i;
                                        select = true;
                                    }else if(input.id != 0){
                                        continue recipe_label;
                                    }
                                }
                            }
                        break;
                        case "not_shape":
                            input_count = this._workbench_info.rows * this._workbench_info.cols,
                                _recipe = {};

                            for(var i = 0; i < (input_count); i++){
                                if(!select && i > input_count - recipe.count)
                                    continue recipe_label;

                                if(typeof this._workbench_info.input == 'string')
                                    input_slot_name = this._workbench_info.input+ i;
                                else
                                    input_slot_name = this._workbench_info.input[i];

                                let input = this.container.getSlot(input_slot_name);
                                
                                if(recipe.ingridients.hasOwnProperty(input.id)){
                                    if(select){
                                        if(_recipe.hasOwnProperty(input.id))
                                            _recipe[input.id]++;
                                        else
                                            _recipe[input.id] = 1;    

                                        if(_recipe[input.id] > recipe.ingridients[input.id].count)
                                            continue recipe_label;
                                    }else{
                                        _recipe[input.id] = 1;
                                        select = true;
                                    }
                                }else if(input.id != 0){
                                    continue recipe_label;
                                }
                            }

                            for(var i in recipe.ingridients){

                                if(_recipe[i] != recipe.ingridients[i].count)
                                    continue recipe_label;
                            }
                        break;
                    }


                    if(select){
                        if(this.data._recipe_id != a){
                            this.data._recipe_id = a;
                            this.data._recipe = recipe;
                            this.data._time = parseInt(this._workbench_info.time * recipe.time);   
                        }else{
                            if(!this.data._active)
                                this.data._time = parseInt(this._workbench_info.time * recipe.time);   
                        }

                        this.data._active = true;
                        result = true;
                        break;
                    }else{
                        this.data._active = false;
                        this.data._time = 0;
                        this.data._recipe_id = -1;
                    }
                }
            }else if(this.data._active){
                this.data._time--;

                let _time = this._workbench_info.time * this.data._recipe.time;
                this.container.setScale(this._workbench_info.scale, (_time - this.data._time) / _time);

                if(this.data._time == 0){
                    this.data._active = false;
                    this.container.setScale(this._workbench_info.scale, 0);
                    this.container.setSlot( this._workbench_info.output,
                                            this.data._recipe.result.id,
                                            outputSlot.count + this.data._recipe.result.count,
                                            this.data._recipe.result.data);

                    if(this.data._recipe.craft && typeof(this.data._recipe.craft) == "function")
                        this.data._recipe.craft(this);
                    else
                        RecipeTE.defaultCraftEvent(this);
                    
                }
            }else{
                if((this._workbench_info.data_output.id != outputSlot.id ||
                    this._workbench_info.data_output.data != outputSlot.data ||
                    this._workbench_info.data_output.count != outputSlot.count)){
                    this._workbench_info.data_input = {};
                }
            }
        }

        this._tick();
    },

    getOffsetWindow:function(mech){
        var min = {x:1001, y:1001};
        var c = mech.gui.getContent();

        for(let id in c.drawing){
            let el = c.drawing[id];
            if(!el.RV) continue;
            if(min.x > el.x) min.x = el.x;
            if(min.y > el.y) min.y = el.y; 
        }
        
        for(let id in c.elements){
            let el = c.elements[id];
            if(!el.RV) continue;
            if(min.x > el.x) min.x = el.x;
            if(min.y > el.y) min.y = el.y;
        }

        for(let i = 0, l = mech.rows * mech.cols; i < l; i++){
            let el = c.elements[(typeof(mech.input) == "string")? mech.input + i : mech.input[i]];
            if(min.x > el.x) min.x = el.x;
            if(min.y > el.y) min.y = el.y;
        }
        let el = c.elements[mech.output];
        if(min.x > el.x) min.x = el.x;
        if(min.y > el.y) min.y = el.y;

        if(min.x == 1001) min.x = 0;
        if(min.y == 1001) min.y = 0;

        return min;
    },

    checkRecipe:function(recipe, item, used){
        if(!used) used = false;
        if(!item.data) item.data = 0;
        if(!used){
            if(!recipe.result.data) recipe.result.data  = 0;
            if(recipe.result.id == item.id && (recipe.result.data == item.data || item.data == -1))
            return true;
        }else{
            for(let id in recipe.ingridients){
                if(!recipe.ingridients[id].data) recipe.ingridients[id].data = -1;
                if(recipe.ingridients[id].id == item.id && (recipe.ingridients[id].data == item.data || recipe.ingridients[id].data == -1  || item.data == -1))
                    return true;
            }
        }
        return false;
    },

    outputSlotValid:function(){return false;}
}

ModAPI.addAPICallback("RecipeViewer", function(api){
	let RecipeViewer = api.Core;
    
    Object.keys(RecipeTEDev.mechanisms).forEach(function(wb_sid){
        let mech = RecipeTEDev.mechanisms[wb_sid];
        var screen = mech.rv_gui;
        if(screen == null){
            let elements = {};
            let drawing = [];
            let offset = RecipeTEDev.getOffsetWindow(mech);
            let c = mech.gui.getContent();
            for(let i = 0, l = mech.rows * mech.cols; i < l; i++){
                let slot = c.elements[(typeof(mech.input) == "string")? mech.input + i : mech.input[i]];
                
                elements["input" + i] = {
                        type: "slot",
                        x: slot.x - offset.x,
                        y: slot.y - offset.y,
                        size: slot.size || 60
                    }
            }

            let slot = c.elements[mech.output];
            elements.output0 = {
                    type: "slot",
                    x: slot.x - offset.x,
                    y: slot.y - offset.y,
                    size: slot.size || 60
            }
            
            for(let id in c.drawing){
                let el = c.drawing[id];
                if(!el.RV) continue;
                let newEl = {};
                Object.keys(el).forEach(function(param){
                    if(param == "RV") return;
                    newEl[param] = el[param];
                });
                newEl.x -= offset.x;
                newEl.y -= offset.y;
                drawing.push(newEl);
            }
            
            for(let id in c.elements){
                let el = c.elements[id];
                if(!el.RV) continue;
                let newEl = {};
                Object.keys(el).forEach(function(param){
                    if(param == "RV") return;
                    newEl[param] = el[param];
                });
                newEl.x -= offset.x;
                newEl.y -= offset.y;
                elements[id] = newEl;
            }
            screen = {
                drawing:drawing,
                elements:elements
            };
        }

        if(!screen.icon){
            if(!BlockID[wb_sid]) return;
            
            screen.icon = BlockID[wb_sid];
        }

		RecipeViewer.registerRecipeType("rtel_"+wb_sid, {
            contents:screen,
            getList:function(id, data, isUsage){
                let list = [];
                RecipeTE.getRecipes(wb_sid).forEach(function(recipe){
                    if(RecipeTEDev.checkRecipe(recipe, {id:id, data:data}, isUsage)){
                        let result = recipe.result;
                        let input = [];
                        switch(recipe.type){
                            case "grid":
                                for(let row = 0; row < mech.rows; row++){
                                    for(let col = 0; col < mech.cols; col++){
                                        let ing = RecipeTE.AIR_ITEM;
                                        let _r = recipe.recipe[row];

                                        if(_r != undefined){
                                            ing = recipe.ingridients[_r[col]];
                                            if(ing == undefined || ing.id == undefined)
                                                ing = RecipeTE.AIR_ITEM;
                                        }  
                                        
                                        if(!ing.count)ing.count = 1;
    
                                        input.push(ing);
                                    }
                                }
                             break;
                            case "line":
                                for(let  i = 0; i < recipe.recipe.length; i++){
                                    let ing = recipe.ingridients[recipe.recipe[i]];

                                    if(ing == undefined || ing.id == undefined)
                                                ing = RecipeTE.AIR_ITEM;

                                    if(!ing.count)ing.count = 1;
                                    
                                    input.push(ing);
                                }
                            break;
                            case "not_shape":
                                for(let id in recipe.ingridients){
                                    if(!recipe.ingridients[id].count)recipe.ingridients[id].count = 1;
                                    for(let i = 0; i < recipe.ingridients[id].count; i++)
                                        input.push(recipe.ingridients[id]);
                                }
                            break;
                            default: return;
                        }
                        list.push({
                            input: input,
                            output: [result]
                        });
                    }
                });
        
                return list;
            }
        });
    });
});

EXPORT("RecipeTE", RecipeTE);