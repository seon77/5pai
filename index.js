var Logger = {
    ctimestamp:Date.now(),
    ptimestamp:Date.now(),
    check:function(elem,string){
        var _this = this;
        var now = Date.now();
        elem.html(function(index,oldhtml){
            return oldhtml + '<br/>[' + (now - _this.ctimestamp) + ']' + string;
        });
        elem[0].scrollTop = 100000;
        this.ctimestamp = now;
    },
    price:function(elem,string){
        var _this = this;
        var now = Date.now();
        elem.html(function(index,oldhtml){
            return oldhtml + '<br/>[' + (now - _this.ptimestamp) + ']' + string;
        });
        elem[0].scrollTop = 100000;
        this.ptimestamp = now;
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
                $(e.target).css('opacity','0.8');
            });
            conts.mouseleave(function(e){
                $(e.target).css('opacity','0.3');
            });
            callback(null,{configCont:configCont,logCont:logCont,pricelogCont:pricelogCont});
        },
        _describeData:function(){
            return {
                output:{
                    configCont:{
                        type:'object'
                    },
                    logCont:{
                        type:'object'
                    },
                    pricelogCont:{
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

            var startTime = $('<input id="start_time"/>');
            cont.append(startTime);
            startTime.attr('placeholder','user start time');

            var isTrue = $('<input id="is_true" type="checkbox" />');
            isTrue.css('margin-left','20px');
            cont.append(isTrue);
            var status = $('<div id="status"/>');
            cont.append(status);
            callback(null,{isTrue:isTrue,startTime:startTime,status:status});
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
                    startTime:{
                        type:'object'
                    },
                    status:{
                        type:'object'
                    }
                }
            };
        }
    }
});

var LogDrawer = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            var cont = data.logCont;
            callback();
        },
        _describeData:function(){
            return {
                input:{
                    logCont:{
                        type:'object'
                    }
                }
            };
        }
    }
});

var PricelogDrawer = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            var cont = data.pricelogCont;
            callback();
        },
        _describeData:function(){
            return {
                input:{
                    pricelogCont:{
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
                    user:{type:'string'}
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
            data.priceElem.click(function(){
                window.open('http://dev.guanyu.us:8477/daemon/info?pid=' + data.pid);
            });
            callback();
        },
        _describeData:function(){
            return {
                input:{
                    pid:{type:'string'},
                    priceElem:{type:'object'}
                }
            };
        }
    }
});

var GetProductDoms = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            callback(null,{
                priceElem:$($('.n_m')[0] || $('.ni_tbold1')[0]),
                history:$('[ac=__history]')
            });
        },
        _describeData:function(){
            return {
                output:{
                    priceElem:{type:'object'},
                    history:{type:'object'}
                }
            };
        }
    }
});

var Check = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
        this._queryRetry = 0;
    },
    methods:{
        _process:function(data,callback){
            var d1 = Date.now();
            var _this = this;
            $.ajax({
                url:'http://bid.5pai.com/pull/i1',
                data:{
                    id:data.pid,
                    x:'0'
                },
                type:'get',
                dataType:'html',
                cache:false,
                timeout:300,
                error:function(){
                    callback(null,{isOk:false});
                },
                success:function(s){
                    d2 = Date.now();
                    delay = d2 - d1;
                    var data = s.match(/^P.*?a:([\d\.]+).*?c:'(.*?)'.*?e:(\d+).*?SS:(\d+)$/);
                    if(data){
                        var currPrice = parseFloat(data[1]);
                        var currUser = decodeURIComponent(data[2]);
                        var countdown = parseInt(data[3]);
                        callback(null,{isOk:true,isEnd:false,delay:delay,currPrice:currPrice,currUser:currUser,countdown:countdown});
                    }
                    else{
                        callback(null,{isOk:true,isEnd:true,delay:delay});
                    }
                }
            });
        },
        _describeData:function(){
            return {
                input:{
                    pid:{type:'string'}
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

var CheckLog = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            Logger.check(data.logCont,data.delay + ' | ' + data.currUser + ' | ' + data.countdown);
            callback();
        },
        _describeData:function(){
            return {
                input:{
                    logCont:{type:'object'},
                    currUser:{type:'string',empty:true},
                    countdown:{type:'number',empty:true},
                    delay:{type:'number',empty:true}
                }
            };
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
            Logger.check(data.logCont,'End!');
            callback();
        },
        _describeData:function(){
            return {
                input:{
                    logCont:{type:'object'}
                }
            };
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
            Logger.check(data.logCont,'Error!');
            callback();
        },
        _describeData:function(){
            return {
                input:{
                    logCont:{type:'object'}
                }
            };
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
            setTimeout(callback,data.countdown - data.delay - 2000);
        },
        _describeData:function(){
            return {
                input:{
                    delay:{type:'number'},
                    countdown:{type:'number'}
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
                timeout:200,
                priceTime:0,
                realPrice:false
            });
        },
        _describeData:function(){
            return {
                output:{
                    timeout:{type:'number'},
                    priceTime:{type:'number'},
                    realPrice:{type:'boolean'}
                }
            };
        }
    }
});

