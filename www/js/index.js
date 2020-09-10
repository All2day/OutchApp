/*document.addEventListener("deviceready", function(){
  alert('got start device ready');
  window.deviceisready = true;
});
alert('device ready fired');
*/
require('js/log.js');
/*require('js/fastclick.js');*/
require('js/handlebars-setup.js');
require('js/client.js');
require('js/smoothPosUpdater2.js');


/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissio  ns and limitations
 * under the License.
 */
var app = {
    //debug settings that will take over if in debug mode
    debug: {
      server: 'https://alphagames.all2day.dk'
    },
    server: 'https://geogames.all2day.dk',//'http://52.208.48.54:9615',

    //server: 'http://alphagames.all2day.dk',
    player:null,
    config: {
      smooth_interval : 200
    },
    // Application Constructor
    initialize: function() {

      if(window.deviceisready){
        console.log('already deviceready');
        try{
          if(window.console_reinsert){
            console_reinsert();
          }
        } catch(e){
          alert('error in console reinsert:'+e.message + ' in '+e.fileName + '['+e.lineNumber+']');
        }
        try{
          app.onDeviceReady();
        } catch(e){
          alert('error in init:'+e.message + ' in '+e.fileName + '['+e.lineNumber+']');
        }
      } else
      if(navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/) && window.location.protocol == "file:") { //removed |IEMobile

        console.log('registering deviceready');
        document.addEventListener("deviceready", function(){
          console.log('Got deviceready');


          try{
            app.onDeviceReady();
          } catch(e){
            alert('error in init:'+e.message + ' in '+e.fileName + '['+e.lineNumber+']');
          }
        }, false);
        } else {
          console.log('NOT registering deviceready');
          app.onDeviceReady();
        }

    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        console.log('device ready');
        console.log('app version:',"%%VERSION%%");

        if(navigator.userAgent.match(/(iPhone|iPod|iPad)/)){
          $('body').addClass('iOS7');
        }
        if(window.device && window.device.platform == 'iOS'){
          $('body').addClass('iOS');
          if(parseFloat(window.device.version) >= 7.0) {
            $('body').addClass('iOS7');
            console.log('iOS7+ detected, adding top padding for statusbar');
          }
        }



        try{
          if(window.console_reinsert){
            console_reinsert();
          }
        } catch(e){
          alert('error in console reinsert:'+e.message + ' in '+e.fileName + '['+e.lineNumber+']');
        }

        console.log('starting GA');
        if(window.analytics){
          analytics.startTrackerWithId('UA-117828910-1',function(){console.log('GA startt')},function(err){console.log('got err from GA',err)});
        } else {
          console.log('No GA');
        }

        document.addEventListener("pause", this.onPause.bind(this), false);
        document.addEventListener("resume", this.onResume.bind(this), false);

        //special handling of query strings for browser tests
        var qs = this.qs = (function(a) {
            if (a == "") return {};
            var b = {};
            for (var i = 0; i < a.length; ++i)
            {
                var p=a[i].split('=', 2);
                if (p.length == 1)
                    b[p[0]] = "";
                else
                    b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
            }
            return b;
        })(window.location.search.substr(1).split('&'));

        $.each(qs,function(k,v){
          window[k] = v;
        });

        this._posUpdater = smoothPosUpdater;

        if(qs['test_game']){
          require('js/rawPosUpdater');
          this._posUpdater = rawPosUpdater;
        }


        if(window.cordova && cordova.plugins && cordova.plugins.IsDebug || qs['debug']){
          var useDebugSettings = function(isDebug) {
            console.log('Is debug:'+ (!!isDebug));
            if(isDebug){
              $.each(this.debug,function(key,setting){
                this[key] = setting;
              }.bind(this));
            }
            this.gameStartup();
          }.bind(this);

          if(qs['debug']){
            useDebugSettings(true);
          } else {
            cordova.plugins.IsDebug.getIsDebug(useDebugSettings, function(err) {
              console.error(err);
            });
          }
        } else {
          this.gameStartup();
        }
    }, //end of onDeviceReady
    onPause: function(){
      console.log('pausing, stopping location service');
      this.stopLocationService();
    },

    onResume: function(){
      console.log('resume, restart location service');
      this.startLocationService();
    },

    gameStartup:function(){
      if(this.qs['UUID']){
        app.fake_uuid = this.qs['UUID'];
      }
      if(!!this.qs['local']){
        console.log('setting server to local');
        this.server = 'http://geogames.localhost';
      }
      if(this.qs['server']){
        console.log('setting server to:'+this.qs['server']);
        this.server = this.qs['server'];
      }


      /*if(qs['port']){
        this.server = this.server+':'+qs['port'];
      }

      window._client = new GameClient(uno.game,qs['UUID']||'mads');

      _client.server = this.server; //'http://52.208.48.54:9615'; //'http://localhost:9615';
      _client.startPinging();

      window._client = this._client = _client;
      */
      //register volume buttons
      window.addEventListener("volumebuttonslistener", this.onVolumeButtonsListener.bind(this), false);

      //fake volume button
      //if(navigator.userAgent.match(/(iPhone|iPod|iPad)/)){
        $(document.body).on('touchstart',function(e){
      		if(e.originalEvent.touches.length == 2){
      			this.onVolumeButtonsListener.call(this,{signal:'volume-up'});
      			e.stopPropagation();
      		}
      	}.bind(this));
      //}


      //perhaps: http://phonegap-plugins.com/plugins/rja235/volumebuttons
      //using https://github.com/manueldeveloper/cordova-plugin-volume-buttons.git
      //create our own plugin, perhaps using: https://github.com/jpsim/JPSVolumeButtonHandler

      //Kezzel 2017-10-12 - should not be necessary according to:
      //https://github.com/ftlabs/fastclick
      //var attachFastClick = Origami.fastclick;
  		//attachFastClick(document.body);


      $(document.body).on('click','.openStatus',function(){
        console.log('opening status');
        app.showStatus();
      }.bind(this));


      $(document.body).on('touchstart','button',function(){
        $(this).addClass('fake-active');
      }).on('touchend','button',function(){
        $(this).removeClass('fake-active');
      }).on('touchcancel','button',function(){
        $(this).removeClass('fake-active');
      });


      this.setupTemplates();
      this.startLocationService();


      if(this.qs['test_game']){
        var port = this.qs['port'];
        this._currentGame = {
          src:this.server+'/index/gamesrc/game_id/'+this.qs['test_game']
        };
        var url = 'http://localhost:'+port;
        $('#front').hide();
        //this.startLocationService();



        var g = require(this._currentGame.src,true);

        this._client = window._client = new GameClient(g.game,this.getPlayerToken());

        _client.server = url;
        _client.startPinging();
        //to start local server: node gameServer 1 9000 scorched_earth
        return;
      }

      this._posUpdater = smoothPosUpdater;


      this.login();

      /*this._currentGame = {
        src:this.server+'/index/gamesrc/game_id/'+'uno'
      };*/
      console.log('fetching game info');
      this._fetching = $.getJSON(this.server+'/index/game',{game_id:'uno',token:this.getPlayerToken()},function(data){
        if(window.analytics){analytics.trackView('gamepage');}
        console.log('got game info',data);
        this._currentGame = data.game;
        this.showGames();
        if(navigator && navigator.splashscreen){
          console.log('hiding splash');
          navigator.splashscreen.hide();
        }
      }.bind(this)).fail(function(e){
        if(navigator && navigator.splashscreen){
          console.log('hiding splash');
          navigator.splashscreen.hide();
        }
        console.log('could not find game info:'+e);
        debugger;
      });


      //this.showGames();
    },


    getPlayerToken:function(){
      return this.getUUID();
    },

    login:function(){
      var token = this.getPlayerToken();
      console.log('sending login');
      $.ajax({
        dataType: "json",
        url: app.server+'/index/login',
        data:{token:token},
        success: function(r){
          console.log('logged in');
          this.player = r.player;
        }.bind(this),
        error:function(r,status,error) {
          console.log('error in login', status, error);
          app.openModal('Error','Could not login to server, try again',{
            'ok':function(){
              this.login();
              return false;
            }.bind(this)
          })

        }.bind(this),
        timeout:20000
      });

    },

    _currentGame:null,
    showGames:function(){
      clearTimeout(this._gameUpdater);

      var f = $('#front');
      var that = this;
      if(!f.length){
        console.log('creating front');
        this._old_html = "";
        f = $('<div id="front"></div>').appendTo("body");
        f.on('click','.stop',function(e){
          e.preventDefault();
          app.openModal('Stopping game','Stopping game instance',{'waiting...':function(){return true;}});
          $.getJSON(that.server+'/index/stop',{instance_id:$(this).attr('data-instance_id')},function(data){
            console.log('game stopped starting showGames');
            this.showGames();
          }.bind(that)).always(function(){
            app.closeModal();
          });
          return false;
        });

        f.on('click','.open',function(){
          if(that._fetching){
            //request.readyState > 0 && request.readyState < 4
            that._fetching.abort();
            that._fetching = null;
          }
          var game_id = $(this).attr('data-game_id');
          var all_games = app.all_games.games||[];

          for(var i=0;i<all_games.length;i++){
            if(all_games[i].game_id == game_id){
              that._currentGame = all_games[i];
            }
          }

          //console.log(that._currentGame);

          that.showGames();

          if(!that._currentGame){
            that._fetching = $.getJSON(that.server+'/index/game',{game_id:$(this).attr('data-game_id'),token:that.getPlayerToken()},function(data){

              that._currentGame = data.game;
              that.showGames();
            });
          }
        });

        f.on('click','.start',function(){

          this.startGame(that._currentGame);

          //.focus();
        }.bind(this));

        f.on('click','.back',function(){
          if(that._fetching){
            //request.readyState > 0 && request.readyState < 4
            that._fetching.abort();
            that._fetching = null;
          }
          that._currentGame = null;
          that.showGames();
        });
        f.on('click','.about',function(){
          app.showAbout();
        });

        f.on('click','.instance',function(){

          var instance_id = $(this).attr('data-instance_id');
          that.startGame(that._currentGame,instance_id);
        });

        try{
          if(!localStorage.getItem("firstTime")){
            localStorage.setItem("firstTime","true");

            app.openModal('Get started',app.welcomePopupTmpl(),{'Close':function(){return false;}});
          }
        } catch(e){
          console.log('could not use localStorage',e);
        }
      }
      //$("#front").html(this.frontTmpl()).show();
      //get current games from server
      //console.log('showgames',this._currentGame);

      if(this._currentGame){

        var new_html = this.gameTmpl(this._currentGame);
        if(new_html != this._old_html){
          var current_scroll = $("#front .inner").scrollTop();
          $("#front").html(new_html);
          $("#front .inner").scrollTop(current_scroll);
          this._old_html = new_html;
        }

        //update data
        var t = new Date().getTime();
        this._fetching = $.getJSON(this.server+'/index/game',{game_id:this._currentGame.game_id,token:this.getPlayerToken()},function(data){
          //use new time as a ping
          var this_t = new Date().getTime();
          var ping_time = this_t-t;
          if(!this._pingHist) this._pingHist = [];
          this._pingHist.push(ping_time);
          if(this._pingHist.length > 1000) this._pingHist.shift();

          //update connection quality
          $('.playerQuality .connection').attr('class','connection '+app.getConnectionAccuracyLevel(ping_time));

          this._currentGame = data.game;
          var new_html = this.gameTmpl(this._currentGame);
          if(new_html != this._old_html){
            var current_scroll = $("#front .inner").scrollTop();
            $("#front").html(new_html);
            $("#front .inner").scrollTop(current_scroll);
            this._old_html = new_html;
          }
        }.bind(this))
        .fail(function(error,error_text) {
          if(error_text == "abort"){
            //normal ignore
          } else {
            console.log('error when fetching game:',error_text);
          }
        })
        .always(function() {
          this._gameUpdater = setTimeout(this.showGames.bind(this),1000);
        }.bind(this));

      } else {
        if(app.all_games){
          $("#front").html(this.frontTmpl(app.all_games));
        }
        this._fetching = $.getJSON(this.server+'/index/listgames',function(data){
          app.all_games = data;

          $("#front").html(this.frontTmpl(data));
        }.bind(this)).fail(function(e){
          console.log('failed fetching game:',e);
          this._gameUpdater = setTimeout(this.showGames.bind(this),1000);
        });
      }
    },

    startGame:function(game, instance_id){

      //If no player name, start by requesting it
      if(!this.player.name){
        var player_name = null;

        console.log('no name, prompt for name');

        app.openModal('Player name','<h2>Choose player name</h2><input name="player_name" value=""/>',{
          'Cancel':function(){return false;},
          'Ok':function(){

            name = $('#modal input[name=player_name]').val();

            $.getJSON(this.server+'/index/updateplayer',{token:this.getPlayerToken(),name:name},function(r){
              this.player = r.player;
              this.startGame(game, instance_id);
            }.bind(this));

            return false; //keep the modeal
          }.bind(this)
        });

        //dont continue
        return;
      }

      //if no instance is created, create it first and call startGame on it
      if(!instance_id){
        var name = null;
        app.openModal('Game name','<h2>Game title</h2><input name="game_name" value=""/>',{
          'Cancel':function(){return false;},
          'Create':function(){

            name = $('#modal input[name=game_name]').val();



            app.openModal('Starting game','Creating new game instance on server',{'waiting...':function(){return true;}});


            $.getJSON(that.server+'/index/start',{
              game_id:that._currentGame.game_id,
              token:that.getPlayerToken(),
              name:name,
              //store pos in lat lng on server
              pos:this._posUpdater && this._posUpdater.getLastRawPos() ? new ol.geom.Point(ol.proj.transform(this._posUpdater.getLastRawPos().c, 'EPSG:3857', 'EPSG:4326')).getCoordinates() : null
            },function(data){
              if(data && data.instance_id){
                this.startGame(game,data.instance_id);
              } else {
                app.openModal('Could not start game',data.error,{
                  'close':function(){return false;}
                });
              }
              //this.showGames();
            }.bind(that)).fail(function(e){
              app.openModal('Starting game','An unknown error happened while creating the game',{'ok':function(){return false;}});
            }.bind(this));
            return true; //keep the modeal
          }.bind(this)
        });

        //set default name
        $('#modal input[name=game_name]').val(this.player.name ? this.player.name+'\'s game' : 'My game');

        return;
      }

      if(window.analytics){analytics.trackView('startgame/'+instance_id);}

      delete(this._old_html);
      if(!this.player){
        console.log('no player when starting game');
        return;
      }

      //allways clear the updater
      if(this._fetching){
        this._fetching.abort();
        this._fetching = null;
      }
      clearTimeout(this._gameUpdater);


      console.log('Loading game ('+instance_id+') '+game.name);
      this.openModal('Starting game','loading game',{'waiting...':function(){return true;}});

      var g = require(game.src+'?v=1.2',true);

      console.log('joining game');

      this.openModal('Starting game','joining game:'+instance_id,{'waiting...':function(){return true;}});
      //join the game instance
      $.getJSON(this.server+'/index/joininstance',
        {token:this.getPlayerToken(),instance_id:instance_id},
        function(r){
          if(r.status == 'ok'){
            this.closeModal();
            delete(this._old_html);
            $('#front').hide();
            //moved to be started generally
            //this.startLocationService();
            //reset history
            this._posUpdater.stop();
            this._posUpdater.start();
            //this._posHist = this._posHist && this._posHist.length ? this._posHist.slice(-1) :[];
            this._pingHist = [];

            this._client = window._client = new GameClient(g.game,this.getPlayerToken(), instance_id);

            _client.server = r.instance.url;
            _client.startPinging();

            try{
              if(!localStorage.getItem('rulesRead_'+game.game_id)){
                localStorage.setItem('rulesRead_'+game.game_id,game.version);

                app.showRules();
              }
            } catch(e){
              console.log('could not use localStorage',e);
            }
          } else {
            this.openModal('Starting game','could not join instance:'+r.error,{'ok':function(){return false;}});

          }
        }.bind(this)
      ).fail(function(e){
        this.openModal('Starting game','An unknown error happened while joining the game',{'ok':function(){return false;}});

      }.bind(this));
    },


    exitGame:function(){


      if(this._client){
        this.showQuestionnaire();
        this._client.exit();

        //contact web server about the exit
        $.getJSON(this.server+'/index/exitinstance',
          {token:this.getPlayerToken(),instance_id:this._client.instance_id},
          function(r){
            if(r.status == 'ok'){
              console.log('clean exit');
              //clean exit all is ok
            } else {
              console.log('not clean exit:',r);
            }
          }.bind(this)
        ).fail(function(e){
          console.log('failure when exiting instance',e);
        }.bind(this));

        //fetch the log:
        var log = window.getConsoleLog();
        window.clearConsoleLog();
        try{
          $.post(this.server+'/index/saveinstancelog?token='+encodeURIComponent(this.getPlayerToken())+'&instance_id='+encodeURIComponent(this._client.instance_id),JSON.stringify(log),
          function(r,textStatus){
              if(r.status == 'ok'){
                console.log('log saved');
              } else {
                debugger;
              }
            }.bind(this)
          ).fail(function(){
            debugger;
          });
        } catch(e){
          console.log('could not send log:'+e);
        }



        delete(this._client);
        delete(window._client);
      }
      $("body").children().not("#modal").each(function(){
        $(this).remove();
      });


      delete(this._old_html);


      //enabled generally
      //this.stopLocationService();

      this.showGames();

    },
    setupTemplates:function(){
      var templates = $('script[type="text/x-handlebars-template"]');

      templates.each(function(i,t){
        t = $(t);
        this[t.attr('id')+'Tmpl'] =	Handlebars.compile(t.remove().html());
      }.bind(this));

    },
    onVolumeButtonsListener:function(info){
    	console.log("Button pressed: " + info.signal);
      switch(info.signal){
        case 'volume-up':
          if(this._client){
            this._client.triggerVolumeUp();
          }
          break;
        case 'volume-down':
          break;
      }
    },
    startLocationService: function(){
      console.log('starting location service');
      if(!navigator.geolocation){
        console.log('no gps, using html5 geolocation');
        var geolocation = new ol.Geolocation({
          tracking: true
        });

        this._onLocationUpdate = function(evt){
          //TODO: this is for tesing, should be removes
          window.loc = geolocation.getPosition();

          var pp = new ol.geom.Point(ol.proj.transform(geolocation.getPosition(), 'EPSG:4326', 'EPSG:3857'));
          var c = pp.getCoordinates();
          console.log('got pos change:'+c[0]+','+c[1]);
          if(this._client && !window.pos){

            this._client.updatePosition({c:c,t:new Date().getTime(),a:8});
          } else {
            console.log('got location update, but no client or ',window.pos);
          }

        };

        //console.log(geolocation.getPosition());
        geolocation.on('change',this._onLocationUpdate,this);

        this._geolocation = geolocation;
      } else { //End of no gps, now setup the gps



        this._posUpdater.start(this);

        //The actual watch function
        console.log('starting geolocation watch');
        this._navigator_watchId = navigator.geolocation.watchPosition(function(pos){
          var pp = new ol.geom.Point(ol.proj.transform([pos.coords.longitude, pos.coords.latitude], 'EPSG:4326', 'EPSG:3857'));

          var c = pp.getCoordinates();

          var pos_obj = {
            c:c,
            t:pos.timestamp,
            rt: new Date().getTime(), //received timestamp
            a: pos.coords.accuracy
          };

          console.log('GPS:'+pos_obj.t+'/'+pos_obj.rt+'['+pos_obj.c[0]+','+pos_obj.c[1]+'] a'+pos_obj.a);

          this._posUpdater.updatePos(pos_obj);


          if(!this._client){
            $('.playerQuality .location').attr('class','location '+app.getPosAccuracyLevel(pos_obj.a));
          }

          return;
        }.bind(this),
          function(err){
            console.log('error in gps:'+err.code +' '+err.message);
            //console.log('restarting location service');
            //this.stopLocationService();
            //this.startLocationService();
          }.bind(this),
          {enableHighAccuracy: true, timeout:5000,maximumAge:0});


        //Keep track of compass heading if available
        if(navigator.compass){
          console.log('getting heading');
          this._compass_watch_id = navigator.compass.watchHeading(function(heading){
            //console.log('heading:'+heading.magneticHeading);
            let h = -heading.magneticHeading*Math.PI/180;
            this._postUpdater.updateHeading(h)

          }.bind(this), function(e){
            console.log('error while getting compass heading');
          });
        }
      }



      //manual control of position
      that = this;
      if(!window._keyeventhandler){
        console.log('adding window key event handler');
        window._keyeventhandler = $(window).on('keydown',function(e){

          let last_pos_obj = this._posUpdater.getLastRawPos();

          if(!last_pos_obj){
            last_pos_obj = {
              c:[1378912.8737958667,7505816.7162987655],
              t: new Date().getTime(),
              rt: new Date().getTime(),
              a:8
            }
            console.log('no pos hist');
            //return;
            /*
            console.log('fetching pos from client to overwrite it')
            var p = that._client.gs.currentPlayer.pos._value;
            window.pos = [p.x,p.y];*/
          }
          var pos = last_pos_obj.c;
          if(this._posUpdater._lastHeading === undefined){
            this._posUpdater._lastHeading = 0;
          }

          switch(e.key){
            case 'ArrowUp':
              pos[1]+=1;
              break;
            case 'ArrowDown':
              pos[1]-=1;
              break;
            case 'ArrowLeft':
              pos[0]-=1;
              break;
            case 'ArrowRight':
              pos[0]+=1;
              break;
            case '.':
              this._posUpdater._lastHeading-=0.1;
              break;
            case ',':
              this._posUpdater._lastHeading+=0.1;
              break;
            case ' ':
              if(this._client){
                this._client.triggerVolumeUp();
              }
              //console.log('space');
              break;
            default:
              //console.log('e'+e.key);
              return;
          }
          //console.log(pos);

          var pos_obj = {
            c:pos,
            t:new Date().getTime(),
            rt: new Date().getTime(), //received timestamp
            a:8 //default acuracy
          };

          this._posUpdater.updatePos(pos_obj);

          if(!this._posHist){
            this._posHist = [];
            this._posHist.push(pos_obj);
            //this._smoothPosUpdates(); //fire first time
          } else {
            this._posHist.push(pos_obj);
            if(this._posHist.length >= 10){
              this._posHist.shift();
            }
          }

          return;
          /*
          if(this._client){
            this._client.updatePosition(window.pos);
          }*/
        }.bind(this));
      }
    }, //end of startLocationService

    stopLocationService:function(){
      if(this._geolocation){
        this._geolocation.un('change',this._onLocationUpdate,this);
        delete(this._geolocation);
      }
      if(this._navigator_watchId){
        navigator.geolocation.clearWatch(this._navigator_watchId);
        this._navigator_watchId = null;
      }
      if(this._posUpdater){
        this._posUpdater.stop();
      }

      if(this._compass_watch_id){
        navigator.compass.clearWatch(this._compass_watch_id);
      }
      //delete(this._posHist);
    },

    /**
  	 * Returns the UUID for this device
  	 */
  	getUUID: function(){
  		if(window.device){
  			return window.device.uuid;
  		}
  		return this.fake_uuid;
  	},

    openModal: function(title,body,buttons,type){
      if(!buttons){
        buttons = {
          'ok': function(){return true;}
        };
      }

      if(!$("#modal").length){
        $('<div id="modal"></div>').appendTo("body");
      }
      $("#modal").html(this.modalTmpl({
        title:title,
        body:body,
        btns:buttons
      }));
      if(type=='fullscreen'){
          $("#modal .modal").addClass('fullscreen');
      }

      $("#modal").off('click','.footer button');
      $("#modal").on('click','.footer button',function(e){
        var i = $(this).parent().children().index(this);

        var k = Object.keys(buttons)[i];
        var r = buttons[k].apply();
        if(!r){
          app.closeModal();
        }
      });
      $("#modal").show();
    },
    closeModal:function(){
      $("#modal").hide().off('click','.footer button');
    },
    showRules: function(){

      this.openModal('How to play',app._currentGame.rules,{
        'Close':function(){
          return false;
        }
      },'fullscreen')
    },
    showAbout: function(){
      app.openModal('About GeoPlay',app.aboutPopupTmpl(),{
        'close':function(){return false;}
      },'fullscreen');
    },
    showContact: function(){
      app.openModal('Contact',app.contactPopupTmpl(),{
        'close':function(){return false;}
      },'fullscreen');
    },
    showStatus: function(){
      var btns = {

      }

      if(app._client){
        btns['Quit'] = function(){
          app.exitGame();
          return true;
        };
      }

      btns['Continue'] = function(){
        return false;
      };

      app.openModal('Status',app.statusPopupTmpl({
        currentGame:app._currentGame,
        client: app._client,
        appVersion:  '%%VERSION%%'
      }),
        btns
      );
    },

    showQuestionnaire: function(){
      if(!this._client){
        console.log('no client when showing qustionaire');
        return;
      }
      var url = this.server+'/index/savequestionnaire?token='+encodeURIComponent(this.getPlayerToken())+'&instance_id='+encodeURIComponent(this._client.instance_id);



      this.openModal('Rate experience',this.questionnaireTmpl(this._currentGame),{
        'Send':function(){
          var data = {}
          $('#modal form.questionnaire').serializeArray().map(function(v){
            data[v.name] = v.value;
          });


          if(!data.rating){
            var r = $('#modal form.questionnaire .rating');
            r.removeClass('smiley_highlight');
            void r[0].offsetWidth;
            r.addClass('smiley_highlight');

            return true;
          }

          //fill with extra data
          data.platform       = window.device ? window.device.platform : 'none';
          data.model          = window.device ? window.device.model : 'none';
          data.manufacturer   = window.device ? window.device.manufacturer : 'none';
          data.deviceversion   = window.device ? window.device.version : 'none';
          data.appversion = "%%VERSION%%";

          //net playerQuality
          //gps playerQuality
          var stat = this.calcStatistics();
          data.stat = stat;

          console.log('sending stat',data);

          $.post(url,JSON.stringify(data),
          function(r,textStatus){
              if(r.status == 'ok'){
                console.log('questionnaire saved');
              } else {
                debugger;
              }
            }.bind(this)
          ).fail(function(){
            debugger;
          });

          //get the info
          return false;
        }.bind(this)
      });
    },
    getPosAccuracyLevel: function(a){
      if(a < 10){
        return 'good';
      } else
      if(a < 20){
        return 'medium';
      } else {
        return 'bad';
      }
    },
    getConnectionAccuracyLevel: function(ping){
      if(ping < 200){
        return 'good';
      } else
      if(ping < 500){
        return 'medium';
      } else {
        return 'bad';
      }
    },
    calcStatistics : function(){
      let posHist = this._posUpdater.getHist();
      var l = posHist.length;
      var stat = {
        points: l
      }

      if(l){
        var total_time = posHist[l-1].t - posHist[0].t;

        var total_delay =0;
        var total_delay_sq = 0;
        var total_accuracy = 0;
        var total_accuracy_sq = 0;

        for(var i=0;i < l;i++){
          total_delay+=posHist[i].rt - posHist[i].t;
          total_delay_sq += Math.pow(posHist[i].rt - posHist[i].t,2);
          total_accuracy+=posHist[i].a;
          total_accuracy_sq += Math.pow(posHist[i].a,2);
        }

        stat.time_total = total_time;
        stat.time_avg = (total_time/(l-1));
        stat.delay_avg = total_delay/l;
        stat.delay_var = (total_delay_sq - total_delay*total_delay/(l))/(l-1);
        stat.acc_avg = total_accuracy/l;
        stat.acc_var = (total_accuracy_sq - total_accuracy*total_accuracy/l)/(l-1);
      }

      var n = this._pingHist.length, ping_total = 0, ping_total_sq = 0;
      stat.pings = n;
      if(n){
        for(var i=0;i < n;i++){
          ping_total+=this._pingHist[i];
          ping_total_sq+=Math.pow(this._pingHist[i],2);
        }

        stat.ping_avg = ping_total/n;
        stat.ping_var = (ping_total_sq - ping_total*ping_total/n)/(n-1);
      }
      return stat;
    }

};

app.initialize();
