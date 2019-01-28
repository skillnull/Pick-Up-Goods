var w = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth
var h = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
var stopFlag = false
$('.game-box').css({'height': h, 'width': w})
$('.start-box').css({'height': h, 'width': w})
$('.game-panel').css({'height': h, 'width': w})
$('canvas').height(h).width(w)
$('.start-btn').click(function () {
    $('.start-box').css('display', 'none')
    $('.game-box').css('display', 'block')
})

var GlobalData = {
    w: w,
    h: h,
    bgWidth: w,
    bgHeight: h,
    time: 0,
    timmer: null,
    bgSpeed: 2,
    bgloop: 0,
    score: 0,
    foodList: [],
    bgDistance: 0, // 背景位置
    eventType: {
        start: 'touchstart',
        move: 'touchmove',
        end: 'touchend'
    }
}

var MethodsLibrary = {
    init: function () {
        var canvas = document.getElementById('stage-canvas')
        canvas.setAttribute('width', w)
        canvas.setAttribute('height', h)
        var ctx = canvas.getContext('2d')
        /** @function 此处为为canvas添加背景图
         *  var bg = new Image()
         *   _this.bg = bg
         *   bg.onload = function () {
         *       ctx.drawImage(bg, 0, 0, _this.bgWidth, _this.bgHeight)
         *   }
         *   bg.src = 'static/img/game-play-bg.jpg'
         */
        ctx.fillStyle = 'rgba(255, 255, 255, 0)'
        MethodsLibrary.initListener(ctx)
    },
    initListener: function (ctx) {
        var _this = this
        var body = $(document.body)
        $(document).on(GlobalData.eventType.move, function (event) {
            // 判断默认行为是否可以被禁用
            if (event.cancelable) {
                // 判断默认行为是否已经被禁用
                if (!event.defaultPrevented) {
                    event.preventDefault()
                }
            }
        }, {passive: false})
        body.on(GlobalData.eventType.start, '.play-again', function () {
            $('.result-panel').hide()
            stopFlag = false
            _this.reset()
            _this.run(ctx)
        })
        body.on(GlobalData.eventType.start, '#frontpage', function () {
            $('#frontpage').css('left', '-100%')
        })
        body.on(GlobalData.eventType.start, '.ruler-btn', function () {
            $('.ruler-box').show()
        })
        body.on(GlobalData.eventType.start, '.ruler-box', function () {
            $(this).hide()
        })
        // 玩法指引
        body.on(GlobalData.eventType.start, '.play-guide-panel', function () {
            $(this).hide()
            _this.vessel = new MethodsLibrary.Vessel(ctx)
            _this.vessel.controll()
            _this.reset()
            _this.run(ctx)
        })
        WeixinApi.ready(function (Api) {
            // 微信分享的数据
            // 分享给好友的数据
            var wxData = {
                'appId': '',
                'imgUrl': 'static/img/pig-gold.png',
                'link': 'http://www.skillnull.com',
                'desc': 'KFC',
                'title': '“金猪扑满”'
            }
            // 朋友圈数据
            var wxDataPyq = {
                'appId': '',
                'imgUrl': 'static/img/pig-gold.png',
                'link': 'http://www.skillnull.com',
                'desc': '“KFC”',
                'title': '金猪扑满'
            }
            // 分享的回调
            var wxCallbacks = {
                // 分享操作开始之前
                ready: function () {
                },
                cancel: function (resp) {
                },
                fail: function (resp) {
                },
                confirm: function (resp) {
                },
                all: function (resp) {
                    // location.href=location.href
                }
            }
            // 用户点开右上角popup菜单后，点击分享给好友，会执行下面这个代码
            Api.shareToFriend(wxData, wxCallbacks)
            // 点击分享到朋友圈，会执行下面这个代码
            Api.shareToTimeline(wxDataPyq, wxCallbacks)
            // 点击分享到腾讯微博，会执行下面这个代码
            Api.shareToWeibo(wxData, wxCallbacks)
        })
    },
    // 接物品容器
    Vessel: function (ctx) {
        var imageMonitor = new MethodsLibrary.ImageMonitor()
        imageMonitor.loadImage(['static/img/bucket.png'])
        this.width = 80
        this.height = 80
        this.left = (GlobalData.w / 2 - this.width / 2) + 'px'
        this.top = (GlobalData.h - 2 * this.height) + 'px'
        this.player = imageMonitor.createImage('static/img/bucket.png')
        this.countDown = function () { // 绘制倒计时
            ctx.font = '20px Georgia'
            ctx.fillStyle = 'white'
            ctx.fillText(parseInt(35 - GlobalData.time / 60), 25, 70)
            ctx.drawImage(this.player, this.left, this.top, this.width, this.height)
        }
        this.setPosition = function (event) {
            var tarL = ''
            var tarT = ''
            if (MethodsLibrary.isMobile() && stopFlag === false) {
                if (event) {
                    tarL = event.changedTouches[0].clientX
                    tarT = event.changedTouches[0].clientY
                } else {
                    // 接素材容器开始默认位置
                    tarL = w / 2
                    tarT = h / 2
                }
            } else {
                tarL = event.offsetX
                tarT = event.offsetY
            }
            this.left = tarL - this.width / 2
            this.top = tarT - this.height / 2
            if (this.left < 0) {
                this.left = 0
            }
            if (this.left > GlobalData.w - this.width) {
                this.left = GlobalData.w - this.width
            }
            // if (this.top < 0) {
            //     this.top = 0
            // }
            // if (this.top > GlobalData.h - this.height) {
            //     this.top = GlobalData.h - this.height
            // }
            this.top = GlobalData.h - this.height - 30
        }
        this.controll = function () {
            var stage = $('.game-panel')
            var move = false
            var _this = this
            _this.setPosition()
            stage.on(GlobalData.eventType.start, function (event) {
                _this.setPosition(event)
                move = true
            }).on(GlobalData.eventType.end, function () {
                move = false
            }).on(GlobalData.eventType.move, function (event) {
                event.preventDefault()
                if (move) {
                    _this.setPosition(event)
                }
            })
        }
        this.eat = function (foodlist) {
            for (var i = foodlist.length - 1; i >= 0; i--) {
                var item = foodlist[i]
                if (item) {
                    var l1 = this.top + this.height / 2 - (item.top + item.height / 2)
                    var l2 = this.left + this.width / 2 - (item.left + item.width / 2)
                    var l3 = Math.sqrt(l1 * l1 + l2 * l2)
                    if (l3 <= this.height / 2 + item.height / 2) {
                        foodlist[item.id] = null

                        // if (item.type == '炸弹之类的需要停止游戏的素材，则停止游戏') {
                        //     stopFlag = true
                        //     MethodsLibrary.stop()
                        //     $('.calculate-score-panel').show()
                        //     setTimeout(function () {
                        //         $('.calculate-score-panel').hide()
                        //         $('.result-panel').show()
                        //         MethodsLibrary.getScore()
                        //     }, 2000)
                        // } else {
                        //     $('.score').text(++GlobalData.score)
                        //     $('.heart').removeClass('hearthot').addClass('hearthot')
                        //     setTimeout(function () {
                        //         $('.heart').removeClass('hearthot')
                        //     }, 200)
                        // }

                        switch (item.type) { // 素材分值
                            case 0:
                                GlobalData.score = GlobalData.score + 2
                                break
                            case 1:
                                ++GlobalData.score
                                break
                        }
                        $('.score').text(GlobalData.score)
                        $('.heart').removeClass('hearthot').addClass('hearthot')
                        setTimeout(function () {
                            $('.heart').removeClass('hearthot')
                        }, 200)
                    }
                }
            }
        }
    },
    ImageMonitor: function () {
        var imgArray = []
        return {
            createImage: function (src) {
                let result = typeof imgArray[src] !== 'undefined' ? imgArray[src] : (imgArray[src] = new Image(), imgArray[src].src = src, imgArray[src])
                return result
            },
            loadImage: function (arr, callback) {
                for (var i = 0, l = arr.length; i < l; i++) {
                    var img = arr[i]
                    imgArray[img] = new Image()
                    imgArray[img].onload = function () {
                        if (i === l - 1 && typeof callback === 'function') {
                            callback()
                        }
                    }
                    imgArray[img].src = img
                }
            }
        }
    },
    reset: function () {
        GlobalData.foodList = []
        GlobalData.bgloop = 0
        GlobalData.score = 0
        GlobalData.timmer = null
        GlobalData.time = 0
        $('.score').text(GlobalData.score)
    },
    run: function (ctx) {
        ctx.clearRect(0, 0, GlobalData.bgWidth, GlobalData.bgHeight)
        // this.rollBg(ctx) 此处调用背景图滚动
        this.vessel.countDown()
        this.vessel.eat(GlobalData.foodList)
        // 产生素材
        MethodsLibrary.genorateFood()
        // 绘制素材
        for (var i = GlobalData.foodList.length - 1; i >= 0; i--) {
            var f = GlobalData.foodList[i]
            if (f) {
                f.paint(ctx)
                f.move(ctx)
            }
        }
        GlobalData.timmer = setTimeout(function () {
            MethodsLibrary.run(ctx)
        }, Math.round(1000 / 60))
        if (GlobalData.time > 2100) {
            MethodsLibrary.stop(ctx)
            $('.calculate-score-panel').show()
            setTimeout(function () {
                $('.calculate-score-panel').hide()
                $('.result-panel').show()
                MethodsLibrary.getScore()
            }, 2000)
        } else {
            GlobalData.time++
        }
    },
    stop: function (ctx) {
        ctx.clearRect(0, 0, GlobalData.bgWidth, GlobalData.bgHeight)
        $('#stage-canvas').off(GlobalData.eventType.start + ' ' + GlobalData.eventType.move)
        setTimeout(function () {
            clearTimeout(GlobalData.timmer)
        }, 0)
    },
    genorateFood: function () {
        var genRate = 50 // 产生下落素材的频率
        var random = Math.random()
        if (random * genRate > genRate - 1) {
            var left = Math.random() * (GlobalData.w - 50)
            var type = Math.floor(Math.random() * 2) // 产生素材种类数量
            var id = GlobalData.foodList.length
            var f = new Food(type, left, id)
            GlobalData.foodList.push(f)
        }
    },
    getScore: function () {
        $('.get-reward-button').html('')
        $('.replay-button').html('')
        $('.result-score').html('')
        var time = Math.floor(GlobalData.time / 60)
        var score = GlobalData.score
        var resultImg = new Image()
        var resultLink = ''
        if (score < 22) {
            $('.result-score').html('真遗憾，您得分低于22分')
            $('.get-reward-button').text('大侠请重新来过').removeClass('share').addClass('play-again')
            return
        } else if (score >= 22 && score < 26) {
            resultImg.src = 'static/img/22-25.png'
            resultLink = 'http://www.baidu.com'
        } else if (score >= 26 && score < 36) {
            resultImg.src = 'static/img/26-35.png'
            resultLink = 'http://www.baidu.com'
        } else if (score >= 36 && score < 46) {
            resultImg.src = 'static/img/36-45.png'
            resultLink = 'http://www.baidu.com'
        } else if (score >= 46 && score < 51) {
            resultImg.src = 'static/img/46-50.png'
            resultLink = 'http://www.baidu.com'
        } else if (score >= 51 && score < 56) {
            resultImg.src = 'static/img/51-55.png'
            resultLink = 'http://www.baidu.com'
        } else if (score >= 56 && score < 88) {
            // 这个区间没有给图
            resultImg.src = 'static/img/51-55.png'
            resultLink = 'http://www.baidu.com'
        } else {
            resultImg.src = 'static/img/88.png'
            resultLink = 'http://www.baidu.com'
        }
        var dom = document.getElementsByClassName('result-score')[0]
        dom.appendChild(resultImg)
        var getRewardBtn = new Image()
        getRewardBtn.src = 'static/img/get-coupon.png'
        var getRewardButtonDom = document.getElementsByClassName('get-reward-button')[0]
        getRewardButtonDom.appendChild(getRewardBtn)
        $('.get-reward-button').removeClass('play-again')
        $('.get-reward-button').click(function () {
            window.location.href = resultLink
        })
        if (score >= 22) {
            var replayBtnImg = new Image()
            replayBtnImg.src = 'static/img/replay-btn.png'
            var replayButtonDom = document.getElementsByClassName('replay-button')[0]
            replayButtonDom.appendChild(replayBtnImg)
            $('.replay-button').removeClass('share').addClass('play-again')
        }
        $('#stime').text(time)
        $('#sscore').text(score)
    },
    isMobile: function () {
        var sUserAgent = navigator.userAgent.toLowerCase()
        var bIsIpad = sUserAgent.match(/ipad/i) && sUserAgent.match(/ipad/i)[0] === 'ipad'
        var bIsIphoneOs = sUserAgent.match(/iphone os/i) && sUserAgent.match(/iphone os/i)[0] === 'iphone os'
        var bIsMidp = sUserAgent.match(/midp/i) && sUserAgent.match(/midp/i)[0] === 'midp'
        var bIsUc7 = sUserAgent.match(/rv:1.2.3.4/i) && sUserAgent.match(/rv:1.2.3.4/i)[0] === 'rv:1.2.3.4'
        var bIsUc = sUserAgent.match(/ucweb/i) && sUserAgent.match(/ucweb/i)[0] === 'ucweb'
        var bIsAndroid = sUserAgent.match(/android/i) && sUserAgent.match(/android/i)[0] === 'android'
        var bIsCE = sUserAgent.match(/windows ce/i) && sUserAgent.match(/windows ce/i)[0] === 'windows ce'
        var bIsWM = sUserAgent.match(/windows mobile/i) && sUserAgent.match(/windows mobile/i)[0] === 'windows mobile'
        var bIsWebview = sUserAgent.match(/webview/i) && sUserAgent.match(/webview/i)[0] === 'webview'
        return (bIsIpad || bIsIphoneOs || bIsMidp || bIsUc7 || bIsUc || bIsAndroid || bIsCE || bIsWM || bIsWebview)
    }
    // 背景位置
    // rollBg: function (ctx) { // canvas 背景图滚动
    //     if (this.bgDistance >= this.bgHeight) {
    //         this.bgloop = 0
    //     }
    //     this.bgDistance = ++this.bgloop * this.bgSpeed
    //     ctx.drawImage(this.bg, 0, this.bgDistance - this.bgHeight, this.bgWidth, this.bgHeight)
    //     ctx.drawImage(this.bg, 0, this.bgDistance, this.bgWidth, this.bgHeight)
    // }
}

