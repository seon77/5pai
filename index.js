var Logger = {
    ctimestamp:Date.now(),
    ptimestamp:Date.now(),
    checklogs:[],
    pricelogs:[],
    check:function(string){
        var elem = $('#log_cont');
        var _this = this;
        var date = new Date();
        var now = date.getTime();
        if(_this.checklogs.length > 200){
            _this.checklogs.splice(0,1);
        }
        _this.checklogs.push('[' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '.' + date.getMilliseconds() + '][' + (now - _this.ctimestamp) + ']' + string);
        elem.html(_this.checklogs.join('<br/>'));
        elem[0].scrollTop = 100000;
        _this.ctimestamp = now;
    },
    price:function(string){
        var elem = $('#pricelog_cont');
        var _this = this;
        var date = new Date();
        var now = date.getTime();
        if(_this.pricelogs.length > 100){
            _this.pricelogs.splice(0,1);
        }
        _this.pricelogs.push('[' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '.' + date.getMilliseconds() + '][' + (now - _this.ptimestamp) + ']' + string);
        elem.html(_this.pricelogs.join('<br/>'));
        elem[0].scrollTop = 100000;
        _this.ptimestamp = now;
        this.check(string);
    }
};

var LayoutBuilder = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            var configCont = $('<div id="config_cont" data-elem-type="cont"/>');
            var css = {
                width:'200px',
                height:'200px',
                position:'fixed',
                bottom:'0',
                right:'0',
                border:'1px solid #eeeeee',
                padding:'10px',
                background:'white',
                opacity:'0.3',
                textAlign:'left',
                zIndex:'9999'
            };
            configCont.css(css);
            var logCont = $('<div id="log_cont" data-elem-type="cont"/>');
            logCont.css($.extend(css,{
                width:'400px',
                height:'150px',
                left:'0',
                whiteSpace:'nowrap',
                overflow:'hidden',
                overflowY:'auto'
            }));
            var pricelogCont = $('<div id="pricelog_cont" data-elem-type="cont"/>');
            pricelogCont.css($.extend(css,{
                bottom:'190px'
            }));
            $('body').append(configCont);
            $('body').append(logCont);
            $('body').append(pricelogCont);
            var conts = $('div[data-elem-type=cont]');
            conts.mouseenter(function(e){
                conts.css('opacity','0.8');
            });
            conts.mouseleave(function(e){
                conts.css('opacity','0.3');
            });
            callback(null,{configCont:configCont});
        },
        _describeData:function(){
            return {
                output:{
                    configCont:{
                        type:'object'
                    }
                }
            };
        }
    }
});

var ConfigDrawer = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            var cont = data.configCont;

            var startTime = $('<div><input id="start_time" style=/></div>');
            cont.append(startTime);
            startTime = startTime.find('input');
            startTime.attr('placeholder','user start time');

            var startPrice = $('<div><input id="start_price"/></div>');
            cont.append(startPrice);
            startPrice = startPrice.find('input');
            startPrice.attr('placeholder','Start when..');

            var isTrue = $('<div>真实出价<input id="is_true" type="checkbox" /></div>');
            cont.append(isTrue);

            var isAutoLogin = $('<div>自动登录<input id="is_autologin" type="checkbox" /></div>');
            cont.append(isAutoLogin);

            var status = $('<div id="status"/>');
            cont.append(status);
            callback(null,{isTrue:isTrue,isAutoLogin:isAutoLogin,startTime:startTime,status:status,startPrice:startPrice});
        },
        _describeData:function(){
            return {
                input:{
                    configCont:{
                        type:'object'
                    }
                },
                output:{
                    isTrue:{
                        type:'object'
                    },
                    isAutoLogin:{type:'object'},
                    startTime:{
                        type:'object'
                    },
                    startPrice:{type:'object'},
                    status:{
                        type:'object'
                    }
                }
            };
        }
    }
});

