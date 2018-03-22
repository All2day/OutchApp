
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
		var a = [];
		for(var i =0;i<arguments.length;i++){
			a.push(arguments[i]);
		}

		if(native_log && $.isFunction(native_log)){

			native_log.apply(native_console,a);
		} else {
			//alert('native is not fun');
		}
		var t = new Date();

		logs.push([t,a]);

		if(log_div){
			add_to_div(t,a);
		}
	};

	console.log = new_log;

	console.log("Logging initialized");

	window.getConsoleLog = function() {

		//return the log as _stringSplit
		var ret_logs = [];
		for(var i = 0;i < logs.length;i++){

			try{
				var l_a = logs[i][1];
				var s = '';
				var cache = [];
				for(var j = 0;j< l_a.length;j++){
					s+=(s=='' ? '' : ',')+JSON.stringify(l_a[j],function(key, value) {
							if(key.startsWith('_')){
								return;
							}
							if (typeof value === 'object' && value !== null) {
					        if (cache.indexOf(value) !== -1) {
					            // Circular reference found, discard key
					            return;
					        }
					        // Store value in our collection
					        cache.push(value);
					    }
					    return value;
					});
				}
				cache = null;
				ret_logs.push([logs[i][0],s]);

			}catch(e){
				debugger;
			}

		}
		return ret_logs;
	};

	window.clearConsoleLog = function() {
		logs = [];
		if(log_div){
			log_div.remove();
			log_div = null;
		}
	}

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
				$(document.body).prepend('<div id="_log" style="-webkit-overflow-scrolling: touch;text-align:left;position:absolute;width:100%;height:100%;padding:1em;background-color:rgba(255,255,255,0.8);box-sizing:border-box;overflow-y:scroll;overflow-x:hidden;word-break:break-word;z-index:1000;color:black;">'
				+'<a href="#" class="_log_close" style="position:absolute;top:1rem;right:1rem;font-size:1rem;background:white;color:black;">close</a>'
				+'<a href="#" class="_log_reset" style="position:absolute;top:3rem;right:1rem;font-size:1rem;background:white;color:black;">reset</a>'
				+'<a href="#" class="_log_send" style="position:absolute;top:5rem;right:1rem;font-size:1rem;background:white;color:black;">send</a>'
				+'<a href="#" class="_log_info" style="position:absolute;top:7rem;right:1rem;font-size:1rem;background:white;color:black;">log info</a>'
				+'<a href="#" class="_log_server" style="position:absolute;top:9rem;right:1rem;font-size:1rem;background:white;color:black;">'+(app.server.match(/alpha/) ? 'alpha' : 'beta')+'</a>'
				+'<a href="#" class="_log_exitgame" style="position:absolute;top:11rem;right:1rem;font-size:1rem;background:white;color:black;">Exit game</a>'
				+'</div>');
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
				log_div.on('click','._log_server',function(e){
					var changed = false;
					if(app.server.match(/alpha/) && confirm('Use beta server?')){
						app.server = 'http://geogames.all2day.dk';
						changed = true;
					} else
					if(confirm('Use alpha server?')){
						app.server = 'http://alphagames.all2day.dk';
						changed = true;
					}

					if(changed){
						app.login();
						//app.showGames();
						app.exitGame();
						toggle_log();
					}
					e.preventDefault();return false;
				});
				log_div.on('click','._log_exitgame',function(e){
					toggle_log();
					app.exitGame();
					e.preventDefault();return false;
				});


				for(var i = 0;i < logs.length && i < 500 ;i++){
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
	window.toggle_log = toggle_log;
})();
