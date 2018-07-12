'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _raf = require('raf');

var _raf2 = _interopRequireDefault(_raf);

var _tween = require('./tween.js');

var _tween2 = _interopRequireDefault(_tween);

var _Loading = require('./Loading');

var _Loading2 = _interopRequireDefault(_Loading);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /* eslint max-len: [0] */

/**
 *
 * @param {number} value
 * @param {number} min
 * @param {number} max
 */
function setScope(value, min, max) {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

function getDistanceBetweenTouches(e) {
  if (e.touches.length < 2) return 1;
  var x1 = e.touches[0].clientX;
  var y1 = e.touches[0].clientY;
  var x2 = e.touches[1].clientX;
  var y2 = e.touches[1].clientY;
  var distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  return distance;
}

// const msPerFrame = 1000 / 60;
var maxAnimateTime = 1000;
var minTapMoveValue = 5;
var maxTapTimeValue = 300;

/**
 * 图片默认展示模式：宽度等于屏幕宽度，高度等比缩放；水平居中，垂直居中或者居顶（当高度大于屏幕高度时）
 * 图片实际尺寸： actualWith, actualHeight
 * 图片初始尺寸： originWidth, originHeight
 * 坐标位置：left, top
 * 放大倍数：zoom
 * 最大放大倍数：maxZoomNum
 * 坐标关系：-(maxZoomNum - 1) * originWidth / 2 < left < 0
 *         -(maxZoomNum - 1) * originHeight / 2 < top < 0
 * 尺寸关系：width = zoom * originWidth
 *         heigth = zoom * originHeight
 *
 * 放大点位置关系：
 * 初始点位置：oldPointLeft, oldPointTop
 * 放大后位置：newPointLeft, newPointTop
 * 对应关系： newPointLeft = zoom * oldPointLeft
 *          newPointTop = zoom * oldPointTop
 *
 * 坐标位置：-1*left = -1*startLeft + (newPointLeft - oldPointLeft) =-1*startLeft (zoom - 1) * oldPointLeft
 *         -1*top = -1*startTop + (newPointTop - oldPointTop) =-1*startLeft (zoom - 1) * oldPointTop
 * =>
 * left = startLeft + (1 - zoom) * oldPointLeft
 * top = startTop + (1 - zoom) * oldPointTop
 */

var ImageContainer = function (_PureComponent) {
  _inherits(ImageContainer, _PureComponent);

  function ImageContainer() {
    _classCallCheck(this, ImageContainer);

    var _this2 = _possibleConstructorReturn(this, (ImageContainer.__proto__ || Object.getPrototypeOf(ImageContainer)).call(this));

    _this2.state = {
      width: 0,
      height: 0,
      scale: 1,
      left: 0,
      top: 0,
      isLoaded: false
    };

    _this2.onLoad = function () {
      _this2.actualWith = _this2.img.width;
      _this2.actualHeight = _this2.img.height;

      var _this2$props = _this2.props,
          screenHeight = _this2$props.screenHeight,
          screenWidth = _this2$props.screenWidth;


      var left = 0;
      var top = 0;

      _this2.originWidth = screenWidth;
      _this2.originHeight = _this2.actualHeight / _this2.actualWith * screenWidth;
      _this2.originScale = 1;

      if (_this2.actualHeight / _this2.actualWith < screenHeight / screenWidth) {
        top = parseInt((screenHeight - _this2.originHeight) / 2, 10);
      }
      _this2.originTop = top;

      _this2.setState({
        width: _this2.originWidth,
        height: _this2.originHeight,
        scale: 1,
        left: left,
        top: top,
        isLoaded: true
      });
    };

    _this2.onError = function () {
      _this2.setState({
        isLoaded: true
      });
    };

    _this2.loadImg = function (url) {
      _this2.img = new Image();
      _this2.img.src = url;
      _this2.img.onload = _this2.onLoad;
      _this2.img.onerror = _this2.onError;

      _this2.setState({
        isLoaded: false
      });
    };

    _this2.unloadImg = function () {
      delete _this2.img.onerror;
      delete _this2.img.onload;
      delete _this2.img.src;
      delete _this2.img;
    };

    _this2.handleTouchStart = function (event) {
      console.info('handleTouchStart');
      event.preventDefault();
      if (_this2.animationID) {
        _raf2.default.cancel(_this2.animationID);
      }
      switch (event.touches.length) {
        case 1:
          {
            var targetEvent = event.touches[0];
            _this2.startX = targetEvent.clientX;
            _this2.startY = targetEvent.clientY;
            _this2.diffX = 0;
            _this2.diffY = 0;

            _this2.startLeft = _this2.state.left;
            _this2.startTop = _this2.state.top;

            console.info('handleTouchStart this.startX = %s, this.startY = %s, this.startLeft = %s, this.startTop = %s', _this2.startX, _this2.startY, _this2.startLeft, _this2.startTop);

            _this2.onTouchStartTime = new Date().getTime();
            _this2.haveCallMoveFn = false;
            break;
          }
        case 2:
          {
            // 两个手指
            // 设置手双指模式
            _this2.isTwoFingerMode = true;

            // 计算两个手指中间点屏幕上的坐标
            var middlePointClientLeft = Math.abs(Math.round((event.touches[0].clientX + event.touches[1].clientX) / 2));
            var middlePointClientTop = Math.abs(Math.round((event.touches[0].clientY + event.touches[1].clientY) / 2));

            // 保存图片初始位置和尺寸
            _this2.startLeft = _this2.state.left;
            _this2.startTop = _this2.state.top;
            _this2.startScale = _this2.state.scale;

            // 计算手指中间点在图片上的位置（坐标值）
            _this2.oldPointLeft = middlePointClientLeft - _this2.startLeft;
            _this2.oldPointTop = middlePointClientTop - _this2.startTop;

            _this2._touchZoomDistanceStart = getDistanceBetweenTouches(event);
            break;
          }
        default:
          break;
      }
    };

    _this2.handleTouchMove = function (event) {
      event.preventDefault();

      switch (event.touches.length) {
        case 1:
          {
            var targetEvent = event.touches[0];
            var diffX = targetEvent.clientX - _this2.startX;
            var diffY = targetEvent.clientY - _this2.startY;

            _this2.diffX = diffX;
            _this2.diffY = diffY;
            console.info('handleTouchMove one diffX=%s, diffY=%s', diffX, diffY);
            // 判断是否为点击
            if (Math.abs(diffX) < minTapMoveValue && Math.abs(diffY) < minTapMoveValue) {
              return;
            }

            var _this2$state = _this2.state,
                scale = _this2$state.scale,
                left = _this2$state.left;

            var width = scale * _this2.originWidth;
            if (Math.abs(diffX) > Math.abs(diffY)) {
              // 水平移动
              if (_this2.state.scale === _this2.originScale && Math.abs(diffX) > minTapMoveValue) {
                _this2.haveCallMoveFn = true;
                _this2.callHandleMove(diffX);
                return;
              }

              console.info('handleMove one left=%s, this.startLeft=%s,this.originWidth=%s, width=%s', left, _this2.startLeft, _this2.originWidth, width);
              if (diffX < 0 && _this2.startLeft <= _this2.originWidth - width) {
                _this2.haveCallMoveFn = true;
                _this2.callHandleMove(diffX);
                return;
              }

              if (diffX > 0 && _this2.startLeft >= 0) {
                _this2.haveCallMoveFn = true;
                _this2.callHandleMove(diffX);
                return;
              }
            }

            var screenHeight = _this2.props.screenHeight;

            var height = scale * _this2.originHeight;
            var newTop = (screenHeight - height) / 2;
            var newLeft = _this2.startLeft + diffX;

            if (height > screenHeight || _this2.state.scale === _this2.originScale) {
              newTop = _this2.startTop + diffY;
            }
            console.info('handleTouchMove one newLeft=%s, newTop=%s', newLeft, newTop);
            _this2.setState({
              left: newLeft,
              top: newTop
            });

            break;
          }
        case 2:
          {
            // 两个手指
            _this2._touchZoomDistanceEnd = getDistanceBetweenTouches(event);

            var zoom = Math.sqrt(_this2._touchZoomDistanceEnd / _this2._touchZoomDistanceStart);
            var _scale = zoom * _this2.startScale;

            _this2.setState(function () {
              var left = _this2.startLeft + (1 - zoom) * _this2.oldPointLeft;
              var top = _this2.startTop + (1 - zoom) * _this2.oldPointTop;

              console.info('zoom = %s, left = %s, top = %s, scale', zoom, left, top, _scale);
              return {
                left: left,
                top: top,
                scale: _scale
              };
            });
            break;
          }
        default:
          break;
      }
    };

    _this2.handleTouchEnd = function (event) {
      console.info('handleTouchEnd', event.touches.length);
      event.preventDefault();

      if (_this2.isTwoFingerMode) {
        // 双指操作结束
        var touchLen = event.touches.length;
        _this2.isTwoFingerMode = false;

        if (touchLen === 1) {
          var targetEvent = event.touches[0];
          _this2.startX = targetEvent.clientX;
          _this2.startY = targetEvent.clientY;
          _this2.diffX = 0;
          _this2.diffY = 0;
        }

        _this2.setState(function (prevState, props) {
          var scale = setScope(prevState.scale, 1, props.maxZoomNum);
          var width = scale * _this2.originWidth;
          var height = scale * _this2.originHeight;
          var zoom = scale / _this2.startScale;
          var left = setScope(_this2.startLeft + (1 - zoom) * _this2.oldPointLeft, _this2.originWidth - width, 0);

          var top = void 0;
          if (height > props.screenHeight) {
            top = setScope(_this2.startTop + (1 - zoom) * _this2.oldPointTop, props.screenHeight - height, 0);
          } else {
            top = (props.screenHeight - height) / 2;
          }

          if (touchLen === 1) {
            _this2.startLeft = left;
            _this2.startTop = top;
            _this2.startScale = scale;
            console.info('this.startX = %s, this.startY = %s, this.startLeft = %s, this.startTop = %s', _this2.startX, _this2.startY, _this2.startLeft, _this2.startTop);
          }

          console.info('zoom = %s, left = %s, top = %s, width=%s, height= %s', zoom, left, top, width, height);
          return {
            left: left,
            top: top,
            scale: scale
          };
        });
      } else {
        // 单指结束（ontouchend）
        var diffTime = new Date().getTime() - _this2.onTouchStartTime;
        var diffX = _this2.diffX,
            diffY = _this2.diffY;


        console.info('handleTouchEnd one diffTime = %s, diffX = %s, diffy = %s', diffTime, diffX, diffY);
        // 判断为点击则关闭图片浏览组件
        if (diffTime < maxTapTimeValue && Math.abs(diffX) < minTapMoveValue && Math.abs(diffY) < minTapMoveValue) {
          _this2.context.onClose();
          return;
        }

        // 水平移动
        if (_this2.haveCallMoveFn) {
          var isChangeImage = _this2.callHandleEnd(diffY < 30);
          if (isChangeImage) {
            // 如果切换图片则重置当前图片状态
            setTimeout(function () {
              _this2.setState({
                scale: _this2.originScale,
                left: 0,
                top: _this2.originTop
              });
            }, maxAnimateTime / 3);
            return;
          }
        }
        // TODO 下拉移动距离超过屏幕高度的 1/3 则关闭
        // console.info(Math.abs(diffY) > (this.props.screenHeight / 2), this.startTop, this.originTop);
        // if (Math.abs(diffX) < Math.abs(diffY) && Math.abs(diffY) > (this.props.screenHeight / 3) && this.startTop === this.originTop) {
        //   this.context.onClose();
        //   return;
        // }

        var x = void 0;
        var y = void 0;
        var scale = _this2.state.scale;

        var width = scale * _this2.originWidth;
        var height = scale * _this2.originHeight;

        // 使用相同速度算法
        x = diffX * maxAnimateTime / diffTime + _this2.startLeft;
        y = diffY * maxAnimateTime / diffTime + _this2.startTop;

        if (_this2.state.scale === _this2.originScale) {
          x = 0;
        } else {
          x = setScope(x, _this2.originWidth - width, 0);
        }

        if (height > _this2.props.screenHeight) {
          y = setScope(y, _this2.props.screenHeight - height, 0);
        } else {
          y = _this.originTop;
        }

        // x = setScope(x, this.originWidth - width, 0);

        // if (height > this.props.screenHeight) {
        // y = setScope(y, this.props.screenHeight - height, 0);
        // } else {
        //   y = this.state.top;
        // }

        _this2.animateStartValue = {
          x: _this2.state.left,
          y: _this2.state.top
        };
        _this2.animateFinalValue = {
          x: x,
          y: y
        };
        _this2.animateStartTime = Date.now();
        _this2.startAnimate();
      }
    };

    _this2.startAnimate = function () {
      _this2.animationID = (0, _raf2.default)(function () {
        // calculate current time
        var curTime = Date.now() - _this2.animateStartTime;
        var left = void 0;
        var top = void 0;

        // animate complete
        if (curTime > maxAnimateTime) {
          _this2.setState(function (prevState, props) {
            var width = prevState.scale * _this2.originWidth;
            var height = prevState.scale * _this2.originHeight;
            left = setScope(prevState.left, _this2.originWidth - width, 0);

            if (height > props.screenHeight) {
              top = setScope(prevState.top, props.screenHeight - height, 0);
            } else {
              top = (props.screenHeight - height) / 2;
            }
            console.info('end animate left= %s, top = %s', left, top);
            return {
              left: left,
              top: top
            };
          });
        } else {
          left = _tween2.default.easeOutQuart(curTime, _this2.animateStartValue.x, _this2.animateFinalValue.x, maxAnimateTime);
          top = _tween2.default.easeOutQuart(curTime, _this2.animateStartValue.y, _this2.animateFinalValue.y, maxAnimateTime);

          console.info('startAnimate left= %s, top = %s, curTime = %s', left, top, curTime);
          _this2.setState({
            left: left,
            top: top
          });
          _this2.startAnimate();
        }
      });
    };

    _this2.callHandleMove = function (diffX) {
      if (!_this2.isCalledHandleStart) {
        _this2.isCalledHandleStart = true;
        if (_this2.props.handleStart) {
          _this2.props.handleStart();
        }
      }
      _this2.props.handleMove(diffX);
    };

    _this2.callHandleEnd = function (isAllowChange) {
      if (_this2.isCalledHandleStart) {
        _this2.isCalledHandleStart = false;
        if (_this2.props.handleEnd) {
          return _this2.props.handleEnd(isAllowChange);
        }
      }
    };

    _this2.actualHeight = 0; // 图片实际高度
    _this2.actualWith = 0; // 图片实际宽度

    _this2.originHeight = 0; // 图片默认展示模式下高度
    _this2.originWidth = 0; // 图片默认展示模式下宽度
    _this2.originScale = 1; // 图片初始缩放比例

    _this2.startLeft = 0; // 开始触摸操作时的 left 值
    _this2.startTop = 0; // 开始触摸操作时的 top 值
    _this2.startScale = 1; // 开始缩放操作时的 scale 值

    _this2.onTouchStartTime = 0; // 单指触摸开始时间

    _this2.isTwoFingerMode = false; // 是否为双指模式
    _this2.oldPointLeft = 0; // 计算手指中间点在图片上的位置（坐标值）
    _this2.oldPointTop = 0; // 计算手指中间点在图片上的位置（坐标值）
    _this2._touchZoomDistanceStart = 0; // 用于记录双指距离
    _this2.haveCallMoveFn = false;

    _this2.diffX = 0; // 记录最后 move 事件 移动距离
    _this2.diffY = 0; // 记录最后 move 事件 移动距离

    _this2.animationID = 0;
    _this2.animateStartTime = 0;
    _this2.animateStartValue = {
      x: 0,
      y: 0
    };
    _this2.animateFinalValue = {
      x: 0,
      y: 0
    };
    return _this2;
  }

  _createClass(ImageContainer, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      this.loadImg(this.props.src);
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this.unloadImg();
      if (this.animationID) {
        _raf2.default.cancel(this.animationID);
      }
    }
  }, {
    key: 'render',
    value: function render() {
      var _props = this.props,
          screenWidth = _props.screenWidth,
          screenHeight = _props.screenHeight,
          src = _props.src,
          divLeft = _props.left;
      var _state = this.state,
          isLoaded = _state.isLoaded,
          left = _state.left,
          top = _state.top,
          scale = _state.scale,
          width = _state.width,
          height = _state.height;


      var ImageStyle = {
        width: width,
        height: height
      };

      var translate = 'translate3d(' + left + 'px, ' + top + 'px, 0) scale(' + scale + ')';
      ImageStyle.WebkitTransform = translate;
      ImageStyle.transform = translate;

      var defaultStyle = {
        left: divLeft,
        width: screenWidth,
        height: screenHeight
      };
      // console.info('ImageContainer render');
      return _react2.default.createElement(
        'div',
        {
          className: 'viewer-image-container',
          onTouchStart: this.handleTouchStart,
          onTouchMove: this.handleTouchMove,
          onTouchEnd: this.handleTouchEnd,
          style: defaultStyle
        },
        isLoaded ? _react2.default.createElement('img', { src: src, style: ImageStyle, alt: '' }) : _react2.default.createElement(_Loading2.default, null)
      );
    }
  }]);

  return ImageContainer;
}(_react.PureComponent);

ImageContainer.propTypes = {
  maxZoomNum: _propTypes2.default.number.isRequired,
  handleStart: _propTypes2.default.func.isRequired,
  handleMove: _propTypes2.default.func.isRequired,
  handleEnd: _propTypes2.default.func.isRequired
};
ImageContainer.contextTypes = {
  onClose: _propTypes2.default.func
};
exports.default = ImageContainer;