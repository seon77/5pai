var iframe = $('#ptlogin_iframe');
var win = iframe[0].contentWindow;
var doc = win.document;

setTimeout(function(){
    window.close();
},5000);

$(function(){
    var qq = doc.getElementById('u');
    var pwd = doc.getElementById('p');
    var form = doc.getElementById('loginform');
    var btn = doc.getElementById('login_button');

    qq.value = ('94248472');
    pwd.value = ('igloria77');
    pwd.focus();
    setTimeout(function(){
        btn.click();
    },1000);
});