var GetInfo = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            try{
                var pid = $('#ProductId').val() || $('.ni_tbtn')[0].outerHTML.match(/M.bid\((\d+)\)/)[1];
            }catch(e){
                var pid = ($('.dirbuy')[0] || $('.disbuy')[0]).href.match(/\d+$/)[0];
            }
            var user = $('a[href="http://user.5pai.com/"]').html();
            callback(null,{pid:pid,user:user});
        },
        _describeData:function(){
            return {
                output:{
                    pid:{type:'string'},
                    user:{type:'string',empty:true}
                }
            };
        }
    }
});

var DetailViewer = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            var priceElem = $($('.n_m')[0] || $('.ni_tbold1')[0]);
            priceElem.click(function(){
                window.open('http://dev.guanyu.us:8477/daemon/info?pid=' + data.pid);
            });
            callback();
        },
        _describeData:function(){
            return {
                input:{
                    pid:{type:'string'}
                }
            };
        }
    }
});

var Check = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            var d1 = Date.now();
            var _this = this;
            var requests = {};
            var retry = 0;
            Logger.check('开始查询(' + d1 + ')');
            var send = function(rid){
                requests[rid] = {
                    timer:0,
                    timeout:false
                };
                Logger.check('开始查询产品信息:' + retry + '(' + rid + ')');
                $.ajax({
                    url:'http://bid.5pai.com/pull/i1',
                    data:{
                        id:data.pid,
                        x:'0'
                    },
                    type:'get',
                    dataType:'html',
                    cache:false,
                    success:function(s){
                        clearTimeout(requests[rid].timer);
                        if(callback){
                            d2 = Date.now();
                            delay = d2 - d1;
                            var arr = s.match(/^P.*?a:([\d\.]+).*?c:'(.*?)'.*?e:(\d+).*?SS:(\d+)$/);
                            if(arr){
                                var currPrice = parseFloat(arr[1]);
                                var currUser = decodeURIComponent(arr[2]);
                                var countdown = parseInt(arr[3]);
                                Logger.check(delay + ' | ' + currUser + ' | <span style="color:red;">' + countdown + '</span>(' + rid + ')');
                                callback(null,{isOk:true,isEnd:false,delay:delay,currPrice:currPrice,currUser:currUser,countdown:countdown});
                            }
                            else{
                                callback(null,{isOk:true,isEnd:true,delay:delay});
                            }
                            callback = null;
                        }
                    }
                });
                requests[rid].timer = setTimeout(function(){
                    retry++;
                    if(retry > 3){
                        if(callback){
                            //超时失败超过次数后，走失败流程
                            Logger.price('超时重试次数超限(' + d1 + ')');
                            callback(null,{isOk:false});
                            callback = null;
                        }
                        return;
                    }
                    requests[rid].timeout = true;
                    send(Date.now());
                },150);
            };
            var rid = Date.now();
            send(rid);
        },
        _describeData:function(){
            return {
                input:{
                    pid:{type:'string'},
                    timeout:{type:'number'}
                },
                output:{
                    isOk:{type:'boolean'},
                    isEnd:{type:'boolean',empty:true},
                    currPrice:{type:'number',empty:true},
                    currUser:{type:'string',empty:true},
                    countdown:{type:'number',empty:true},
                    delay:{type:'number',empty:true}
                }
            };
        }
    }
});

var OverrunLog = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            Logger.check('出价次数超出限制!');
            callback();
        }
    }
});

var EndLog = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            Logger.check('End!');
            callback();
        }
    }
});

var ErrorLog = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            Logger.check('检查产品状态超时!');
            callback();
        }
    }
});

var Delay = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            var minus = 2000;
            if(data.countdown > 20000){
                minus = data.countdown - 20000;
            }
            if(document.webkitVisibilityState == 'hidden'){
                minus += 2000;
            }
            setTimeout(callback,data.countdown - data.delay - data.priceTime - minus);
        },
        _describeData:function(){
            return {
                input:{
                    delay:{type:'number'},
                    countdown:{type:'number'},
                    priceTime:{type:'number'}
                }
            };
        }
    }
});

