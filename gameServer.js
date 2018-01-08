var http = require('http')
var url = require('url')
var fs = require('fs')

const concat = require('concat-stream');
var path = require('path')
var baseDirectory = __dirname   // or whatever base directory you want


process.on('uncaughtException',function(e){
  console.log('got uncaught exception:'+e);
});

//periodic pings in log
/*setInterval(function(){
  console.log("\n"+'['+new Date().getTime()+']alive');
  const used = process.memoryUsage();
  for (let key in used) {
    console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
  }
},20);*/

var jsdom = require('jsdom');
const dom = new jsdom.JSDOM('<!DOCTYPE html>');
global.$ = require("jquery")(dom.window);

//Set the transport of jquery to let it make requests
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
$.support.cors = true;
$.ajaxSettings.xhr = function() {
  return new XMLHttpRequest();
};



global.window = null; //required to be able to make (window || global)

var instance_id = process.argv[2];
var port = process.argv[3];
var name = process.argv[4];
var control_url = process.argv[5]; //token used to communicate
var instance_token = process.argv[6];
var process_id = process.pid;

$.ajaxSetup({
    headers: { 'x-instance-token': instance_token },
    beforeSend: function(xhr) {
      //console.log('setting token when sending');
      if(instance_token){
        xhr.setRequestHeader('x-instance-token', instance_token);
      }
    }
});

console.log('server use: node gameServer [instance_id] [port] [gamename without .js]');
//console.log('starting '+name+' with instance_id:'+instance_id+' on port:'+port+' having token:'+instance_token);

//var uno = require('./www/js/uno.js');
var g = require('./server/games/'+name+'.js');
require('./www/js/gameengine.js');

var gameServer = new GameServer(g.game,instance_id ,port,control_url, process_id);
//ScopeRef._chatty = true;
gameServer.start();
