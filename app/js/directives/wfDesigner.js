'use strict';

app.directive('wfDesigner', function(wfModel, wfManipulator, designerUI) {
    return {
        restrict: 'A',
        templateUrl: './js/templates/wfDesigner.html',
        scope: {
            wfDesigner: '=',
            arguments: '='
        },
        link: function(scope, element, attrs, ctrl) {
            //not watching for argument changes when model isnt changed
            scope.$watch('wfDesigner', function(newVal, oldVal) {
                if (!(newVal === undefined && oldVal === undefined )) {
                    wfModel.initialize(scope.wfDesigner, scope.arguments);
                }
            });
            scope.deleteSelected = function() {
                if (designerUI.selectedItem.modelType === 'wfPart') {
                    wfManipulator.deleteWfPart(designerUI.selectedItem);
                    designerUI.selectedItem = null;
                } else {
                    alert('deleting this modelType is not implemented in wfDesigner');
                }
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
