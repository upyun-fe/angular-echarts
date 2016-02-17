'use strict';

/**
 * util services
 */
angular.module('angular-echarts.util', []).factory('util', function() {

    /**
     * get x axis ticks from the 1st serie
     */
    function getAxisTicks(data, config) {
        var ticks = [];
        if (data[0]) {
            angular.forEach(data[0].datapoints, function(datapoint) {
                ticks.push(datapoint.name);
            });

            return {
                data: ticks
            }
        }
    }

    /**
     * get series config
     *
     * @param {Array} data serie data
     * @param {Object} config options
     * @param {String} chart type
     */
    function getSeries(data, config, type) {
        var series = [];
        angular.forEach(data, function(serie) {
            var conf = {
                type: type || 'line'
            };
            angular.extend(conf, serie);
            delete conf.datapoints;

            conf.data = [];
            if (config.isAxisChart) {
                angular.forEach(serie.datapoints, function(datapoint) {
                    conf.data.push(datapoint.value);
                });
            }
            else {
                conf.data = serie.datapoints;
            }
            series.push(conf);
        });
        return series;
    }

    /**
     * get legends from data series
     */
    function getLegend(data, config, type) {
        var legend = { data: []};
        if (type === 'pie') {
            if (data[0]) {
                angular.forEach(data[0].datapoints, function (datapoint) {
                    legend.data.push(datapoint.name);
                });
            }
            legend.orient = 'verticle';
            legend.x = 'right';
            legend.y = 'center';
        }
        else {
            angular.forEach(data, function (serie) {
                legend.data.push(serie.name);
            });
        }

        return angular.extend(legend, config.legend || {});
    }

    /**
     * get tooltip config
     */
    function getTooltip(data, config, type) {
        var tooltip = {};

        switch (type) {
            case 'line':
            case 'candlestick':
                tooltip.trigger = 'axis';
                break;
            case 'pie':
            case 'map':
            case 'boxplot':
            case 'sankey':
            case 'funnel':
                tooltip.trigger = 'item';
                break;
        }

        if (type === 'pie') {
            tooltip.formatter = '{a} <br/>{b}: {c} ({d}%)';
        }

        return angular.extend(tooltip, angular.isObject(config.tooltip) ? config.tooltip : {});
    }

    function formatKMBT(y, formatter) {
        if (!formatter) {
            formatter = function (v) { return Math.round(v * 100) / 100; };
        }
        y = Math.abs(y);
        if (y >= 1000000000000)   { return formatter(y / 1000000000000) + 'T'; }
        else if (y >= 1000000000) { return formatter(y / 1000000000) + 'B'; }
        else if (y >= 1000000)    { return formatter(y / 1000000) + 'M'; }
        else if (y >= 1000)       { return formatter(y / 1000) + 'K'; }
        else if (y < 1 && y > 0)  { return formatter(y); }
        else if (y === 0)         { return ''; }
        else                      { return formatter(y); }
    }

    return {
        getAxisTicks: getAxisTicks,
        getSeries: getSeries,
        getLegend: getLegend,
        getTooltip: getTooltip,
        formatKMBT: formatKMBT
    };
});
