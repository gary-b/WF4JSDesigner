/**
 Modified from:
 ng-context-menu - v0.1.4 - An AngularJS directive to display a context menu when
 a right-click event is triggered

 The MIT License (MIT)

 Copyright (c) 2013 Ian Walter

 Permission is hereby granted, free of charge, to any person obtaining a copy of
 this software and associated documentation files (the "Software"), to deal in
 the Software without restriction, including without limitation the rights to
 use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 the Software, and to permit persons to whom the Software is furnished to do so,
 subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

 @author Ian Kennington Walter (http://ianvonwalter.com)
 */
app.directive('contextMenu', function($document, contextMenu) {
    return {
        restrict: 'A',
        scope: {
            'callback': '&contextMenu',
            'disabled': '&contextMenuDisabled'
        },
        link: function($scope, $element, $attrs) {
            var menuElement = angular.element(document.getElementById($attrs.target));

            $element.bind('contextmenu', function(event) {
                if (!$scope.disabled()) {
                    event.preventDefault();
                    event.stopPropagation();
                    $scope.$apply(function() {
                        $scope.callback({ $event: event });
                        contextMenu.open(event, menuElement);
                    });
                }
            });
        }
    };
});