var Config = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            callback(null,{
                timeout:300,
                priceTime:0,
                pricePrice:'0',
                realPrice:false,
                autoLogin:false
            });
        },
        _describeData:function(){
            return {
                output:{
                    timeout:{type:'number'},
                    priceTime:{type:'number'},
                    realPrice:{type:'boolean'},
                    pricePrice:{type:'string'}
                }
            };
        }
    }
});

var CheckResult = Flowjs.Class({
    extend:Flowjs.Condition,
    construct:function(options){
        this.callsuper(options);
        this._endTimes = 0;
    },
    methods:{
        _process:function(data,callback){
            if(data.isOk){
                if(data.isEnd){
                    this._endTimes++;
                    if(this._endTimes > 25){
                        this._select('end');
                    }
                    else{
                        Logger.price('检查是否真的结束了(' + this._endTimes + ')');
                        this._select('retry');
                    }
                }
                else{
                    this._endTimes = 0;
                    this._default();
                }
            }
            else{
                this._select('error');
            }
        },
        _describeData:function(){
            return {
                input:{
                    isOk:{type:'boolean'},
                    isEnd:{type:'boolean',empty:true}
                }
            };
        }
    }
});

var IsPrice = Flowjs.Class({
    extend:Flowjs.Condition,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            if(data.currUser == data.user){
                Logger.check('已经是当前出价人。');
                this._default();
            }
            else{
                var userNumMap = {
                    '0':600,
                    '1':1200,
                    '2':600,
                    '3':600
                };
                var startTime = data.priceTime || userNumMap[data.userNum];
                if(document.webkitVisibilityState == 'hidden'){
                    startTime += 1000;
                }
                Logger.check('出价条件：' + startTime + '(' + data.userNum + ')');
                var realCountdown = data.countdown - data.delay;
                var diffBuyPriceElem = $('.diffbuypriceid');
                //免费米
                var winPayElem = $('#__tprice');
                var limitPriceElem = $('.ni_pprice');
                var winPay,limitPrice;
                if(winPayElem.length > 0){
                    winPay = parseFloat(winPayElem.html().match(/\u00a5([.\d]+)$/)[1]);
                }
                if(limitPriceElem.length > 0){
                    limitPrice = parseFloat(limitPriceElem.html().match(/\u00a5([.\d]+)$/)[1]);
                }
                var startPrice = data.startPrice[0].value;
                if(data.currPrice < startPrice){
                    Logger.check('未达到最低出价价格');
                    this._default();
                }
                else if(diffBuyPriceElem.length > 0 && diffBuyPriceElem.html().match(/\u00a5([.\d]+)$/)[1] < data.currPrice){
                    this._select('出价次数超限');
                }
                else if(winPay && limitPrice && winPay.length > 0 && winPay > limitPrice){
                    this._select('出价次数超限');
                }
                else if(realCountdown <= startTime){
                    this._select('达到出价条件');
                }
                else if(data.countdown <= 2000){
                    this._select('进入危险区间，立即重新检查');
                }
                else{
                    this._default();
                }
            }
        },
        _describeData:function(){
            return {
                input:{
                    currPrice:{type:'number'},
                    priceTime:{type:'number'},
                    countdown:{type:'number'},
                    userNum:{type:'number'},
                    delay:{type:'number'},
                    currUser:{type:'string'},
                    user:{type:'string',empty:true},
                    startPrice:{type:'object'}
                }
            };
        }
    }
});

var IsStopHelper = Flowjs.Class({
    extend:Flowjs.Condition,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            if(!data.realPrice){
                this._select('虚拟出价，无需取消出价器');
            }
            else if(data.isOk){
                if(data.isEnd){
                    Logger.check('竞拍结束。。');
                    this._select('取消自动出价器');
                }
                else if(data.currUser == data.user){
                    Logger.check('自动出价器出价成功');
                    this._select('取消自动出价器');
                }
                else if(data.countdown > 5000){
                    Logger.check('本次出价器没有出价');
                    this._select('取消自动出价器');
                }
                else{
                    this._default();
                }
            }
            else{
                this._default();
            }
        },
        _describeData:function(){
            return {
                input:{
                    isOk:{type:'boolean'},
                    isEnd:{type:'boolean'},
                    countdown:{type:'number'},
                    currUser:{type:'string'},
                    user:{type:'string',empty:true},
                    realPrice:{type:'boolean'}
                }
            };
        }
    }
});

