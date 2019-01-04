/*
     _        _                                   _ _____                    _         
    / \    __| |__   __ __ _ _ __   ___  ___   __| | ____|__   __ ___  _ __ | |_  ___ 
   / _ \  / _` |\ \ / // _` | '_ \ / __|/ _ \ / _` |  _|  \ \ / // _ \| '_ \| __|/ __|
  / ___ \| (_| | \ V /| (_| | | | | (__|  __/| (_| | |___  \ V /|  __/| | | | |_ \__ \
 /_/   \_\\__,_|  \_/  \__,_|_| |_|\___|\___| \__,_|_____|  \_/  \___||_| |_|\__||___/
                                                                
    Advanced Events

    Внимание! Запрещено:
    1.Распространение библиотеки на сторонних источниках без указание ссылки на официальное сообщество
    2.Изменение кода
    3.Явное копирование кода

    Используя библиотеку вы автоматически соглашаетесь с этими правилами.

    ©WolfTeam ( https://vk.com/wolf___team )
*/
/*  ChangeLog:
	v1.0
		- Add event changeItemToInventory( (int)slotID, (object)oldItme, (object)newItem )
*/
LIBRARY({
    name: "AdvancedEvents",
    version: 1.1,
	shared:true,
    api: "CoreEngine"
});

/**
* ChangeCarriedItem( (object)newItem, (object)oldItem )
*/
var oldItem = {id:0}, oldSlot = 0, currentScreen='null';
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
            currentScreen = a;
			break;
    }
});
Callback.addCallback("tick", function(){
	if (currentScreen == "hud_screen" || currentScreen == "null") {
		if (Player.getCarriedItem().id != oldItem.id) {
			Callback.invokeCallback("ChangeCarriedItem", Player.getCarriedItem(), oldItem);
		} else {
			if (Player.getSelectedSlotId() != oldSlot) {
				Callback.invokeCallback("ChangeCarriedItem", Player.getCarriedItem(), oldItem);
			}
		}
		oldItem = Player.getCarriedItem();
		oldSlot = Player.getSelectedSlotId()
	}
});
