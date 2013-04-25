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

var GetProductInfo = Flowjs.Class({
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
            callback(null,{pid:pid});
        },
        _describeData:function(){
            return {
                output:{
                    pid:{type:'string'}
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
                priceElem:$($('.n_m')[0] || $('.ni_tbold1')[0])
            });
        },
        _describeData:function(){
            return {
                output:{
                    priceElem:{type:'object'}
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
        this._interval = Date.now();
    },
    methods:{
        _process:function(data,callback){
            var _this = this;
            data.logCont.html(function(index, oldhtml){
                return oldhtml + '<br />[' + (Date.now() - _this._interval) + '] ' + data.delay + ' | ' + data.currUser + ' | ' + data.countdown;
            });
            this._interval = Date.now();
            data.logCont[0].scrollTop = 100000;
            callback();
        },
        _describeData:function(){
            return {
                input:{
                    logCont:{type:'object'},
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

var Delay = Flowjs.Class({
    extend:Flowjs.Step,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        _process:function(data,callback){
            setTimeout(callback,data.countdown - data.delay);
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

var Flow = Flowjs.Class({
    extend:Flowjs.Flow,
    construct:function(options){
        this.callsuper(options);
    },
    methods:{
        //初始化流程
        start:function(){
            var _this = this;
            var steps = this._steps;
            var layoutBuilder = new steps.LayoutBuilder({description:'Build layout.'});
            var configDrawer = new steps.ConfigDrawer({description:'Draw config face.'});
            var logDrawer = new steps.LogDrawer({description:'Draw log face.'});
            var pricelogDrawer = new steps.PricelogDrawer({description:'Draw price log face.'});
            var getProductInfo = new steps.GetProductInfo({description:'Get product info.'});
            var detailViewer = new steps.DetailViewer({description:'Open detail viewer.'});
            var getProductDoms = new steps.GetProductDoms({description:'Get product doms.'});
            var check = new steps.Check({description:'Check.'});
            var checkLog = new steps.CheckLog({description:'Log check data.'});
            var delay = new steps.Delay({description:'Delay.'});
            this.go(layoutBuilder);
            this.go(configDrawer);
            this.go(logDrawer);
            this.go(pricelogDrawer);
            this.go(getProductInfo);
            this.go(getProductDoms);
            this.go(detailViewer);
            this.go(check);
            this.go(checkLog);
            this.go(delay);
            this.go(check);
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
        GetProductInfo:GetProductInfo,
        GetProductDoms:GetProductDoms,
        Check:Check,
        CheckLog:CheckLog,
        Delay:Delay
    }
});

flow.start();