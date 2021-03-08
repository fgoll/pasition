import arcToBezier from  './arc2bezier.js'
import parser from './svg-path-parser.js'
import { sort, sortCurves } from './sort.js'

let pasition = {}
pasition.parser = parser

pasition.lerpCurve = function (pathA, pathB, t) {
  return pasition.lerpPoints(pathA[0], pathA[1], pathB[0], pathB[1], t)
                 .concat(pasition.lerpPoints(pathA[2], pathA[3], pathB[2], pathB[3], t))
                 .concat(pasition.lerpPoints(pathA[4], pathA[5], pathB[4], pathB[5], t))
                 .concat(pasition.lerpPoints(pathA[6], pathA[7], pathB[6], pathB[7], t))
}


pasition.lerpPoints = function (x1, y1, x2, y2, t) {
  return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]
}

pasition.q2b = function (x1, y1, x2, y2, x3, y3) {

}

pasition.path2shapes = function (path) {
  // 解析 svg path
  let cmds = pasition.parser(path)
  let preX = 0,
      preY = 0,
      j = 0,
      sLen,
      len = cmds.length,
      closeX,
      closeY,
      current,
      shapes = [];

  for (; j < len; j++) {
    let item = cmds[j]
    let action = item[0]
    let preItem = cmds[j - 1]
   
    switch (action) {
      case 'M':

        sLen = shapes.length
        shapes[sLen] = []
        current = shapes[sLen]
        preX = item[1]
        preY = item[2]
        break

      case 'L':

        current.push([preX, preY, item[1], item[2], item[1], item[2], item[1], item[2]])
        preX = item[1]
        preY = item[2]

        break

      case 'Z':
        closeX = current[0][0]
        closeY = current[0][1]
        current.push([preX, preY, closeX, closeY, closeX, closeY, closeX, closeY])
        break
    }

  }

  return shapes
}


pasition._upCurves = function (curves, count) {
   
}

function split(x1, y1, x2, y2, x3, y3, x4, y4, t) {
  
}

function _split(x1, y1, x2, y2, x3, y3, x4, y4, t, reverse) {

}

pasition._splitCurves = function (curves, count) {
 
}

function sync(shapes, count) {
  for (let i = 0; i < count; i ++) {
    let shape = shapes[shapes.length - 1]

    let newShape = []

    shape.forEach(function (curve) {
      newShape.push(curve.slice(0))
    })

    shapes.push(newShape)
  }
}

pasition.lerp = function (pathA, pathB, t) {

}

pasition.MIM_CURVES_COUNT = 100

pasition._preprocessing = function(pathA, pathB) {

  let lenA = pathA.length,
      lenB = pathB.length,
      clonePathA = JSON.parse(JSON.stringify(pathA)),
      clonePathB = JSON.parse(JSON.stringify(pathB));

  if (lenA > lenB) {
    sync(clonePathB, lenA - lenB)
  } else if (lenA < lenB) {
    sync(clonePathA, lenB - lenA)
  }

  clonePathA = sort(clonePathA, clonePathB)
  
  clonePathA.forEach(function(curves, index) {
    clonePathA[index] = sortCurves(curves, clonePathB[index])
  })

  return [clonePathA, clonePathB]
}

pasition._lerp = function (pathA, pathB, t) {
  let shapes = []
  pathA.forEach(function (curves, index) {
      let newCurves = []
      curves.forEach(function (curve, curveIndex) {
          newCurves.push(pasition.lerpCurve(curve, pathB[index][curveIndex], t))
      })
      shapes.push(newCurves)
  })
  return shapes

}


pasition.animate = function (option) {
  let pathA = pasition.path2shapes(option.from)
  let pathB = pasition.path2shapes(option.to)

  let pathArr = pasition._preprocessing(pathA, pathB)
  console.log('pathArr', pathArr)

  let beginTime = new Date(),
      end = option.end || function () {
          },
      progress = option.progress || function () {
          },
      begin = option.begin || function () {
          },
      easing = option.easing || function (v) {
              return v
          },
      tickId = null,
      outShape = null,
      time = option.time

  begin(pathA)

  let tick = function () {
    let dt = new Date() - beginTime
    if (dt >= time) {
        outShape = pathB
        progress(outShape, 1)
        end(outShape)
        cancelAnimationFrame(tickId)
        return
    }
    let percent = easing(dt / time)
    outShape = pasition._lerp(pathArr[0], pathArr[1], percent)
    progress(outShape, percent)
    tickId = setTimeout(tick, 500)
  }
  tick()
}

export default pasition
