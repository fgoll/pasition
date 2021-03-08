/**
 * pasition v1.0.3 By dntzhang
 * Github: https://github.com/AlloyTeam/pasition
 * MIT Licensed.
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.pasition = factory());
}(this, (function () { 'use strict';

//https://github.com/colinmeinke/svg-arc-to-cubic-bezier

//https://github.com/jkroso/parse-svg-path/blob/master/index.js
/**
 * expected argument lengths
 * @type {Object}
 */

var length = { a: 7, c: 6, h: 1, l: 2, m: 2, q: 4, s: 4, t: 2, v: 1, z: 0

    /**
     * segment pattern
     * @type {RegExp}
     */

};var segment = /([astvzqmhlc])([^astvzqmhlc]*)/ig;

/**
 * parse an svg path data string. Generates an Array
 * of commands where each command is an Array of the
 * form `[command, arg1, arg2, ...]`
 *
 * @param {String} path
 * @return {Array}
 */

function parse(path) {
    var data = [];
    path.replace(segment, function (_, command, args) {
        var type = command.toLowerCase();
        args = parseValues(args);

        // overloaded moveTo
        if (type == 'm' && args.length > 2) {
            data.push([command].concat(args.splice(0, 2)));
            type = 'l';
            command = command == 'm' ? 'l' : 'L';
        }

        while (true) {
            if (args.length == length[type]) {
                args.unshift(command);
                return data.push(args);
            }
            if (args.length < length[type]) throw new Error('malformed path data');
            data.push([command].concat(args.splice(0, length[type])));
        }
    });
    return data;
}

var number = /-?[0-9]*\.?[0-9]+(?:e[-+]?\d+)?/ig;

function parseValues(args) {
    var numbers = args.match(number);
    return numbers ? numbers.map(Number) : [];
}

function shapeBox(shape) {
    var minX = shape[0][0],
        minY = shape[0][1],
        maxX = minX,
        maxY = minY;
    shape.forEach(function (curve) {
        var x1 = curve[0],
            x2 = curve[2],
            x3 = curve[4],
            x4 = curve[6],
            y1 = curve[1],
            y2 = curve[3],
            y3 = curve[5],
            y4 = curve[7];

        minX = Math.min(minX, x1, x2, x3, x4);
        minY = Math.min(minY, y1, y2, y3, y4);
        maxX = Math.max(maxX, x1, x2, x3, x4);
        maxY = Math.max(maxY, y1, y2, y3, y4);
    });

    return [minX, minY, maxX, maxY];
}

function boxDistance(boxA, boxB) {
    return Math.sqrt(Math.pow(boxA[0] - boxB[0], 2) + Math.pow(boxA[1] - boxB[1], 2)) + Math.sqrt(Math.pow(boxA[2] - boxB[2], 2) + Math.pow(boxA[3] - boxB[3], 2));
}

function curveDistance(curveA, curveB) {
    var x1 = curveA[0],
        x2 = curveA[2],
        x3 = curveA[4],
        x4 = curveA[6],
        y1 = curveA[1],
        y2 = curveA[3],
        y3 = curveA[5],
        y4 = curveA[7],
        xb1 = curveB[0],
        xb2 = curveB[2],
        xb3 = curveB[4],
        xb4 = curveB[6],
        yb1 = curveB[1],
        yb2 = curveB[3],
        yb3 = curveB[5],
        yb4 = curveB[7];

    return Math.sqrt(Math.pow(xb1 - x1, 2) + Math.pow(yb1 - y1, 2)) + Math.sqrt(Math.pow(xb2 - x2, 2) + Math.pow(yb2 - y2, 2)) + Math.sqrt(Math.pow(xb3 - x3, 2) + Math.pow(yb3 - y3, 2)) + Math.sqrt(Math.pow(xb4 - x4, 2) + Math.pow(yb4 - y4, 2));
}

function sortCurves(curvesA, curvesB) {

    var arrList = permuteCurveNum(curvesA.length);

    var list = [];
    arrList.forEach(function (arr) {
        var distance = 0;
        var i = 0;
        arr.forEach(function (index) {
            distance += curveDistance(curvesA[index], curvesB[i++]);
        });
        list.push({ index: arr, distance: distance });
    });

    list.sort(function (a, b) {
        return a.distance - b.distance;
    });

    var result = [];

    list[0].index.forEach(function (index) {
        result.push(curvesA[index]);
    });

    return result;
}