var Price = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
        this._times = 0;
    },
    methods:{
        _process:function(data,callback){
            if(!data.user){
                callback();
                return;
            }
            var _this = this;
            _this._times++;
            if(data.realPrice){
                var requests = {};
                var send = function(rid){
                    Logger.check('[' + _this._times + ']开始出价(' + rid + ')');
                    requests[rid] = {
                        timer:0,
                        timeout:false
                    };
                    $.ajax({
                        url: 'http://c.5pai.com/BidAction.aspx',
                        data: { "id": data.pid },
                        type: "get",
                        dataType: "html",
                        cache: false,
                        success:function(s){
                            clearTimeout(requests[rid].timer);
                            if(callback){
                                if(s == '{Code:0,Detail:\'商品已结束拍卖\'}'){
                                    Logger.check('已结束。(' + rid + ')');
                                }
                                else if(s == '{Code:1,Detail:\'点拍成功\'}' || s == '{Code:0,Detail:\'您暂时不用再次出价：您是当前出价人。\'}'){
                                    Logger.check('[' + _this._times + ']出价成功(' + rid + ')');
                                }
                                else{
                                    Logger.check('[' + _this._times + ']出价失败：' + s + '(' + rid + ')');
                                }
                                if(!requests[rid].timeout){
                                    callback();
                                    callback = null;
                                }
                            }
                        }
                    });
                    requests[rid].timer = setTimeout(function(){
                        requests[rid].timeout = true;
                        Logger.check('[' + _this._times + ']出价超时(' + rid + ')');
                        send(Date.now());
                    },data.timeout);
                };
                var rid = Date.now();
                send(rid);
            }
            else{
                Logger.check('[' + _this._times + ']模拟出价。');
                callback();
            }
        },
        _describeData:function(){
            return {
                input:{
                    pid:{type:'string'},
                    timeout:{type:'number'},
                    realPrice:{type:'boolean'},
                    user:{type:'string',empty:true}
                }
            };
        }
    }
});

var StartHelper = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            if(!data.user){
                callback();
                return;
            }
            var _this = this;
            var pkey = 'p' + data.pid;
            if(!this.hasOwnProperty('_times')){
                var savedTimes = localStorage.getItem(pkey);
                if(savedTimes){
                    this._times = parseInt(savedTimes);
                }
                else{
                    this._times = 0;
                }
            }
            _this._times++;
            localStorage.setItem(pkey,this._times);
            if(data.realPrice){
                var requests = {};
                var send = function(rid){
                    Logger.check('[' + _this._times + ']启动自动出价器(' + rid + ')');
                    requests[rid] = {
                        timer:0,
                        timeout:false
                    };
                    $.ajax({
                        url: 'http://c.5pai.com/HelperAction.aspx',
                        data: {
                            operation:'add',
                            start_reason:'1',
                            price_value:'0.00',
                            method:'1',
                            clicks:'1',
                            ProductId:data.pid
                        },
                        type: "get",
                        dataType: "html",
                        cache: false,
                        success:function(s){
                            if(!requests[rid].timeout){
                                Logger.check('[' + _this._times + ']启动自动出价器成功(' + rid + ')');
                                clearTimeout(requests[rid].timer);
                                callback();
                            }
                        }
                    });
                    requests[rid].timer = setTimeout(function(){
                        requests[rid].timeout = true;
                        Logger.check('[' + _this._times + ']启动自动出价器超时(' + rid + ')');
                        send(Date.now());
                    },data.timeout);
                };
                var rid = Date.now();
                send(rid);
            }
            else{
                Logger.check('[' + _this._times + ']模拟出价。');
                callback();
            }
        },
        _describeData:function(){
            return {
                input:{
                    pid:{type:'string'},
                    timeout:{type:'number'},
                    realPrice:{type:'boolean'},
                    user:{type:'string',empty:true}
                }
            };
        }
    }
});

