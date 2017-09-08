var http = require('http')
var url = require('url')
var fs = require('fs')
const concat = require('concat-stream');
var path = require('path')
var baseDirectory = __dirname   // or whatever base directory you want

var jsdom = require('jsdom');
const dom = new jsdom.JSDOM(`<!DOCTYPE html>`);
global.$ = require("jquery")(dom.window);

global.window = null; //required to be able to make (window || global)

var uno = require('./www/js/uno.js');
require('./www/js/gameengine.js');

var gameServer = new GameServer(uno.game,new Date().getTime() /*game_id*/);

gameServer.start();