var CheckResult = Flowjs.Class({
    extend:Flowjs.Condition,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            if(data.isOk){
                if(data.isEnd){
                    this._select('end');
                }
                else{
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
                Logger.check(data.logCont,'已经是当前出价人。');
                this._default();
            }
            else{
                var userNumMap = {
                    '1':1500,
                    '2':1000,
                    '3':1000
                };
                var startTime = data.priceTime || userNumMap[data.userNum || '1'];
                Logger.check(data.logCont,'出价条件：' + startTime + '(' + data.userNum + ')');
                var realCountdown = data.countdown - data.delay;
                if(realCountdown <= startTime){
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
                    priceTime:{type:'number'},
                    countdown:{type:'number'},
                    userNum:{type:'number'},
                    delay:{type:'number'},
                    logCont:{type:'object'},
                    currUser:{type:'string'},
                    user:{type:'string'}
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
        this._timer = 0;
    },
    methods:{
        _process:function(data,callback){
            this._times++;
            var _this = this;
            if(data.realPrice){
                var requests = {};
                var send = function(rid){
                    Logger.check(data.logCont,'[' + _this._times + ']开始出价(' + rid + ')');
                    requests[rid] = false;
                    $.ajax({
                        url: 'http://c.5pai.com/BidAction.aspx',
                        data: { "id": data.pid },
                        type: "get",
                        dataType: "html",
                        cache: false,
                        success:function(s){
                            if(s == '{Code:0,Detail:\'商品已结束拍卖\'}'){
                                Logger.check(data.logCont,'已结束。');
                            }
                            else if(s == '{Code:1,Detail:\'点拍成功\'}' || s == '{Code:0,Detail:\'您暂时不用再次出价：您是当前出价人。\'}'){
                                Logger.check(data.logCont,'[' + _this._times + ']出价成功(' + rid + ')');
                            }
                            else{
                                Logger.price(data.pricelogCont,'[' + _this._times + ']出价失败：' + s + '(' + rid + ')');
                            }
                            if(!requests[rid]){
                                clearTimeout(_this._timer);
                                callback();
                            }
                        }
                    });
                    _this._timer = setTimeout(function(){
                        requests[rid] = true;
                        Logger.check(data.logCont,'[' + _this._times + ']出价超时(' + rid + ')');
                        send(Date.now());
                    },data.timeout);
                };
                var rid = Date.now();
                send(rid);
            }
            else{
                Logger.check(data.logCont,'[' + _this._times + ']模拟出价。');
            }
        },
        _describeData:function(){
            return {
                input:{
                    logCont:{type:'object'},
                    pricelogCont:{type:'object'},
                    pid:{type:'string'},
                    timeout:{type:'number'},
                    realPrice:{type:'boolean'}
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
            data.history.click();
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
        },
        _describeData:function(){
            return {
                input:{
                    user:{type:'string'},
                    history:{type:'object'}
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
                'Price time:' + data.priceTime
            ];
            data.status.html(html.join('<br/>'))
            callback();
        },
        _describeData:function(){
            return {
                input:{
                    status:{type:'object'},
                    realPrice:{type:'boolean'},
                    priceTime:{type:'number'}
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
            var html = [
                'Real price:' + data.realPrice,
                'Price time:' + data.priceTime
            ];
            data.status.html(html.join('<br/>'));
            callback(null,{realPrice:data.realPrice,priceTime:data.priceTime});
        },
        _describeData:function(){
            return {
                input:{
                    status:{type:'object'},
                    realPrice:{type:'boolean'},
                    priceTime:{type:'number'}
                },
                output:{
                    realPrice:{type:'boolean'},
                    priceTime:{type:'number'}
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
                data.startTime.on("blur",function(e){
                    var target = e.target;
                    var value = parseInt(target.value || 0);
                    if(!isNaN(value)){
                        _this._inputs['修改出价时间'].call(_this,{
                            priceTime:value
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
                    startTime:{type:'object'}
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
            var steps = this.steps();
            var layoutBuilder = new steps.LayoutBuilder({description:'Build layout.'});
            var configDrawer = new steps.ConfigDrawer({description:'Draw config face.'});
            var logDrawer = new steps.LogDrawer({description:'Draw log face.'});
            var pricelogDrawer = new steps.PricelogDrawer({description:'Draw price log face.'});
            var getInfo = new steps.GetInfo({description:'Get product info.'});
            var detailViewer = new steps.DetailViewer({description:'Open detail viewer.'});
            var getProductDoms = new steps.GetProductDoms({description:'Get product doms.'});
            var check = new steps.Check({description:'Check.'});
            var checkLog = new steps.CheckLog({description:'Log check data.'});
            var delay = new steps.Delay({description:'Delay.'});
            var errorLog = new steps.ErrorLog({description:'Error.'});
            var endLog = new steps.EndLog({description:'End.'});
            var config = new steps.Config({description:'Config.'});
            var price = new steps.Price({description:'Price!'});
            var getUserNum = new steps.GetUserNum({description:'a'});
            var updateConfig = new steps.UpdateConfig({description:'b'});
            var displayState = new steps.DisplayState({description:'c'});
            var bindConfigEvent = new steps.BindConfigEvent({description:'d',inputs:{
                '切换出价状态':function(data){
                    _this.go(updateConfig,data);
                },
                '修改出价时间':function(data){
                    _this.go(updateConfig,data);
                }
            }});
            var isPrice = new steps.IsPrice({description:'Is price',cases:{
                "达到出价条件":function(){
                    _this.go(price);
                    _this.go(check);
                },
                "进入危险区间，立即重新检查":function(){
                    _this.go(check);
                }
            },defaultCase:function(){
                _this.go(delay);
                _this.go(check);
            }});
            var checkResult = new steps.CheckResult({description:'Check result.',cases:{
                end:function(){
                    _this.go(endLog);
                },
                error:function(){
                    _this.go(errorLog);
                    _this.go(check);
                }
            },defaultCase:function(){
                _this.go(checkLog);
                _this.go(isPrice);
            }});
            this.go(layoutBuilder);
            this.go(configDrawer);
            this.go(logDrawer);
            this.go(pricelogDrawer);
            this.go(config);
            this.go(displayState);
            this.go(bindConfigEvent);
            this.go(getInfo);
            this.go(getProductDoms);
            this.go(detailViewer);
            this.go(check);
            this.go(getUserNum);
            this.go(checkResult);
        }
    }
});

var flow = new Flow({
    steps:{
        LayoutBuilder:LayoutBuilder,
        ConfigDrawer:ConfigDrawer,
        LogDrawer:LogDrawer,
        PricelogDrawer:PricelogDrawer,
        DetailViewer:DetailViewer,
        GetInfo:GetInfo,
        GetProductDoms:GetProductDoms,
        Check:Check,
        CheckLog:CheckLog,
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
        DisplayState:DisplayState
    }
});

flow.start();