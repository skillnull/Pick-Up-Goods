var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
var stopFlag = false;
$(".game-panel").css({"height": h, "width": w});
$(".start-box").css({"height": h, "width": w});
$("canvas").height(h).width(w);
$('.start-btn').click(function () {
    $(".start-box").css("display", "none");
    $('.game-box').css("display", "block");
});

function Ship (ctx) {
    gameMonitor.im.loadImage(['static/img/bucket.png']); // 接素材容器
    this.width = 80;
    this.height = 80;
    this.left = (gameMonitor.w / 2 - this.width / 2) + "px";
    this.top = (gameMonitor.h - 2 * this.height) + "px";
    this.player = gameMonitor.im.createImage('static/img/bucket.png'); // 接素材容器
    this.paint = function () {
        ctx.font = "20px Georgia";
        ctx.fillStyle = "white";
        ctx.fillText(parseInt(35 - gameMonitor.time / 60), 25, 70);
        ctx.drawImage(this.player, this.left, this.top, this.width, this.height);
    }
    this.setPosition = function (event) {
        if (gameMonitor.isMobile() && stopFlag == false) {
            var tarL = event.changedTouches[0].clientX;
            var tarT = event.changedTouches[0].clientY;
        } else {
            var tarL = event.offsetX;
            var tarT = event.offsetY;
        }
        this.left = tarL - this.width / 2;
        this.top = tarT - this.height / 2;
        if (this.left < 0) {
            this.left = 0;
        }
        if (this.left > gameMonitor.w - this.width) {
            this.left = gameMonitor.w - this.width;
        }
        // if (this.top < 0) {
        //     this.top = 0;
        // }
        // if (this.top > gameMonitor.h - this.height) {
        //     this.top = gameMonitor.h - this.height;
        // }
        this.top = gameMonitor.h - this.height - 30
        this.paint();
    }
    this.controll = function () {
        var _this = this;
        var stage = $('.game-panel');
        var currentX = this.left,
            currentY = this.top,
            move = false;
        stage.on(gameMonitor.eventType.start, function (event) {
            _this.setPosition(event);
            move = true;
        }).on(gameMonitor.eventType.end, function () {
            move = false;
        }).on(gameMonitor.eventType.move, function (event) {
            event.preventDefault();
            if (move) {
                _this.setPosition(event);
            }
        });
    }
    this.eat = function (foodlist) {
        for (var i = foodlist.length - 1; i >= 0; i--) {
            var f = foodlist[i];
            if (f) {
                var l1 = this.top + this.height / 2 - (f.top + f.height / 2);
                var l2 = this.left + this.width / 2 - (f.left + f.width / 2);
                var l3 = Math.sqrt(l1 * l1 + l2 * l2);
                if (l3 <= this.height / 2 + f.height / 2) {
                    foodlist[f.id] = null;

                    // if (f.type == '炸弹之类的需要停止游戏的素材，则停止游戏') {
                    //     stopFlag = true;
                    //     gameMonitor.stop();
                    //     $('.calculate-score-panel').show();
                    //     setTimeout(function () {
                    //         $('.calculate-score-panel').hide();
                    //         $('.result-panel').show();
                    //         gameMonitor.getScore();
                    //     }, 2000);
                    // } else {
                    //     $('.score').text(++gameMonitor.score);
                    //     $('.heart').removeClass('hearthot').addClass('hearthot');
                    //     setTimeout(function () {
                    //         $('.heart').removeClass('hearthot')
                    //     }, 200);
                    // }

                    switch (f.type) { // 素材分值
                        case 0:
                            gameMonitor.score = gameMonitor.score + 2;
                            break;
                        case 1:
                            ++gameMonitor.score;
                            break;
                    }
                    $('.score').text(gameMonitor.score);
                    $('.heart').removeClass('hearthot').addClass('hearthot');
                    setTimeout(function () {
                        $('.heart').removeClass('hearthot')
                    }, 200);
                }
            }
        }
    }
}

function Food (type, left, id) { // 绘制素材图片
    this.speedUpTime = 300;
    this.id = id;
    this.type = type;
    this.width = 50;
    this.height = 50;
    this.left = left;
    this.top = -50;
    this.speed = 0.04 * Math.pow(1.2, Math.floor(gameMonitor.time / this.speedUpTime));
    this.loop = 0;
    var p;
    switch (this.type) { // 为素材种类添加图片
        case 0:
            p = 'static/img/pig-gold.png';
            break;
        case 1:
            p = 'static/img/pig-red.png';
            break;
    }
    this.pic = gameMonitor.im.createImage(p);
}

Food.prototype.paint = function (ctx) {
    ctx.drawImage(this.pic, this.left, this.top, this.width, this.height);
}
Food.prototype.move = function (ctx) {
    if (gameMonitor.time % this.speedUpTime == 0) {
        this.speed *= 1.2;
    }
    this.top += ++this.loop * this.speed;
    if (this.top > gameMonitor.h) {
        gameMonitor.foodList[this.id] = null;
    }
    else {
        this.paint(ctx);
    }
}

