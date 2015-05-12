'use strict';

app.factory('designerUI', function() {
    return {
        selectedItem: null,
        setSelectedItem: function(selected) {   //FIXME: IM NOT SETTING selectedItem VIA THIS IN PLACES
            this.selectedItem = selected;
        },
        isSelectedItem: function(item) {
            return this.selectedItem === item;
        },
        keypress: function(keyCode) {   //FIXME: didnt get this to work
            if(keyCode === 8) {
                alert("keyCode 8 detected");
                if (this.selectedItem !== null) {
                    alert(this.selectedItem.displayName + ' would be deleted');
                }
            }
        }
    }
});