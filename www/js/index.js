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
    //server: 'http://localhost:9615',
    server: 'http://52.208.48.54:9615',
    time_offset: 0,

    // Application Constructor
    initialize: function() {
      if(navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) { //removed |IEMobile
        console.log('registering deviceready');
        document.addEventListener("deviceready", function(){
          console.log('Got deviceready');
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
        }, false);


        } else {
          console.log('NOT registering deviceready');
          app.onDeviceReady();
        }
        //document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        console.log('device ready');
        //create the map
        this.createMap();
        this.watchPosition();


        this.startStatePinging();
        //this.startEKF();

    },

    startEKF: function(){
      //math: http://mathjs.org/docs/index.html

      window.efk.initialize();

    },

    startStatePinging: function(){
      //console.log('starting ping');
  		var t = new Date().getTime();
  		$.ajax({
  			dataType: "json",
        url: app.server+'?'+JSON.stringify(app.getStateChanges()),
  			//url: 'http://localhost:9615',
  			/*data: app.getStateChanges(),*/
  			success: function(r){
  				var this_t = new Date().getTime();
          var time_offset = (this_t - t - r.rt)/2 + r.t + r.rt - this_t;
          app.time_offset = Math.round(0.9*app.time_offset + 0.1*time_offset);

  				//console.log('back in '+(this_t - t),r, time_offset, app.time_offset);
          app.pingControlDiv.text((this_t - t));
          app.players = r.players;
          app.bombs = r.bombs;

          var p = app.players[app.getUUID()];

          $('.hits',app.topControlDiv).text(p.hits);
          $('.dies',app.topControlDiv).text(p.dies);
          $('.bombs',app.topControlDiv).text(p.bombs);

          if(r.cmdQueue){
            for(var i =0;i< r.cmdQueue.length;i++){
              console.log('got cmd:'+r.cmdQueue[i][0]);
              switch(r.cmdQueue[i][0]){
                case 'die':
                  $('.info',app.topControlDiv).text('DIE!!!');
                  if(navigator.vibrate){
                    navigator.vibrate(500);
                  }
                  break;
                case 'write':
                  $('.info',app.topControlDiv).text(r.cmdQueue[i][1]);
                  break;
                case 'hit':
                  $('.info',app.topControlDiv).text('Hit another player!');
                  break;
              }
            }
          }
  				app.startStatePinging();
  			},
  			error:function(r,status,error) {
  				//debugger;
  				console.log('status:'+status+' error:'+error);
  				//alert(error);
          app.pingControlDiv.text('connection error');
          setTimeout(app.startStatePinging,1000);
  			},
  			timeout:2000
  		});
    },

    getStateChanges: function(){
      var state = {pos:app.playerPoint ? app.playerPoint.getCoordinates()/*ol.proj.transform(app.playerPoint.getCoordinates(), 'EPSG:3857','EPSG:4326')*/ : null, UUID: app.getUUID()};
      if(app.cmdQueue && app.cmdQueue.length){
        console.log('sending cmd queue',app.cmdQueue);
        state.cmdQueue = app.cmdQueue;

        app.cmdQueue = [];
      }


      return state;
    },

    addCmd: function(cmd,d){
      if(!app.cmdQueue){
        app.cmdQueue = [];
      }
      app.cmdQueue.push([cmd,new Date().getTime()+app.time_offset,d]);

    },

    watchPosition: function(){
      var geolocation = new ol.Geolocation({
        tracking: true
      });

      if(!navigator.geolocation){
        geolocation.on('change',function(evt){
          //debugger;
          console.log('got pos change');
          if(app.playerPoint){
            if(!app.oldPoints){
              app.oldPoints = [];
            }
            app.oldPoints.push(app.playerPoint);
            if(app.oldPoints.length > 3){
              app.oldPoints.shift();
            }
          }
          app.playerPoint = new ol.geom.Point(ol.proj.transform(geolocation.getPosition(), 'EPSG:4326', 'EPSG:3857'));


          console.log(app.playerPoint.getCoordinates()[0]);
          console.log(app.playerPoint.getCoordinates()[1]);
          console.log(app.playerPoint.getCoordinates());
          //app.map.getView().setCenter(ol.proj.transform(geolocation.getPosition(), 'EPSG:4326', 'EPSG:3857'));
          var s = app.map.getSize();
          app.map.getView().centerOn(app.playerPoint.getCoordinates(),s,[s[0]*.5,s[1]*0.66]);

        });
        return;
      }


      var watchId = navigator.geolocation.watchPosition(function(pos){
        //console.log(pos.coords.longitude+","+pos.coords.latitude+","+pos.coords.heading);

        //app.map.getView().setZoom(12);
        //console.log('got pos change');
        if(app.playerPoint){
          if(!app.oldPoints){
            app.oldPoints = [];
          }
          app.oldPoints.push(app.playerPoint);
          if(app.oldPoints.length > 3){
            app.oldPoints.shift();
          }
        }

        app.playerPoint = new ol.geom.Point(ol.proj.transform([pos.coords.longitude, pos.coords.latitude], 'EPSG:4326', 'EPSG:3857'));
        if(app.playerPoint){
          //app.map.getView().setCenter(app.playerPoint.getCoordinates());
          var s = app.map.getSize();
          app.map.getView().centerOn(app.playerPoint.getCoordinates(),s,[s[0]*.5,s[1]*0.66]);
          /*if(navigator.compass){
            //console.log('getting heading');
            navigator.compass.getCurrentHeading(function(heading){
              //console.log('heading:'+heading.magneticHeading);
              app.map.getView().rotate(-heading.magneticHeading*Math.PI/180,app.playerPoint.getCoordinates());
            }, function(e){
              console.log('error while getting compass heading');
            });
          }*/
          /*if(pos.coords.heading != null){
            app.map.getView().rotate(pos.coords.heading*Math.PI/180,app.playerPoint.getCoordinates());
          }*/
        }
        //app.map.getView().setCenter(ol.proj.transform([pos.coords.longitude, pos.coords.latitude], 'EPSG:4326', 'EPSG:3857'));

        //app.map.getView().setRotation(pos.coords.heading*Math.PI*2/360);
        //app.map.render();

      },
        function(err){
          console.log('error in gps:'+err);
        },
        {enableHighAccuracy: true, timeout:1000,maximumAge:0});



      if(navigator.compass){
        //console.log('getting heading:'+heading.magneticHeading);
        var compass_watch_id = navigator.compass.watchHeading(function(heading){
          //console.log('heading:'+heading.magneticHeading);
          if(app.playerPoint){
            app.map.getView().rotate(-heading.magneticHeading*Math.PI/180,app.playerPoint.getCoordinates());
          }
        }, function(e){
          console.log('error while getting compass heading');
        });
      }

      return;

    },

    createMap: function(){

      var map = app.map = new ol.Map({

        layers: [
          new ol.layer.Tile({
            source: new ol.source.OSM()
          })
        ],
        target: 'map',
        view: new ol.View({
          center: [0, 0],
          zoom: 18
        }),
        interactions:new ol.Collection([])/*ol.interaction.defaults({
          dragPan:false
        })*/

      });

      map.on('pointerdown',function(e){
        if(!app.dragPoint){
          var pp = app.map.getPixelFromCoordinate(app.playerPoint.getCoordinates());
          var d_x = pp[0] - e.pixel[0];
          var d_y = pp[1] - e.pixel[1];
          var d = Math.sqrt(d_x*d_x+d_y*d_y);
          if(d > 50){
            return;
          }
        }
        //console.log(e.coordinate);
        app.dragPoint = new ol.geom.Point(e.coordinate);
      });

      map.on('pointerdrag',function(e){
        if(!app.dragPoint){
          return;
        }
        //console.log(e.coordinate);
        app.dragPoint = new ol.geom.Point(e.coordinate);
      });
      map.on('pointerup',function(e){
        if(app.dragPoint){
          var pp = app.map.getPixelFromCoordinate(app.playerPoint.getCoordinates());
          var d_x = pp[0] - e.pixel[0];
          var d_y = pp[1] - e.pixel[1];
          var d = Math.sqrt(d_x*d_x+d_y*d_y);


          var bomb_coor = app.map.getCoordinateFromPixel([pp[0] + d_x,pp[1] + d_y]);
          app.addCmd('createBomb',bomb_coor/*ol.proj.transform(bomb_coor, 'EPSG:3857', 'EPSG:4326')*/);
          app.dragPoint = null;
        }
      })

      // Should be on the view
      map.getView().on('change:resolution',function(e){
        if(app.playerPoint){
          var s = app.map.getSize();
          app.map.getView().centerOn(app.playerPoint.getCoordinates(),s,[s[0]*.5,s[1]*0.66]);
        }
      });
      var d = $('<div/>',{
        html:'',
        css:{
          position:'absolute',
          top:0,
          right:0
        }
      });
      app.pingControlDiv = d;
      app.pingControl = new ol.control.Control({element:d[0]});
      map.addControl(app.pingControl);

      var d = $('<div/>',{
        html:'<span class="score"><span class="hits">0</span>/<span class="dies" style="color:red">0</span></span>&nbsp;&nbsp;<span class="info">welcome</span>(<span class="bombs">3</span>)',
        css:{
          position:'absolute',
          top:'30px',
          left:'50px',
          fontSize:'26px'
        }
      });
      app.topControlDiv = d;
      app.topControl = new ol.control.Control({element:d[0]});
      map.addControl(app.topControl);



      map.addControl(new ol.control.ScaleLine({}));

      var imageStyle = new ol.style.Style({
        image: new ol.style.Circle({
          radius: 5,
          snapToPixel: false,
          fill: new ol.style.Fill({color: 'yellow'}),
          stroke: new ol.style.Stroke({color: 'red', width: 1})
        })
      });

      var headInnerImageStyle = new ol.style.Style({
        image: new ol.style.Circle({
          radius: 15,
          snapToPixel: false,
          fill: new ol.style.Fill({color: 'blue'})
        })
      });

      var headOuterImageStyle = new ol.style.Style({
        image: new ol.style.Circle({
          radius: 15,
          snapToPixel: false,
          fill: new ol.style.Fill({color: 'black'})
        })
      });

      var blaStyle = new ol.style.Style({
        image: new ol.style.Circle({
          radius: 5,
          snapToPixel: false,
          fill: new ol.style.Fill({color: 'green'})
        })
      });

      var dragStyle = new ol.style.Style({
        image: new ol.style.Circle({
          radius: 60,
          snapToPixel: false,
          fill: new ol.style.Fill({color: 'yellow'})
        })
      });

      var bombStyle = new ol.style.Style({
        image: new ol.style.Circle({
          radius: 10,
          snapToPixel: false,
          fill: new ol.style.Fill({color: 'red'})
        })
      });

      var n = 2000;
      var omegaTheta = 30000; // Rotation period in ms
      var R = 7e6;
      var r = 2e6;
      var p = 2e6;
      map.on('postcompose', function(event) {
        var vectorContext = event.vectorContext;
        var frameState = event.frameState;
        /*var theta = 2 * Math.PI * frameState.time / omegaTheta;
        var coordinates = [];
        var i;
        for (i = 0; i < n; ++i) {
          var t = theta + 2 * Math.PI * i / n;
          var x = (R + r) * Math.cos(t) + p * Math.cos((R + r) * t / r);
          var y = (R + r) * Math.sin(t) + p * Math.sin((R + r) * t / r);
          coordinates.push([x, y]);
        }
        vectorContext.setStyle(imageStyle);
        vectorContext.drawGeometry(new ol.geom.MultiPoint(coordinates));

        var headPoint = new ol.geom.Point(coordinates[coordinates.length - 1]);


        //vectorContext.setStyle(headOuterImageStyle);
        //vectorContext.drawGeometry(headPoint);



        vectorContext.setStyle(headInnerImageStyle);
        //vectorContext.setStyle(blaStyle);
        vectorContext.drawGeometry(headPoint);
        //console.log(headPoint.getCoordinates());
        */

        if(app.oldPoints){
          vectorContext.setStyle(blaStyle);
          for(var i = 0;i < app.oldPoints.length;i++){
            vectorContext.drawGeometry(app.oldPoints[i]);
          }
        }

        if(app.players){
          $.each(app.players, function(uuid,p){
            if(p.pos){
                if(uuid == app.getUUID()){
                  return;
                }
                //console.log('drawing:'+uuid);
                vectorContext.setStyle(headInnerImageStyle);
                //console.log(p.pos);
                p.pos[0]= 1*p.pos[0];
                p.pos[1] = 1*p.pos[1];


                vectorContext.drawGeometry(new ol.geom.Point(p.pos/*ol.proj.transform(p.pos, 'EPSG:4326', 'EPSG:3857')*/));
            }
          });
        }

        if(app.bombs){
          var resolution = map.getView().getResolution();
          var projection = map.getView().getProjection();
          var resolutionAtCoords = ol.proj.getPointResolution(projection,resolution, map.getView().getCenter());

          bombStyle.getImage().setRadius(15/resolutionAtCoords);

          $.each(app.bombs, function(uuid,b){
            if(b.end_pos){

                //console.log('drawing:'+uuid);
                vectorContext.setStyle(bombStyle);



                var p = [b.start_pos[0] - (b.end_pos[0]- b.start_pos[0])*(b.time - (frameState.time+app.time_offset))/b.duration,
                        b.start_pos[1] - (b.end_pos[1]- b.start_pos[1])*(b.time - (frameState.time+app.time_offset))/b.duration];

                vectorContext.drawGeometry(new ol.geom.Point(p));
            }
          });
        }

        if(app.playerPoint){
          vectorContext.setStyle(headOuterImageStyle);
          vectorContext.drawGeometry(app.playerPoint);
        }

        if(app.dragPoint){
          vectorContext.setStyle(dragStyle);
          vectorContext.drawGeometry(app.dragPoint);
        }

        map.render();
      });
      map.render();
    },
    /**
  	 * Returns the UUID for this device
  	 */
  	getUUID: function(){
  		if(window.device){
  			return window.device.uuid;
  		}
  		return 24234234234433;
  	}
};