function sort(pathA, pathB) {

    var arrList = permuteNum(pathA.length);

    var list = [];
    arrList.forEach(function (arr) {
        var distance = 0;
        arr.forEach(function (index) {
            distance += boxDistance(shapeBox(pathA[index]), shapeBox(pathB[index]));
        });
        list.push({ index: arr, distance: distance });
    });

    list.sort(function (a, b) {
        return a.distance - b.distance;
    });

    var result = [];

    list[0].index.forEach(function (index) {
        result.push(pathA[index]);
    });

    return result;
}

function permuteCurveNum(num) {
    var arr = [];

    for (var i = 0; i < num; i++) {
        var indexArr = [];
        for (var j = 0; j < num; j++) {
            var index = j + i;
            if (index > num - 1) index -= num;
            indexArr[index] = j;
        }

        arr.push(indexArr);
    }

    return arr;
}

function permuteNum(num) {
    var arr = [];
    for (var i = 0; i < num; i++) {
        arr.push(i);
    }

    return permute(arr);
}

function permute(input) {
    var permArr = [],
        usedChars = [];
    function main(input) {
        var i, ch;
        for (i = 0; i < input.length; i++) {
            ch = input.splice(i, 1)[0];
            usedChars.push(ch);
            if (input.length == 0) {
                permArr.push(usedChars.slice());
            }
            main(input);
            input.splice(i, 0, ch);
            usedChars.pop();
        }
        return permArr;
    }
    return main(input);
}

var pasition = {};
pasition.parser = parse;

pasition.lerpCurve = function (pathA, pathB, t) {
    return pasition.lerpPoints(pathA[0], pathA[1], pathB[0], pathB[1], t).concat(pasition.lerpPoints(pathA[2], pathA[3], pathB[2], pathB[3], t)).concat(pasition.lerpPoints(pathA[4], pathA[5], pathB[4], pathB[5], t)).concat(pasition.lerpPoints(pathA[6], pathA[7], pathB[6], pathB[7], t));
};

pasition.lerpPoints = function (x1, y1, x2, y2, t) {
    return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t];
};

pasition.q2b = function (x1, y1, x2, y2, x3, y3) {};

pasition.path2shapes = function (path) {
    // 解析 svg path
    var cmds = pasition.parser(path);
    var preX = 0,
        preY = 0,
        j = 0,
        sLen = void 0,
        len = cmds.length,
        closeX = void 0,
        closeY = void 0,
        current = void 0,
        shapes = [];

    for (; j < len; j++) {
        var item = cmds[j];
        var action = item[0];
        var preItem = cmds[j - 1];

        switch (action) {
            case 'M':

                sLen = shapes.length;
                shapes[sLen] = [];
                current = shapes[sLen];
                preX = item[1];
                preY = item[2];
                break;

            case 'L':

                current.push([preX, preY, item[1], item[2], item[1], item[2], item[1], item[2]]);
                preX = item[1];
                preY = item[2];

                break;

            case 'Z':
                closeX = current[0][0];
                closeY = current[0][1];
                current.push([preX, preY, closeX, closeY, closeX, closeY, closeX, closeY]);
                break;
        }
    }

    return shapes;
};

pasition._upCurves = function (curves, count) {};
function split(x1, y1, x2, y2, x3, y3, x4, y4, t) {
    return {
        left: _split(x1, y1, x2, y2, x3, y3, x4, y4, t),
        right: _split(x4, y4, x3, y3, x2, y2, x1, y1, 1 - t, true)
    };
}

function _split(x1, y1, x2, y2, x3, y3, x4, y4, t, reverse) {

    var x12 = (x2 - x1) * t + x1;
    var y12 = (y2 - y1) * t + y1;

    var x23 = (x3 - x2) * t + x2;
    var y23 = (y3 - y2) * t + y2;

    var x34 = (x4 - x3) * t + x3;
    var y34 = (y4 - y3) * t + y3;

    var x123 = (x23 - x12) * t + x12;
    var y123 = (y23 - y12) * t + y12;

    var x234 = (x34 - x23) * t + x23;
    var y234 = (y34 - y23) * t + y23;

    var x1234 = (x234 - x123) * t + x123;
    var y1234 = (y234 - y123) * t + y123;

    if (reverse) {
        return [x1234, y1234, x123, y123, x12, y12, x1, y1];
    }
    return [x1, y1, x12, y12, x123, y123, x1234, y1234];
}

