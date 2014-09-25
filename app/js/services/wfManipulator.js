'use strict';

app.factory('wfManipulator', function () {
    return {
        insertActivityAtPos: function(activity, target, pos) {
            target.splice(pos, 0, activity)
        },
        deleteWfPart: function(part) {
            if (part.parent == null) {
                var err = "parent of part null or undefined, support to delete root part not implemented yet";
                alert(err);
                throw err;
            }
            part.parent.deleteChild(part);
        }
    }
});