if (!MethodsLibrary.isMobile()) {
    GlobalData.eventType.start = 'mousedown'
    GlobalData.eventType.move = 'mousemove'
    GlobalData.eventType.end = 'mouseup'
}

function Food (type, left, id) { // 绘制素材图片
    this.speedUpTime = 300
    this.id = id
    this.type = type
    this.width = 50
    this.height = 50
    this.left = left
    this.top = -50
    this.speed = 0.04 * Math.pow(1.2, Math.floor(GlobalData.time / this.speedUpTime))
    this.loop = 0
    var p
    switch (this.type) { // 为素材种类添加图片
        case 0:
            p = 'static/img/pig-gold.png'
            break
        case 1:
            p = 'static/img/pig-red.png'
            break
    }
    var imageMonitor = new MethodsLibrary.ImageMonitor()
    this.pic = imageMonitor.createImage(p)
}

Food.prototype.paint = function (ctx) { // 绘制食物
    ctx.drawImage(this.pic, this.left, this.top, this.width, this.height)
}
Food.prototype.move = function (ctx) {
    if (GlobalData.time % this.speedUpTime === 0) {
        this.speed *= 1.4
    }
    this.top += ++this.loop * this.speed
    if (this.top > GlobalData.h) {
        GlobalData.foodList[this.id] = null
    } else {
        this.paint(ctx)
    }
}
MethodsLibrary.init()