var StopHelper = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            var _this = this;
            var requests = {};
            var send = function(rid){
                Logger.check('取消自动出价器(' + rid + ')');
                requests[rid] = {
                    timer:0,
                    timeout:false
                };
                $.ajax({
                    url: 'http://c.5pai.com/HelperAction.aspx',
                    data: {
                        operation:'delete',
                        ProductId:data.pid
                    },
                    type: "get",
                    dataType: "html",
                    cache: false,
                    success:function(s){
                        if(!requests[rid].timeout){
                            Logger.check('取消自动出价器成功(' + rid + ')');
                            clearTimeout(requests[rid].timer);
                            callback();
                        }
                    }
                });
                requests[rid].timer = setTimeout(function(){
                    requests[rid].timeout = true;
                    Logger.check('取消自动出价器超时(' + rid + ')');
                    send(Date.now());
                },data.timeout);
            };
            var rid = Date.now();
            send(rid);
        },
        _describeData:function(){
            return {
                input:{
                    pid:{type:'string'},
                    timeout:{type:'number'}
                }
            };
        }
    }
});

var GetUserNum = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            var history = $('[ac=__history]');
            var users = $('#BidRightDiv .noreturn');
            var userNames = [];
            var userMap = {};
            if(users){
                users.each(function(i,userName){
                    userName = userName.innerHTML;
                    if(userName == data.user){
                        return;
                    }
                    if(!userMap.hasOwnProperty(userName)){
                        userMap[userName] = 0;
                    }
                    userMap[userName]++;
                    if(userMap[userName] > 2 && userNames.indexOf(userName) == -1){
                        userNames.push(userName)
                    }
                });
            }
            callback(null,{userNum:userNames.length});
            history.click();
        },
        _describeData:function(){
            return {
                input:{
                    user:{type:'string',empty:true}
                },
                output:{
                    userNum:{type:'number'}
                }
            };
        }
    }
});

var DisplayState = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            var html = [
                'Real price:' + data.realPrice,
                'Price time:' + data.priceTime,
                'Start price:' + data.pricePrice
            ];
            data.status.html(html.join('<br/>'))
            callback();
        },
        _describeData:function(){
            return {
                input:{
                    status:{type:'object'},
                    realPrice:{type:'boolean'},
                    priceTime:{type:'number'},
                    pricePrice:{type:'string'}
                }
            };
        }
    }
});

var UpdateConfig = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            callback(null,data);
        },
        _describeData:function(){
            return {
                input:{
                    realPrice:{type:'boolean',empty:true},
                    priceTime:{type:'number',empty:true},
                    pricePrice:{type:'string',empty:true},
                    autoLogin:{type:'boolean',empty:true}
                },
                output:{
                    realPrice:{type:'boolean'},
                    priceTime:{type:'number'},
                    pricePrice:{type:'string'},
                    autoLogin:{type:'boolean'}
                }
            };
        }
    }
});

var BindConfigEvent = Flowjs.Class({
    extend:Flowjs.Input,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            var _this = this;
            this._wait(function(){
                data.isTrue.on("click",function(e){
                    var target = e.target;
                    _this._inputs['切换出价状态'].call(_this,{
                        realPrice:target.checked
                    });
                });
                data.isAutoLogin.on("click",function(e){
                    var target = e.target;
                    _this._inputs['切换自动登录状态'].call(_this,{
                        autoLogin:target.checked
                    });
                });
                data.startTime.on("blur",function(e){
                    var target = e.target;
                    var value = parseInt(target.value || 0);
                    if(!isNaN(value)){
                        _this._inputs['修改出价时间'].call(_this,{
                            priceTime:value
                        });
                    }
                });
                data.startPrice.on("blur",function(e){
                    var target = e.target;
                    var value = target.value || '0';
                    if(!isNaN(value)){
                        _this._inputs['修改出价价格'].call(_this,{
                            pricePrice:value
                        });
                    }
                });
            });
            callback();
        },
        _describeData:function(){
            return {
                input:{
                    isTrue:{type:'object'},
                    startTime:{type:'object'},
                    startPrice:{type:'object'},
                    isAutoLogin:{type:'object'}
                }
            };
        }
    }
});