function ImageMonitor () {
    var imgArray = [];
    return {
        createImage: function (src) {
            return typeof imgArray[src] != 'undefined' ? imgArray[src] : (imgArray[src] = new Image(), imgArray[src].src = src, imgArray[src])
        },
        loadImage: function (arr, callback) {
            for (var i = 0, l = arr.length; i < l; i++) {
                var img = arr[i];
                imgArray[img] = new Image();
                imgArray[img].onload = function () {
                    if (i == l - 1 && typeof callback == 'function') {
                        callback();
                    }
                }
                imgArray[img].src = img
            }
        }
    }
}

var gameMonitor = {
    w: w,
    h: h,
    bgWidth: w,
    bgHeight: 1126,
    time: 0,
    timmer: null,
    bgSpeed: 2,
    bgloop: 0,
    score: 0,
    im: new ImageMonitor(),
    foodList: [],
    bgDistance: 0, //背景位置
    eventType: {
        start: 'touchstart',
        move: 'touchmove',
        end: 'touchend'
    },
    init: function () {
        var _this = this;
        var canvas = document.getElementById('stage-canvas');
        canvas.setAttribute('width', w);
        canvas.setAttribute('height', h);
        var ctx = canvas.getContext('2d');
        /** @function 此处为为canvas添加背景图
         *  var bg = new Image();
         *   _this.bg = bg;
         *   bg.onload = function () {
         *       ctx.drawImage(bg, 0, 0, _this.bgWidth, _this.bgHeight);
         *   }
         *   bg.src = 'static/img/game-play-bg.jpg';
         */
        ctx.fillStyle = 'rgba(255, 255, 255, 0)';
        _this.initListener(ctx);
    },
    initListener: function (ctx) {
        var _this = this;
        var body = $(document.body);
        $(document).on(gameMonitor.eventType.move, function (event) {
            // 判断默认行为是否可以被禁用
            if (event.cancelable) {
                // 判断默认行为是否已经被禁用
                if (!event.defaultPrevented) {
                    event.preventDefault();
                }
            }
        }, {passive: false});
        body.on(gameMonitor.eventType.start, '.replay, .play-again', function () {
            $('.result-panel').hide();
            var canvas = document.getElementById('stage-canvas');
            var ctx = canvas.getContext('2d');
            _this.ship = new Ship(ctx);
            _this.ship.controll();
            stopFlag = false;
            _this.reset();
            _this.run(ctx);
        });
        body.on(gameMonitor.eventType.start, '#frontpage', function () {
            $('#frontpage').css('left', '-100%');
        });
        body.on(gameMonitor.eventType.start, '.ruler-btn', function () {
            $('.ruler-box').show();
        });
        body.on(gameMonitor.eventType.start, '.ruler-box', function () {
            $(this).hide();
        });
        // 玩法指引
        body.on(gameMonitor.eventType.start, '.play-guide-panel', function () {
            $(this).hide();
            _this.ship = new Ship(ctx);
            _this.ship.paint();
            _this.ship.controll();
            gameMonitor.run(ctx);
        });
        body.on(gameMonitor.eventType.start, '.share', function () {
            $(".qrcode").css("display", "inline-block");
        });
        body.on(gameMonitor.eventType.start, '.to-share', function () {
            $(".qrcode").css("display", "inline-block");
            $(".qrcode").css("display", "none");
        });
        WeixinApi.ready(function (Api) {
            // 微信分享的数据
            //分享给好友的数据
            var wxData = {
                "appId": ""
                , "imgUrl": "static/img/icon.png"
                , "link": "http://t.009v.com/wj/1026/index.html"
                , "desc": "苏皖肯德基"
                , "title": "“小食大作战”"
            };
            //朋友圈数据
            var wxDataPyq = {
                "appId": ""
                , "imgUrl": "static/img/icon.png"
                , "link": "http://t.009v.com/wj/1026/index.html"
                , "desc": "“苏皖肯德基”"
                , "title": "小食大作战"
            }
            // 分享的回调
            var wxCallbacks = {
                // 分享操作开始之前
                ready: function () {
                }
                , cancel: function (resp) {
                }
                , fail: function (resp) {
                }
                , confirm: function (resp) {
                }
                , all: function (resp) {
                    //location.href=location.href
                }
            };
            // 用户点开右上角popup菜单后，点击分享给好友，会执行下面这个代码
            Api.shareToFriend(wxData, wxCallbacks);
            // 点击分享到朋友圈，会执行下面这个代码
            Api.shareToTimeline(wxDataPyq, wxCallbacks);
            // 点击分享到腾讯微博，会执行下面这个代码
            Api.shareToWeibo(wxData, wxCallbacks);
        });
    },
    // rollBg: function (ctx) { // canvas 背景图滚动
    //     if (this.bgDistance >= this.bgHeight) {
    //         this.bgloop = 0;
    //     }
    //     this.bgDistance = ++this.bgloop * this.bgSpeed;
    //     ctx.drawImage(this.bg, 0, this.bgDistance - this.bgHeight, this.bgWidth, this.bgHeight);
    //     ctx.drawImage(this.bg, 0, this.bgDistance, this.bgWidth, this.bgHeight);
    // },
    run: function (ctx) {
        var _this = gameMonitor;
        ctx.clearRect(0, 0, _this.bgWidth, _this.bgHeight);
        // _this.rollBg(ctx); 此处调用背景图滚动
        // 绘制接素材容器
        _this.ship.paint();
        _this.ship.eat(_this.foodList);
        // 产生素材
        _this.genorateFood();
        // 绘制素材
        for (i = _this.foodList.length - 1; i >= 0; i--) {
            var f = _this.foodList[i];
            if (f) {
                f.paint(ctx);
                f.move(ctx);
            }
        }
        _this.timmer = setTimeout(function () {
            gameMonitor.run(ctx);
        }, Math.round(1000 / 60));
        if (_this.time > 2100) {
            gameMonitor.stop();
            $('.calculate-score-panel').show();
            setTimeout(function () {
                $('.calculate-score-panel').hide();
                $('.result-panel').show();
                gameMonitor.getScore();
            }, 2000);
        } else {
            _this.time++;
        }
    },
    stop: function () {
        var _this = this
        $('#stage-canvas').off(gameMonitor.eventType.start + ' ' + gameMonitor.eventType.move);
        setTimeout(function () {
            clearTimeout(_this.timmer);
        }, 0);
    },
    genorateFood: function () {
        var genRate = 50; // 产生下落素材的频率
        var random = Math.random();
        if (random * genRate > genRate - 1) {
            var left = Math.random() * (this.w - 50);
            var type = Math.floor(Math.random() * 2); // 产生素材种类数量
            var id = this.foodList.length;
            var f = new Food(type, left, id);
            this.foodList.push(f);
        }
    },
    reset: function () {
        this.foodList = [];
        this.bgloop = 0;
        this.score = 0;
        this.timmer = null;
        this.time = 0;
        $('.score').text(this.score);
    },
    getScore: function () {
        $('.get-reward-button').html('');
        $('.replay-button').html('');
        $('.result-score').html('');
        var time = Math.floor(this.time / 60);
        var score = this.score;
        var resultImg = new Image();
        if (score < 22) {
            $('.result-score').html('真遗憾，您得分低于22分');
            $('.get-reward-button').text('大侠请重新来过').removeClass('share').addClass('play-again');
            return;
        }
        else if (score >= 22 && score < 26) {
            resultImg.src = 'static/img/22-25.png';
        }
        else if (score >= 26 && score < 36) {
            resultImg.src = 'static/img/26-35.png';
        }
        else if (score >= 36 && score < 46) {
            resultImg.src = 'static/img/36-45.png';
        }
        else if (score >= 46 && score < 51) {
            resultImg.src = 'static/img/46-50.png';
        }
        else if (score >= 51 && score < 56) {
            resultImg.src = 'static/img/51-55.png';
        }
        else if (score >= 56 && score < 88) {
            // 这个区间没有给图
            resultImg.src = 'static/img/51-55.png';
        }
        else {
            resultImg.src = 'static/img/88.png';
        }
        var dom = document.getElementsByClassName('result-score')[0];
        dom.appendChild(resultImg);
        var getRewardBtn = new Image();
        getRewardBtn.src = 'static/img/get-coupon.png';
        var getRewardButtonDom = document.getElementsByClassName('get-reward-button')[0];
        getRewardButtonDom.appendChild(getRewardBtn);
        $('.get-reward-button').removeClass('play-again');
        $('.get-reward-button').click(function () {
            window.location.href = "http://www.baidu.com"
        })
        if (score >= 22) {
            var replayBtnImg = new Image();
            replayBtnImg.src = 'static/img/replay-btn.png';
            var replayButtonDom = document.getElementsByClassName('replay-button')[0];
            replayButtonDom.appendChild(replayBtnImg);
            $('.replay-button').removeClass('share').addClass('play-again');
        }
        $('#stime').text(time);
        $('#sscore').text(score);
    },
    isMobile: function () {
        var sUserAgent = navigator.userAgent.toLowerCase()
            , bIsIpad = sUserAgent.match(/ipad/i) == "ipad"
            , bIsIphoneOs = sUserAgent.match(/iphone os/i) == "iphone os"
            , bIsMidp = sUserAgent.match(/midp/i) == "midp"
            , bIsUc7 = sUserAgent.match(/rv:1.2.3.4/i) == "rv:1.2.3.4"
            , bIsUc = sUserAgent.match(/ucweb/i) == "ucweb"
            , bIsAndroid = sUserAgent.match(/android/i) == "android"
            , bIsCE = sUserAgent.match(/windows ce/i) == "windows ce"
            , bIsWM = sUserAgent.match(/windows mobile/i) == "windows mobile"
            , bIsWebview = sUserAgent.match(/webview/i) == "webview";
        return (bIsIpad || bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM);
    }
}
if (!gameMonitor.isMobile()) {
    gameMonitor.eventType.start = 'mousedown';
    gameMonitor.eventType.move = 'mousemove';
    gameMonitor.eventType.end = 'mouseup';
}
gameMonitor.init();
