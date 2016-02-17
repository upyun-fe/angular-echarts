'use strict';

/**
 * generate directive link function
 *
 * @param {Service} $http, http service to make ajax requests from angular
 * @param {String} type, chart type
 */
function getLinkFunction($http, theme, util, type) {
    return function (scope, element, attrs) {
        scope.config = scope.config || {};

        var ndWrapper = element.find('div')[0],
            ndParent = element.parent()[0],
            parentWidth = ndParent.clientWidth,
            parentHeight = ndParent.clientHeight,
            width, height, chart;
        var chartEvent = {};

        function getSizes() {
            width = parseInt(attrs.width) || parentWidth || 320;
            height = parseInt(attrs.height) || parentHeight || 240;

            ndWrapper.style.width = width + 'px';
            ndWrapper.style.height = height + 'px';
        }

        function getOptions(data, config, type) {
            var grid = config.grid || {
                x: '3.5%',
                x2: '4%',
                y: '10%',
                y2: '10%'
            };
            var options = {
                grid: grid,
                legend: util.getLegend(data, config, type),
                tooltip: util.getTooltip(data, config, type),
                series: util.getSeries(data, config, type)
            };

            Object.keys(config).forEach(function(prop) {
                if (!options.hasOwnProperty(prop)) {
                    options[prop] = angular.copy(config[prop]);
                }
                else {
                    Object.assign(options[prop], config[prop]);
                }
            });

            if (config.isAxisChart) {
                if (options.xAxis && options.xAxis[0].type === 'category') {
                    options.xAxis = options.xAxis || [{}];
                    options.xAxis.map(function(itm) {
                        angular.extend(itm, util.getAxisTicks(data, config));
                    });
                }
                else if (options.yAxis && options.yAxis[0].type === 'category') {
                    options.yAxis = options.yAxis || [{}];
                    options.yAxis.map(function(itm) {
                        angular.extend(itm, util.getAxisTicks(data, config));
                    });
                }

            }
            return options;
        }

        var isAjaxInProgress = false;
        var textStyle = { color: 'red', fontSize: 36, fontWeight: 900, fontFamily: 'Microsoft Yahei, Arial' };

        function setOptions() {
            if (!scope.data || !scope.config) {
                return;
            }

            var options;

            getSizes();

            if (!chart) {
                chart = theme.get(scope.config.theme)
                    ? echarts.init(ndWrapper, theme.get(scope.config.theme))
                    : echarts.init(ndWrapper);
            }

            if (scope.config.event) {
                if (!Array.isArray(scope.config.event)) {
                    scope.config.event = [scope.config.event];
                }

                if (Array.isArray(scope.config.event)) {
                    scope.config.event.forEach(function(ele) {
                        if (!chartEvent[ele.type]) {
                            chartEvent[ele.type] = true;
                            chart.on(ele.type, function(param) {
                                ele.fn(param);
                            });
                        }
                    });
                }
            }

            // string type for data param is assumed to ajax datarequests
            if (angular.isString(scope.data)) {
                if (isAjaxInProgress) { return; }
                isAjaxInProgress = true;

                // show loading
                chart.showLoading({ text: scope.config.loading || '奋力加载中...', textStyle: textStyle });

                // fire data request
                $http.get(scope.data).success(function(response) {
                    isAjaxInProgress = false;
                    chart.hideLoading();

                    if (response.data) {
                        options = getOptions(response.data, scope.config, type);
                        if (scope.config.forceClear) {
                            chart.clear();
                        }
                        if (options.series.length) {
                            chart.setOption(options);
                            chart.resize();
                        }
                        else {
                            chart.showLoading({ text: scope.config.errorMsg || '没有数据', textStyle: textStyle });
                        }
                    }
                    else {
                        chart.showLoading({ text: scope.config.emptyMsg || '数据加载失败', textStyle: textStyle });
                    }
                }).error(function(response) {
                    isAjaxInProgress = false;
                    chart.showLoading({ text: scope.config.emptyMsg || '数据加载失败', textStyle: textStyle });
                });
            }
            // if data is avaliable, render immediately
            else {
                options = getOptions(scope.data, scope.config, type);
                if (scope.config.forceClear) {
                    chart.clear();
                }
                if (options.series.length) {
                    chart.setOption(options);
                    chart.resize();
                }
                else {
                    chart.showLoading({ text: scope.config.errorMsg || '没有数据', textStyle: textStyle });
                }
            }
        }

        // update when charts config changes
        scope.$watch(function() { return scope.config; }, function (value) {
            if (value) { setOptions(); }
        }, true);

        scope.$watch(function() { return scope.data; }, function (value) {
            if (value) { setOptions(); }
        }, true);

    };
}

/**
 * add directives
 */
var app = angular.module('angular-echarts', ['angular-echarts.theme', 'angular-echarts.util']);
var types = ['line', 'bar', 'pie', 'scatter', 'effectScatter', 'treemap', 'boxplot', 'candlestick', 'headmap', 'map',
    'parallel', 'lines', 'graph', 'sankey', 'funnel', 'gauge'];
for (var i = 0, n = types.length; i < n; i++) {
    (function(type) {
        app.directive(type + 'Chart', ['$http', 'theme', 'util', function($http, theme, util) {
            return {
                restrict: 'EA',
                template: '<div></div>',
                scope: {
                    config: '=config',
                    data: '=data'
                },
                link: getLinkFunction($http, theme, util, type)
            };
        }]);
    })(types[i]);
}