var AutoLogin = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
    },
    statics:{
        _timer:0
    },
    methods:{
        _process:function(data,callback){
            var _this = this;
            if(AutoLogin._timer){
                clearTimeout(AutoLogin._timer);
            }
            var autoLogin = function(){
                var t = Date.now();
                $.ajax({
                    url: 'http://www.5pai.com/Part_Default/TopUserAccount.aspx',
                    data: {},
                    type: "get",
                    dataType: "html",
                    cache: false,
                    success:function(s){
                        if(s == ''){
                            Logger.check('检查登录情况:未登录');
                            if(data.autoLogin){
                                if(!_this._t || (t - _this._t > 10000)){
                                    _this._t = t;
                                    Logger.price('尝试自动登录');
                                    window.open('http://user.5pai.com/qq/Default.aspx?__redirect=http://www.5pai.com');
                                }
                            }
                        }
                        else{
                            Logger.check('检查登录情况:已登录');
                        }
                    }
                });
                AutoLogin._timer = setTimeout(autoLogin,5000);
            };
            autoLogin();
            callback();
        },
        _describeData:function(){
            return {
                input:{
                    autoLogin:{type:'boolean',empty:true}
                }
            };
        }
    }
});

var Flow = Flowjs.Class({
    extend:Flowjs.Flow,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        //初始化流程
        start:function(){
            var _this = this;
            var steps = this._steps();
            this._addStep('初始化插件布局',new steps.LayoutBuilder());
            this._addStep('初始化配置模块外观',new steps.ConfigDrawer());
            this._addStep('获取网站信息',new steps.GetInfo());
            this._addStep('初始化详细信息查看器',new steps.DetailViewer());
            this._addStep('检查产品当前状态',new steps.Check());
            this._addStep('为自动出价器查询产品当前状态',new steps.Check());
            this._addStep('延时启动下一次Check',new steps.Delay());
            this._addStep('打印检查产品信息失败日志',new steps.ErrorLog());
            this._addStep('打印拍卖结束日志',new steps.EndLog());
            this._addStep('初始化配置信息',new steps.Config());
            this._addStep('出价',new steps.Price());
            this._addStep('启动自动出价器',new steps.StartHelper());
            this._addStep('获取当前活跃参与用户数',new steps.GetUserNum());
            this._addStep('根据用户输入更新配置',new steps.UpdateConfig());
            this._addStep('显示初始配置信息',new steps.DisplayState());
            this._addStep('显示更新配置信息',new steps.DisplayState());
            this._addStep('打印出价超限日志',new steps.OverrunLog());
            this._addStep('取消自动出价器',new steps.StopHelper());
            this._addStep('绑定用户更新配置的事件',new steps.BindConfigEvent());
            this._addStep('检查是否需要出价',new steps.IsPrice());
            this._addStep('检查结果',new steps.CheckResult());
            this._addStep('检查是否需要取消自动出价器',new steps.IsStopHelper());
            this._addStep('启动自动登录',new steps.AutoLogin());
            this._addStep('立即执行自动登录',new steps.AutoLogin());
            
            this.go('初始化插件布局');
            this.go('初始化配置模块外观');
            this.go('初始化配置信息');
            this.go('显示初始配置信息');
            this.go('绑定用户更新配置的事件',null,{
                inputs:{
                    '切换出价状态':function(data){
                        _this.go('根据用户输入更新配置',data);
                        _this.go('显示更新配置信息');
                    },
                    '切换自动登录状态':function(data){
                        _this.go('根据用户输入更新配置',data);
                        _this.go('显示更新配置信息');
                        _this.go('立即执行自动登录');
                    },
                    '修改出价时间':function(data){
                        _this.go('根据用户输入更新配置',data);
                        _this.go('显示更新配置信息');
                    },
                    '修改出价价格':function(data){
                        _this.go('根据用户输入更新配置',data);
                        _this.go('显示更新配置信息');
                    }
                }
            });
            this.go('启动自动登录');
            this.go('获取网站信息');
            this.go('初始化详细信息查看器');
            this.go('检查产品当前状态');
            this.go('获取当前活跃参与用户数');
            this.go('检查结果',null,{
                cases:{
                    end:function(){
                        _this.go('打印拍卖结束日志');
                    },
                    retry:function(){
                        _this.go('出价');
                        _this.go('检查产品当前状态');
                    },
                    error:function(){
                        //查询出错后立即启动出价器
                        // _this.go('启动自动出价器');
                        // _this.go('为自动出价器查询产品当前状态');
                        // _this.go('检查是否需要取消自动出价器',null,{
                        //     cases:{
                        //         '取消自动出价器':function(){
                        //             _this.go('取消自动出价器');
                        //             _this.go('检查产品当前状态');
                        //         },
                        //         '虚拟出价，无需取消出价器':function(){
                        //             _this.go('检查产品当前状态');
                        //         }
                        //     },
                        //     defaultCase:function(){
                        //         _this.go('为自动出价器查询产品当前状态');
                        //     }
                        // });
                        // _this.go('打印检查产品信息失败日志');
                        // //失败时，30秒后重试
                        // setTimeout(function(){
                        //     _this.go('检查产品当前状态');
                        // },30000);
                        _this.go('出价');
                        _this.go('检查产品当前状态');
                    }
                },
                defaultCase:function(){
                    _this.go('检查是否需要出价',null,{
                        cases:{
                            '出价次数超限':function(){
                                _this.go('打印出价超限日志');
                            },
                            "达到出价条件":function(){
                                // _this.go('启动自动出价器');
                                // _this.go('为自动出价器查询产品当前状态');
                                // _this.go('检查是否需要取消自动出价器',null,{
                                //     cases:{
                                //         '取消自动出价器':function(){
                                //             _this.go('取消自动出价器');
                                //             _this.go('检查产品当前状态');
                                //         },
                                //         '虚拟出价，无需取消出价器':function(){
                                //             _this.go('检查产品当前状态');
                                //         }
                                //     },
                                //     defaultCase:function(){
                                //         _this.go('为自动出价器查询产品当前状态');
                                //     }
                                // });
                                _this.go('出价');
                                _this.go('检查产品当前状态');
                            },
                            "进入危险区间，立即重新检查":function(){
                                _this.go('检查产品当前状态');
                            }
                        },defaultCase:function(){
                            _this.go('延时启动下一次Check');
                            _this.go('检查产品当前状态');
                        }
                    });
                }
            });
        }
    }
});

var flow = new Flow({
    steps:{
        LayoutBuilder:LayoutBuilder,
        ConfigDrawer:ConfigDrawer,
        DetailViewer:DetailViewer,
        GetInfo:GetInfo,
        Check:Check,
        Delay:Delay,
        CheckResult:CheckResult,
        EndLog:EndLog,
        ErrorLog:ErrorLog,
        Config:Config,
        Price:Price,
        IsPrice:IsPrice,
        GetUserNum:GetUserNum,
        UpdateConfig:UpdateConfig,
        BindConfigEvent:BindConfigEvent,
        DisplayState:DisplayState,
        OverrunLog:OverrunLog,
        IsStopHelper:IsStopHelper,
        StartHelper:StartHelper,
        StopHelper:StopHelper,
        AutoLogin:AutoLogin
    }
});

flow.start();