/**
 * Extend on the console log framework to allow it to show on screen
 */
(function(){
	//return false;

	var logs = [];



	var log_div = null;
	var native_console = console;
	var native_log = console.log;

	var add_to_div = function(t,entry){
		var s= '';
		for(var i=0;i < entry.length;i++){
			var a = entry[i];
			var r = '';
			if($.isArray(a)){
				r = 'array('+a.length+')';
			} else
			if($.type(a) === 'string'){
				r = a;
			} else
			if($.type(a) === 'number'){
				r = a.toString();
			} else {
				r = $.type(a);
			}

			s+= (s != '' ? ',':'')+r;
		}

		var span = $('<span style="background-color:rgba(255,255,255,0.8);float:left;clear:both;font-size:.7rem;"></span>').text((('00' + t.getHours()).slice(-2) + ':' + ('00'+t.getMinutes()).slice(-2)+':' + ('00'+t.getSeconds()).slice(-2) + '.' + String("00" + t.getMilliseconds()).slice(-3)+' ') +s);
		log_div.prepend(span);
	}

	var new_log = function(){

		if(native_log && $.isFunction(native_log)){
			var a = [];
			for(var i =0;i<arguments.length;i++){
				a.push(arguments[i]);
			}
			native_log.apply(native_console,a);
		} else {
			//alert('native is not fun');
		}
		var t = new Date();

		logs.push([t,arguments]);

		if(log_div){
			add_to_div(t,arguments);
		}
	};

	console.log = new_log;

	console.log("Logging initialized");

	window.getConsoleLog = function() {
		return logs;
	};

	window.console_reinsert = function() {
		if(console.log != new_log){
			console = {};
			console.log = new_log;
			window.console = console;
			console.log('log changed back');

			native_log = null;
		}
	};

	var toggle_log;

	toggle_log = function(){


		if(log_div){
			console.log('closing log');
			log_div.remove();
			log_div = null;
		} else {
			//var dev = app.store.getValueFromKey('dev',false);
			if(true || dev === 'true'){
				console.log('opening log');
				$(document.body).prepend('<div id="_log" style="-webkit-overflow-scrolling: touch;text-align:left;position:absolute;width:100%;height:100%;padding:1em;background-color:rgba(255,255,255,0.8);box-sizing:border-box;overflow-y:scroll;overflow-x:hidden;word-break:break-word;z-index:1000;color:black;"><a href="#" class="_log_close" style="position:absolute;top:1rem;right:1rem;font-size:1rem;background:white;color:black;">close</a><a href="#" class="_log_reset" style="position:absolute;top:3rem;right:1rem;font-size:1rem;background:white;color:black;">reset</a><a href="#" class="_log_send" style="position:absolute;top:5rem;right:1rem;font-size:1rem;background:white;color:black;">send</a><a href="#" class="_log_info" style="position:absolute;top:7rem;right:1rem;font-size:1rem;background:white;color:black;">log info</a><a href="#" class="_log_testprice" style="position:absolute;top:9rem;right:1rem;font-size:1rem;background:white;color:black;">test price</a></div>');
				log_div = $('#_log');
				log_div.on('click','._log_close',function(e){toggle_log();e.preventDefault();return false;});
				log_div.on('click','._log_reset',function(e){
          if(efk.started){
            efk.stop();
          } else {
            efk.start();
          }
          e.preventDefault();return false;});
				log_div.on('click','._log_send',function(e){
					var title=prompt('problem title');
					$.ajax({
						dataType: "json",
						url: app.server + '/index/sendlog?json=true',
						data: {'log':logs, 'html':document.documentElement.outerHTML,'title':title},
						type: "POST",
						success: function(d){
							console.log('log send res:'+d.status);
						},
						error:function() {
							console.log( "error while sending debug" );
						},
						timeout:10000
					});
					e.preventDefault();return false;
				});
				log_div.on('click','._log_info',function(e){
					//log all window content:
					for(var prop in window){
						console.log('window.'+prop);
					}
					e.preventDefault();return false;
				});
				log_div.on('click','._log_testprice',function(e){
					app.lockerPrice = 1
					alert('locker price set to:'+app.lockerPrice);
					e.preventDefault();return false;
				});

				var logs = window.getConsoleLog();




				for(var i = 0;i < logs.length;i++){
					add_to_div(logs[i][0],logs[i][1]);
				}
			}
		}
	}

	//register double touch
	$(document.body).on('touchstart',function(e){
		if(e.originalEvent.touches.length == 4){
			toggle_log();
			e.stopPropagation();
		}
	});

	if(!window.device){
		$(document.body).on('keydown',function(e){
			if(e.keyCode == 68 && e.ctrlKey){ //ctrl-d
				toggle_log();
				e.stopPropagation();
				e.preventDefault();
			}
		});
	}
})();


app.initialize();