pasition._splitCurves = function (curves, count) {
    var i = 0,
        index = 0;

    for (; i < count; i++) {
        var curve = curves[index];
        var cs = split(curve[0], curve[1], curve[2], curve[3], curve[4], curve[5], curve[6], curve[7], 0.5);
        curves.splice(index, 1);
        curves.splice(index, 0, cs.left, cs.right);

        index += 2;
        if (index >= curves.length - 1) {
            index = 0;
        }
    }
};

function sync(shapes, count) {
    var _loop = function _loop(i) {
        var shape = shapes[shapes.length - 1];

        var newShape = [];

        shape.forEach(function (curve) {
            newShape.push(curve.slice(0));
        });

        shapes.push(newShape);
    };

    for (var i = 0; i < count; i++) {
        _loop(i);
    }
}

pasition.lerp = function (pathA, pathB, t) {};

pasition.MIM_CURVES_COUNT = 10;

pasition._preprocessing = function (pathA, pathB) {

    var lenA = pathA.length,
        lenB = pathB.length,
        clonePathA = JSON.parse(JSON.stringify(pathA)),
        clonePathB = JSON.parse(JSON.stringify(pathB));

    if (lenA > lenB) {
        sync(clonePathB, lenA - lenB);
    } else if (lenA < lenB) {
        sync(clonePathA, lenB - lenA);
    }

    clonePathA = sort(clonePathA, clonePathB);

    clonePathA.forEach(function (curves, index) {

        var lenA = curves.length,
            lenB = clonePathB[index].length;

        if (lenA > lenB) {
            if (lenA < pasition.MIM_CURVES_COUNT) {
                pasition._splitCurves(curves, pasition.MIM_CURVES_COUNT - lenA);
                pasition._splitCurves(clonePathB[index], pasition.MIM_CURVES_COUNT - lenB);
            } else {
                pasition._splitCurves(clonePathB[index], lenA - lenB);
            }
        } else if (lenA < lenB) {
            if (lenB < pasition.MIM_CURVES_COUNT) {
                pasition._splitCurves(curves, pasition.MIM_CURVES_COUNT - lenA);
                pasition._splitCurves(clonePathB[index], pasition.MIM_CURVES_COUNT - lenB);
            } else {
                pasition._splitCurves(curves, lenB - lenA);
            }
        }
    });

    clonePathA.forEach(function (curves, index) {
        clonePathA[index] = sortCurves(curves, clonePathB[index]);
    });

    return [clonePathA, clonePathB];
};

pasition._lerp = function (pathA, pathB, t) {
    var shapes = [];
    pathA.forEach(function (curves, index) {
        var newCurves = [];
        curves.forEach(function (curve, curveIndex) {
            newCurves.push(pasition.lerpCurve(curve, pathB[index][curveIndex], t));
        });
        shapes.push(newCurves);
    });
    return shapes;
};

pasition.animate = function (option) {
    var pathA = pasition.path2shapes(option.from);
    var pathB = pasition.path2shapes(option.to);

    var pathArr = pasition._preprocessing(pathA, pathB);
    console.log('pathArr', pathArr);

    var beginTime = new Date(),
        end = option.end || function () {},
        progress = option.progress || function () {},
        begin = option.begin || function () {},
        easing = option.easing || function (v) {
        return v;
    },
        tickId = null,
        outShape = null,
        time = option.time;

    begin(pathA);

    var tick = function tick() {
        var dt = new Date() - beginTime;
        if (dt >= time) {
            outShape = pathB;
            progress(outShape, 1);
            end(outShape);
            cancelAnimationFrame(tickId);
            return;
        }
        var percent = easing(dt / time);
        outShape = pasition._lerp(pathArr[0], pathArr[1], percent);
        progress(outShape, percent);
        tickId = requestAnimationFrame(tick);
    };
    tick();
};

return pasition;

})));
