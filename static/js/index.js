// 全局变量
var GlobalData = {
    clientWidth: window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth, // 视口宽
    clientHeight: window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight, // 视口高
    stopFlag: false,
    time: 0, // 倒计时时间
    timer: null, // 倒计时计时器
    bgRollSpeed: 2, // 背景滚动速度
    bgRoll: 0, // 背景滚动
    score: 0, // 得分
    materialList: [], // 下落素材列表
    bgDistance: 0, // 背景位置
    eventType: {
        start: 'touchstart',
        move: 'touchmove',
        end: 'touchend'
    }
}
// 方法库
var MethodsLibrary = {
    // 初始化页面
    init: function () {
        var CTX = MethodsLibrary.drawStageCanvas()
        var _this = this
        var body = $(document.body)
        $('.game-box').css({'width': GlobalData.clientWidth, 'height': GlobalData.clientHeight})
        $('.start-box').css({'width': GlobalData.clientWidth, 'height': GlobalData.clientHeight})
        $('.game-panel').css({'width': GlobalData.clientWidth, 'height': GlobalData.clientHeight})
        $('.start-btn').click(function () {
            $('.start-box').css('display', 'none')
            $('.game-box').css('display', 'block')
        })
        MethodsLibrary.setEventTypeIfNotMobile()
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
            GlobalData.stopFlag = false
            _this.reset()
            _this.run(stageCTX)
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
        body.on(GlobalData.eventType.start, '.play-guide-panel', function () {
            $(this).hide()
            _this.vessel = new MethodsLibrary.Vessel(CTX)
            _this.vessel.operateVessel()
            _this.reset()
            _this.run(CTX)
        })
        MethodsLibrary.weixinShare()
    },
    // 绘制舞台
    drawStageCanvas: function () {
        var canvas = document.getElementById('stage-canvas')
        canvas.setAttribute('width', GlobalData.clientWidth)
        canvas.setAttribute('height', GlobalData.clientHeight)
        var ctx = canvas.getContext('2d')
        /** @function 此处为为canvas添加背景图
         *  var _this = this
         *  var bg = new Image()
         *   _this.bg = bg
         *   bg.onload = function () {
         *       ctx.drawImage(bg, 0, 0, GlobalData.clientWidth, GlobalData.clientHeight)
         *   }
         *   bg.src = 'static/img/game-play-bg.jpg'
         */
        ctx.fillStyle = 'rgba(255, 255, 255, 0)'
        return ctx
    },
    // 微信分享
    weixinShare: function () {
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
    // 动态生成图片构造函数
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
    // 接素材容器构造函数
    Vessel: function (ctx) {
        this.vesselWidth = 80
        this.vesselHeight = 80
        this.left = (GlobalData.clientWidth / 2 - this.vesselWidth / 2) + 'px'
        this.top = (GlobalData.clientHeight - 2 * this.vesselHeight) + 'px'
        // 绘制容器
        this.initVessel = function () {
            var imageMonitor = new MethodsLibrary.ImageMonitor()
            imageMonitor.loadImage(['static/img/bucket.png'])
            this.player = imageMonitor.createImage('static/img/bucket.png')
            ctx.drawImage(this.player, this.left, this.top, this.vesselWidth, this.vesselHeight)
        }
        // 设置容器当前位置
        this.setVesselPosition = function (event) {
            var tarL = ''
            var tarT = ''
            if (MethodsLibrary.isMobile() && GlobalData.stopFlag === false) {
                if (event) {
                    tarL = event.changedTouches[0].clientX
                    tarT = event.changedTouches[0].clientY
                } else {
                    // 接素材容器开始默认位置
                    tarL = GlobalData.clientWidth / 2
                    tarT = GlobalData.clientHeight / 2
                }
            } else {
                tarL = event.offsetX
                tarT = event.offsetY
            }
            this.left = tarL - this.vesselWidth / 2
            this.top = tarT - this.vesselHeight / 2
            if (this.left < 0) {
                this.left = 0
            }
            if (this.left > GlobalData.clientWidth - this.vesselWidth) {
                this.left = GlobalData.clientWidth - this.vesselWidth
            }
            // if (this.top < 0) {
            //     this.top = 0
            // }
            // if (this.top > GlobalData.clientHeight - this.vesselHeight) {
            //     this.top = GlobalData.clientHeight - this.vesselHeight
            // }
            this.top = GlobalData.clientHeight - this.vesselHeight - 30
        }
        // 操作容器
        this.operateVessel = function () {
            var stage = $('.game-panel')
            var move = false
            var _this = this
            _this.setVesselPosition()
            stage.on(GlobalData.eventType.start, function (event) {
                _this.setVesselPosition(event)
                move = true
            }).on(GlobalData.eventType.end, function () {
                move = false
            }).on(GlobalData.eventType.move, function (event) {
                event.preventDefault()
                if (move) {
                    _this.setVesselPosition(event)
                }
            })
        }
        // 素材接触消融
        this.contactMelt = function (materialList) {
            for (var i = materialList.length - 1; i >= 0; i--) {
                var item = materialList[i]
                if (item) {
                    var l1 = this.top + this.vesselHeight / 2 - (item.top + item.height / 2)
                    var l2 = this.left + this.vesselWidth / 2 - (item.left + item.width / 2)
                    var l3 = Math.sqrt(l1 * l1 + l2 * l2)
                    if (l3 <= this.vesselHeight / 2 + item.height / 2) {
                        materialList[item.id] = null
                        // if (item.type == '炸弹之类的需要停止游戏的素材，则停止游戏') {
                        //     GlobalData.stopFlag = true
                        //     MethodsLibrary.stop()
                        //     $('.calculate-score-panel').show()
                        //     setTimeout(function () {
                        //         $('.calculate-score-panel').hide()
                        //         $('.result-panel').show()
                        //         MethodsLibrary.calculateResult()
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
    // 素材生成构造函数
    Material: function (type, left, id) { // 绘制素材图片
        var _this = this
        _this.speedUpTime = 300
        _this.id = id
        _this.type = type
        _this.width = 50
        _this.height = 50
        _this.left = left
        _this.top = -50
        _this.speed = 0.04 * Math.pow(1.2, Math.floor(GlobalData.time / this.speedUpTime))
        _this.loop = 0
        var materialItem
        switch (_this.type) { // 为素材种类添加图片
            case 0:
                materialItem = 'static/img/pig-gold.png'
                break
            case 1:
                materialItem = 'static/img/pig-red.png'
                break
        }
        var imageMonitor = new MethodsLibrary.ImageMonitor()
        _this.pic = imageMonitor.createImage(materialItem)
        MethodsLibrary.Material.prototype.paint = function (ctx) { // 绘制食物
            ctx.drawImage(this.pic, this.left, this.top, this.width, this.height)
        }
        MethodsLibrary.Material.prototype.move = function (ctx) {
            if (GlobalData.time % this.speedUpTime === 0) {
                this.speed *= 1.4
            }
            this.top += ++this.loop * this.speed
            if (this.top > GlobalData.clientHeight) {
                GlobalData.materialList[this.id] = null
            } else {
                this.paint(ctx)
            }
        }
    },
    // 绘制倒计时
    countDown: function (ctx) {
        ctx.font = '20px Georgia'
        ctx.fillStyle = 'white'
        ctx.fillText(parseInt(35 - GlobalData.time / 60), 25, 70)
    },
    // 重置游戏
    reset: function () {
        GlobalData.materialList = []
        GlobalData.score = 0
        GlobalData.timer = null
        GlobalData.time = 0
        // GlobalData.bgRoll = 0
        $('.score').text(GlobalData.score)
    },
    // 开始游戏
    run: function (ctx) {
        ctx.clearRect(0, 0, GlobalData.clientWidth, GlobalData.clientHeight)
        // this.rollBg(ctx) 此处调用背景图滚动
        MethodsLibrary.countDown(ctx)
        this.vessel.initVessel(GlobalData.materialList)
        this.vessel.contactMelt(GlobalData.materialList)
        // 产生素材
        MethodsLibrary.genorateMaterial()
        // 绘制素材
        for (var i = GlobalData.materialList.length - 1; i >= 0; i--) {
            var f = GlobalData.materialList[i]
            if (f) {
                f.paint(ctx)
                f.move(ctx)
            }
        }
        GlobalData.timer = setTimeout(function () {
            MethodsLibrary.run(ctx)
        }, Math.round(1000 / 60))
        if (GlobalData.time > 2100) {
            MethodsLibrary.stop(ctx)
            $('.calculate-score-panel').show()
            setTimeout(function () {
                $('.calculate-score-panel').hide()
                $('.result-panel').show()
                MethodsLibrary.calculateResult()
            }, 2000)
        } else {
            GlobalData.time++
        }
    },
    // 停止游戏
    stop: function (ctx) {
        ctx.clearRect(0, 0, GlobalData.clientWidth, GlobalData.clientHeight)
        $('#stage-canvas').off(GlobalData.eventType.start + ' ' + GlobalData.eventType.move)
        setTimeout(function () {
            clearTimeout(GlobalData.timer)
        }, 0)
    },
    // 产生素材
    genorateMaterial: function () {
        var genRate = 50 // 产生下落素材的频率
        var random = Math.random()
        if (random * genRate > genRate - 1) {
            var left = Math.random() * (GlobalData.clientWidth - 50)
            var type = Math.floor(Math.random() * 2) // 产生素材种类数量
            var id = GlobalData.materialList.length
            var material = new MethodsLibrary.Material(type, left, id)
            GlobalData.materialList.push(material)
        }
    },
    // 计算结果
    calculateResult: function () {
        $('.get-reward-button').html('')
        $('.replay-button').html('')
        $('.result-score').html('')
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
    },
    // 判断是否是移动端
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
    },
    // 对不是移动端的enentType进行赋值
    setEventTypeIfNotMobile: function () {
        if (!MethodsLibrary.isMobile()) {
            GlobalData.eventType.start = 'mousedown'
            GlobalData.eventType.move = 'mousemove'
            GlobalData.eventType.end = 'mouseup'
        }
    }
    // canvas 背景图滚动
    // rollBg: function (ctx) {
    //     if (this.bgDistance >= this.height) {
    //         this.bgRoll = 0
    //     }
    //     this.bgDistance = ++this.bgRoll * this.bgRollSpeed
    //     ctx.drawImage(this.bg, 0, this.bgDistance - this.height, this.width, this.height)
    //     ctx.drawImage(this.bg, 0, this.bgDistance, this.bgWidth, this.bgHeight)
    // }
}

MethodsLibrary.init()
