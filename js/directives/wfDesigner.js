'use strict';

app.directive('wfDesigner', function(wfManipulator, designerUI) {
    return {
        restrict: 'A',
        templateUrl: './js/templates/wfDesigner.html',
        scope: {
            wfDesigner: '=',
            arguments: '='
        },
        link: function(scope, element, attrs, ctrl) {

            scope.deleteSelected = function() {
                if (designerUI.selectedItem.modelType != 'wfPart') {
                    alert('deleting this modelType is not implemented in wfDesigner');
                }
                if (designerUI.selectedItem === scope.wfDesigner) { //root of workflow
                    scope.wfDesigner = null;
                    scope.arguments = null;
                } else {
                    wfManipulator.deleteWfPart(designerUI.selectedItem);
                }
                scope.$broadcast('wfPart:delete', designerUI.selectedItem);
                designerUI.selectedItem = null;
            };
            // ############  Bottom Pad ###############
            var unRegWatch;
            var openPad;
            var openPadEl;
            scope.toggleBottomPad = function(pad, $event) {
                var target = $($event.target);
                if (target.hasClass('down')) {
                    hidePad(pad, target);
                } else {
                    showPad(pad, target);
                }
            };
            function showPad(pad, target) {
                //make sure only 1 pad open at a time
                if (openPad != null) {
                    hidePad(openPad, openPadEl);
                }
                target.addClass('down');
                $(pad).css("display","block")
                unRegWatch = scope.$watch(function() {
                    return $(pad).prop('offsetTop');
                }, function(newVal, oldVal) {
                    $('#DesignSurfaceCol').css('bottom', '');
                    $('#DesignSurfaceCol').css('height', newVal + 'px');
                });
                openPad = pad;
                openPadEl = target;
            }
            function hidePad(pad, target) {
                target.removeClass('down');
                $(pad).css("display","none");
                $('#DesignSurfaceCol').css('bottom', '1.5em');
                $('#DesignSurfaceCol').css('height', '');
                unRegWatch();
                openPad = null;
                openPadEl = null;
            }
        }
    };
})
