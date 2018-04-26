/*document.addEventListener("deviceready", function(){
  alert('got start device ready');
  window.deviceisready = true;
});
alert('device ready fired');
*/
require('js/log.js');
require('js/handlebars-setup.js');
require('js/client.js');


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
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    //debug settings that will take over if in debug mode
    debug: {
      server: 'http://alphagames.all2day.dk'
    },
    server: 'http://geogames.all2day.dk',//'http://52.208.48.54:9615',

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
        app.showStatus();
      }.bind(this));

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
      }.bind(this)).fail(function(e){
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
          if(prompt('Could not login to server, try again')){
            this.login();
          }

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
            console.log('gamd stopped starting showGames');
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
          var name = null;
          app.openModal('Game name','<h2>Game title</h2><input name="game_name" value=""/>',{
            'Create Game':function(){

            name = $('#modal input[name=game_name]').val();

            app.openModal('Starting game','Creating new game instance on server',{'waiting...':function(){return true;}});


            $.getJSON(that.server+'/index/start',{
              game_id:that._currentGame.game_id,
              token:that.getPlayerToken(),
              name:name,
              //store pos in lat lng on server
              pos:this._posHist && this._posHist.length? new ol.geom.Point(ol.proj.transform(this._posHist.slice(-1)[0].c, 'EPSG:3857', 'EPSG:4326')).getCoordinates() : null
            },function(data){
              if(data && data.instance_id){
                this.startGame(data.instance_id);
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
          }.bind(this),
            'cancel':function(){return false;}});


          $('#modal input[name=game_name]').val(this.player.name ? this.player.name+'\'s game' : 'My game').focus();
          /*var name = window.prompt('Please choose a name for the game','');
          if(name===null){
            return;
          }*/

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
          that.startGame(instance_id);
        });

        try{
          if(!localStorage.getItem("firstTime")){
            localStorage.setItem("firstTime","true");

            app.openModal('Welcome to GeoPlay',app.welcomePopupTmpl(),{'Close':function(){return false;}});
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

    startGame:function(instance_id){
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


      if(!this.player.name){
        console.log('no name, prompt for name');
        var name = window.prompt('Player name');
        $.getJSON(this.server+'/index/updateplayer',{token:this.getPlayerToken(),name:name},function(r){
          this.player = r.player;
          this.startGame(instance_id);
        }.bind(this));
        return;
      }

      console.log('Loading game ('+instance_id+') '+this._currentGame.name);
      this.openModal('Starting game','loading game',{'waiting...':function(){return true;}});

      var g = require(this._currentGame.src+'?v=1.2',true);

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
            this._posHist = this._posHist && this._posHist.length ? this._posHist.slice(-1) :[];
            this._pingHist = [];

            this._client = window._client = new GameClient(g.game,this.getPlayerToken(), instance_id);

            _client.server = r.instance.url;
            _client.startPinging();

            try{
              if(!localStorage.getItem('rulesRead_'+this._currentGame.game_id)){
                localStorage.setItem('rulesRead_'+this._currentGame.game_id,this._currentGame.version);

                app.showRules();
              }
            } catch(e){
              console.log('could not use localStorage',e);
            }
          } else {
            this.openModal('Starting game','could not join instance:'+r.error,{'ok':function(){return false;}});
            //alert('could not join instance:'+r.error);
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

        this._smoothPosUpdates = function(){
          this._smoothPosUpdates._run_count = (this._smoothPosUpdates._run_count || 0)+1;

          //calculate best position based on time
          var delay = 200;
          var expected_frequency = 1200; //The expected ms between updates
          var t = new Date().getTime();

          //if just reset
          if(!this._posHist || !this._posHist.length){
            this._smoothPosUpdates.timer_id = setTimeout(this._smoothPosUpdates,app.config.smooth_interval);
            return;
          }

          //when there is only one point in history, simply send that
          if(this._posHist.length == 1){
            //set the last pos to be the current pos
            this._lastPos = {
              c:this._posHist[0].c,
              t:t
            };
          } else {

            //if multiple points define new_pos to be the newest and old_pos to be the next to newest
            var old_pos = this._posHist[this._posHist.length-2];
            var new_pos = this._posHist[this._posHist.length-1];

            if(Number.isNaN(new_pos.c[0])){
              console.log('1new_pos is nan');
            }
            if(Number.isNaN(old_pos.c[0])){
              console.log('1old_pos is nan');
            }
            if(Number.isNaN(this._lastPos.c[0])){
              console.log('1last_pos is nan');
            }

            //if the current time is before the new pos time (+ delay), the goal is to go towards the new_pos (vector from last position to new position)
            var delta, delta_length_sq, this_t, f, new_point, method;

            if(new_pos.t == old_pos.t){
              //if no time has passed simply add the newest pos
              console.log('no time passed, ignoring');
              console.log('old_pos:['+old_pos.c[0]+','+old_pos.c[1]+","+old_pos.t+"]");
              console.log('new_pos:['+new_pos.c[0]+','+new_pos.c[1]+","+new_pos.t+"]");

              //store the new point in last pos
              this._lastPos = {
                c:[new_pos.c[0],new_pos.c[1],0],
                t: t,
                a: new_pos.a
              };
            } else
            if(t < new_pos.t + delay){
              method = 'before_new_pos';
              delta =  [
                new_pos.c[0]-this._lastPos.c[0], //delta x
                new_pos.c[1]-this._lastPos.c[1], //delta y
                new_pos.t +delay - this._lastPos.t //delta time
              ];
              delta_length_sq = delta[0]*delta[0]+delta[1]*delta[1];

              //calculate the time since last pos
              this_t = t-this._lastPos.t;
              //calculate a factor based on the amount of time since last pos compared to the time to new_pos
              f = this_t/delta[2];

              if(Number.isNaN(f)){
                console.log('got nan before new_pos');
              }


              //calculate a new point using last_pos the vector and the factor
              new_point = [
                this._lastPos.c[0] + f*delta[0],
                this._lastPos.c[1] + f*delta[1],
                delta_length_sq>0.5 ? Math.atan2(delta[1], delta[0])-Math.PI*.5 : this._lastPos.c[2]
              ];

              //store the new point in last pos
              this._lastPos = {
                c:new_point,
                t: t,
                a: this._lastPos.a
              };

            } else {
              method = 'after_new_pos';
              //if the time is after the new pos (+ delay) use a vector between the old and new pos as a guide
              delta =  [new_pos.c[0]-old_pos.c[0],new_pos.c[1]-old_pos.c[1],new_pos.t - old_pos.t];



              delta_length_sq = delta[0]*delta[0]+delta[1]*delta[1];


              //calculate the amount of time after the new pos
              this_t = t - (new_pos.t +delay);

              //a new position is expected after ~1000ms - delay, thus if larger than this slow down
              if(this_t + delay > expected_frequency){
                this_t = (expected_frequency - delay) + Math.sqrt(this_t + delay - expected_frequency);
              }


              //calculate a factor based on the time after new pos compared to the time bewteen the old pos and new pos
              var f = this_t/delta[2];
              if(Number.isNaN(f)){
                console.log('got nan after new_pos');
              }
              if(Number.isNaN(new_pos.c[0])){
                console.log('new_pos is nan');
              }

              //use the new pos as the base and the vecor as the guide with factor length to calculate the new position
              new_point = [
                new_pos.c[0] + f*delta[0],
                new_pos.c[1] + f*delta[1],
                delta_length_sq>0.5 ? Math.atan2(delta[1], delta[0])-Math.PI*.5 : this._lastPos.c[2]
              ];

              //store the new point in the last pos
              this._lastPos = {
                c:new_point,
                t: t,
                a:new_pos.a
              };

            }

            if(!this._lastPos || !this._lastPos.c || Number.isNaN(this._lastPos.c[0]) || Number.isNaN(this._lastPos.c[1])){
              console.log('got bad last pos:'+method);

              console.log('this_t:'+this_t);
              console.log('delta:['+delta[0]+','+delta[1]+","+delta[2]+"]");
              console.log('f:'+f);
            }
          }

          if(!this._lastPos || !this._lastPos.c || Number.isNaN(this._lastPos.c[0]) || Number.isNaN(this._lastPos.c[1])){
            console.log('got bad last pos:'+first);
          }

          //overwrite with compass if available
          if(this._lastHeading !== undefined){
            this._lastPos.c[2] = this._lastHeading;
          }

          //if a client is available, use the position of the last pos and update
          if(this._client){
            //console.log('updating client pos', this._lastPos.c);
            this._client.updatePosition(this._lastPos);
          }

          if(this._smoothPosUpdates._run_count % 50 == 49){
            console.log('GPS STAT:',this.calcStatistics());
          }

          //restart the smooth timer
          this._smoothPosUpdates.timer_id = setTimeout(this._smoothPosUpdates,app.config.smooth_interval);
        }.bind(this); // End of smooth updates



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

          if(!this._posHist){
            this._posHist = [];
            this._posHist.push(pos_obj);
            console.log('starting smoothing');

            this._smoothPosUpdates(); //fire first time
          } else
          if(!this._posHist.length){
            this._posHist.push(pos_obj);
          } else {
            //if matching the one before, ignore it
            var last_pos = this._posHist[this._posHist.length-1];
            if(pos_obj.c[0] == last_pos.c[0] && pos_obj.c[1] == last_pos.c[1] && pos_obj.t == last_pos.t){
              console.log('got location update duplicate, ignoring');
              var t = new Date().getTime();
              console.log('current time is:'+t+' and timestamp of pos is:'+pos_obj.t);
              return;
            }

            this._posHist.push(pos_obj);
            if(this._posHist.length >= 100){
              this._posHist.shift();
            }
          }

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
            this._lastHeading = -heading.magneticHeading*Math.PI/180;
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
          if(!this._posHist || !this._posHist.length){
            console.log('no pos hist');
            return;
            /*
            console.log('fetching pos from client to overwrite it')
            var p = that._client.gs.currentPlayer.pos._value;
            window.pos = [p.x,p.y];*/
          }
          var pos = this._posHist[this._posHist.length-1].c;
          if(this._lastHeading === undefined){
            this._lastHeading = 0;
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
              this._lastHeading-=0.1;
              break;
            case ',':
              this._lastHeading+=0.1;
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

          if(!this._posHist){
            this._posHist = [];
            this._posHist.push(pos_obj);
            this._smoothPosUpdates(); //fire first time
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
      if(this._smoothPosUpdates && this._smoothPosUpdates.timer_id){
        clearTimeout(this._smoothPosUpdates.timer_id);
      }
      if(this._compass_watch_id){
        navigator.compass.clearWatch(this._compass_watch_id);
      }
      delete(this._posHist);
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

    openModal: function(title,body,buttons){
      if(!$("#modal").length){
        $('<div id="modal"></div>').appendTo("body");
      }
      $("#modal").html(this.modalTmpl({
        title:title,
        body:body,
        btn:Object.keys(buttons)[0]
      }));

      $("#modal").off('click','.footer');
      $("#modal").on('click','.footer',function(e){
        var k = Object.keys(buttons)[0];
        var r = buttons[k].apply();
        if(!r){
          app.closeModal();
        }
      });
      $("#modal").show();
    },
    closeModal:function(){
      $("#modal").hide().off('click','.footer');
    },
    showRules: function(){

      this.openModal('How to play',app._currentGame.rules,{
        'Close':function(){
          return false;
        }
      })
    },
    showAbout: function(){
      app.openModal('About GeoPlay',app.aboutPopupTmpl(),{
        'close':function(){return false;}
      });
    },
    showStatus: function(){
      app.openModal('Status',$('<h2>').text(app._currentGame ? app._currentGame.name : 'GeoPlay').prop('outerHTML')+
        (app._client ? '<button onclick="app.exitGame();" style="width:auto;">Quit game</button><br /><br />' : '')+
        '<a href="" onclick="app.showAbout();return false">Show About</a><br /><br />'+
        (app._currentGame ? '<a href="" onclick="app.showRules();return false;">Show rules</a><br /><br />':'')+
        '<h2>App version:%%VERSION%%</h2>',
        {
        'Continue':function(){
          return false;
        }
      });
    },
    showQuestionnaire: function(){
      if(!this._client){
        console.log('no client when showing qustionaire');
        return;
      }
      var url = this.server+'/index/savequestionnaire?token='+encodeURIComponent(this.getPlayerToken())+'&instance_id='+encodeURIComponent(this._client.instance_id);



      this.openModal('Rate the gameplay',this.questionnaireTmpl(this._currentGame),{
        'Send':function(){
          var data = {}
          $('#modal form.questionnaire').serializeArray().map(function(v){
            data[v.name] = v.value;
          });


          if(!data.rating){
            alert('Please select a rating');
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
      })
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
      var l = this._posHist.length;
      var stat = {
        points: l
      }

      if(l){
        var total_time = this._posHist[l-1].t - this._posHist[0].t;

        var total_delay =0;
        var total_delay_sq = 0;
        var total_accuracy = 0;
        var total_accuracy_sq = 0;

        for(var i=0;i < l;i++){
          total_delay+=this._posHist[i].rt - this._posHist[i].t;
          total_delay_sq += Math.pow(this._posHist[i].rt - this._posHist[i].t,2);
          total_accuracy+=this._posHist[i].a;
          total_accuracy_sq += Math.pow(this._posHist[i].a,2);
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
