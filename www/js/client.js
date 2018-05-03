require('./gamestate');

Class.extend('GameClient',{
  gs:null,
  server:null,
  time_offset: 0,
  min_send_frequency:200,
  game_id:null,
  instance_id:null,
  token:null,
  remoteTriggerQueue:null,//{nextId:1}, //using integers for indexing
  currentPhase:null,
  init:function(gameobject,token, instance_id){
    this.instance_id = instance_id;
    //debugger;
    this.remoteTriggerQueue = [];
    this.token = token;
    //read the gameobject and create a game state



    this.gs = new GameState(gameobject);

    //register time function
    this.gs.getTime = this.getServerTime.bind(this);

    //this.gs.getFullState();

    this.gs.currentPhase.addHook('change',function(){
      if(this.currentPhase){

        console.log('unloading phase:'+this.currentPhase._name);
        //if there is an existing phase handle it
        this.currentPhase.unload();
        this.currentPhase.triggerHook('end');
        var view_name = this.currentPhase.views.firstKey();
        var view = this.currentPhase.views[view_name];

        view._dom.hide(); //hide the dom of the phase
        view.destroy();
      }

      this.currentPhase = this.gs.currentPhase._value;
      console.log('loading phase:'+this.currentPhase._name);




      this.gs.currentPhase.load();
      //get the first view
      var view_name = this.gs.currentPhase.views.firstKey();
      var view = this.gs.currentPhase.views[view_name];

      //debugger;
      //console.log('setting client hooks');
      this.gs.clientHooks = [];
      this.gs.currentPhase.getClientHooks(this.gs.clientHooks);

      console.log(this.gs.clientHooks);

      if(view._dom){
        view._dom.show(); //if hidden ensure that it is shown
      }
      view.draw($(document.body));

    }.bind(this));


    //keep track of the players and warn the current player if another player exits while playing
    this.gs.players.addHook('change',function(){
      if(this.gs.currentPhase && this.gs.currentPhase._name == 'play'){
        app.openModal('Player quit','<p>Another player quit the game.</p>',{
          'Continue':function(){return false;}
        });
      }
      console.log('players changed, current phase:',this.gs.currentPhase ? this.gs.currentPhase._name : 'no current phase');
    }.bind(this));
    this.go = gameobject;
  },
  exit:function(){
    console.log('client exit')
    this.status = 'exited';

    if(typeof this.ping ==="object"){
      console.log('aborting ping');
      this.ping.abort();
    } else {
      console.log('clearing ping timeout');
      clearTimeout(this.ping)
    }


    //clean up
    Variable._nextId = 1;
    Variable._vars = {};
    Hookable._triggerQueue = [];
    Hookable._nextHookId = 1;
    ProtoType.prototypes = {};
    console.log('Cleanup done');
    //this.init(this.go,'',2);
  },

  getServerTime: function(){
    return new Date().getTime() + this.time_offset;
  },
  gsUpdate:function(update){
    //apply the update to the game state

    //1. go through the list of updates and register new variables
    $.each(update,function(id,u){
      if(u.type){
        Variable.fromUpdate(id,u);
      }
    });

    $.each(update,function(id,u){
      if(u.type){
        Variable.fromUpdate(id,u);
      }
    });
  },
  fullUpdate:function(update){
    if(this.status == 'exited'){
      console.log('got fullupdate while exited?');
      return;
    }
    //first go is simply to check the existance of all the variables
    var new_vars = 0;
    $.each(update,function(id,u){
      if(Variable._vars[id] === undefined){

        if(window._watch && window._watch.indexOf(id*1) >= 0){ debugger;}
        new_vars++;
        Variable._nextId = id;
        var val = u.value;
        delete u.value;
        var v = Variable.fromObject(u);
        if(!v){
          debugger;
        }
        if(val !== undefined){
          u.value =val;
        }
      }
    });

    if(new_vars){
      console.log('added '+new_vars+' new vars in fullUpdate, total is:'+(Variable._nextId +1));
    }

    //TODO:Make sure that client variables dont fill up the variable index space
    var p = this.gs.currentPlayer;

    //set the value of all variables
    $.each(update,function(id,u){
      //if(id==12 && u.value.length != window.last_v){window.last_v = u.value.length;debugger;}
      //if(id==48 && ScopeRef._gs.players && ScopeRef._gs.players.mads1 && ScopeRef._gs.players.mads1._p === null){ debugger;};
      if(window._watch && window._watch.indexOf(id*1) >= 0){ debugger;}

      //ignore client based vars on this player when updating
      if(p && Variable._vars[id] && Variable._vars[id]._owner == p){
        return;
      }
      /*if(p && id == p.pos._id){
        debugger;
        return; //ignore updates of position
      }*/

      if(u.p){
        //TODO: check how it will work if setting pointer to object as it defines its own set method
        Variable._vars[id].set(Variable._vars[u.p]);
      } else
      if($.type(u.value) == 'object'){ //used for pointer objects and compound data
        if(Variable._vars[id]._value == null){
          Variable._vars[id]._value = {};
        }
        if(Variable._vars[id] instanceof PosVariable){
          Variable._vars[id].set(u.value);
        } else if(Variable._vars[id] instanceof TimerVariable){
          Variable._vars[id].set(u.value);
        } else if(Variable._vars[id] instanceof ProtoTypeVariable){
          Variable._vars[id].set(u.value);
        } else {
          var old_keys = Object.keys(Variable._vars[id]._value);

          $.each(u.value,function(n,p){

            old_keys.remove(n);
            if(Variable._vars[id]._value[n] === undefined){
              //new variable, use the adder function
              Variable._vars[id].add(n,Variable._vars[p]);
            } else {
              //existing variable, set using the set function
              //Variable._vars[id]._value[n] = Variable._vars[p];
              Variable._vars[id].set(n,Variable._vars[p]);
            }
          });
          //add cleanup removing nonexisting entries
          $.each(old_keys,function(i,n){
            Variable._vars[id].remove(n);
          });
        }
      } else
      if($.type(u.value) == 'array'){
        if(Variable._vars[id]._value == null){
          Variable._vars[id]._value = [];
        }
        var max_i = -1;
        //go through the update and change
        $.each(u.value,function(i,p){
          if(i == Variable._vars[id]._value.length){
            Variable._vars[id].add(Variable._vars[p]);
          } else {
            Variable._vars[id].set(i,Variable._vars[p]);
          }
          max_i = Math.max(max_i,i);
        });
        //remove extra values if any and trigger change if necessary
        if(max_i < Variable._vars[id]._value.length-1){
          Variable._vars[id]._value = Variable._vars[id]._value.slice(0,max_i+1);
          Variable._vars[id].triggerHook('change');
        }

      } else {
        Variable._vars[id].set(u.value);
        //Variable._vars[id]._value = null;
      }

      if(this.status == 'exited'){

        return false;//dont continue
      }
    }.bind(this));

    if(this.status == 'exited'){
      return false;//dont continue
    }

    //if first time update the current player in gs
    if(!this.gs.currentPlayer){
      this.gs.currentPlayer = this.gs.players.get(this.token);
      if(!this.gs.currentPlayer){
        alert('no such player');
        app.exitGame();
        return;
      }
      if(this.pos){
        this.gs.currentPlayer.updatePosition(this.pos);
      }

    }

    //Trigger hooks affected by the update
    Hookable._handleTriggerQueue();
  },
  updatePosition:function(pos){
    this.pos = pos;
    if(this.gs && this.gs.currentPlayer){

      this.gs.currentPlayer.updatePosition(pos);
      //Trigger hooks affected by the changed position
      Hookable._handleTriggerQueue();
    } else {
      console.log('got client update of position but no player to add it to');

    }
  },
  startPinging:function(){
    //console.log('starting ping');

    var d = {
      token:this.token
    };

    if(this.remoteTriggerQueue.length){
      console.log('adding remote triggers');
      d.rt = this.remoteTriggerQueue;
      this.remoteTriggerQueue = [];

    }

    if(this.gs.currentPlayer /*&& this.gs.currentPlayer.pos._value*/){

      d.p = this.gs.currentPlayer._getClientVars();
      //d.p = this.gs.currentPlayer.pos._value;
      //debugger;
      //console.log(d.p);
    }

    /*$.each(this.remoteTriggerQueue,function(i,h){
      //TODO: register the remote trigger
    });*/

    var t = new Date().getTime();
    this.ping = $.ajax({
      dataType: "json",
      url: this.server+'/ping?'+JSON.stringify(d),
      success: function(r){
        if(this.status == "exited"){
          console.log('recieved update after exit ignoring');
          return;
        }
        if(this.game_id === null){
          console.log('setting game_id to:',r.game_id);
          this.game_id = r.game_id;
        }
        if(r.game_id != this.game_id){
          window.location.reload();
        }
        if(r.res=='error'){
          app.exitGame();

          app.openModal('Error',r.error,{'close':function(){}});
          return;
        }

        var this_t = new Date().getTime();
        if(!app._pingHist){
          app._pingHist = [];
        }
        app._pingHist.push(this_t-t);

        this.fullUpdate(r.u);
        //in case the full update results in an exit, dont restart the pinging
        if(this.status == 'exited'){
          return;
        }
        //console.log('got update');

        var time_offset = (this_t - t - r.rt)/2 + r.t + r.rt - this_t;
        this.time_offset = Math.round(0.9*this.time_offset + 0.1*time_offset);

        //console.log('next ping in:',this.min_send_frequency - (this_t-t));

        this.ping = setTimeout(this.startPinging.bind(this),Math.max(0,this.min_send_frequency - (this_t-t)));

        //console.log('ping:',this_t-t);
        this.gs.currentPlayer.ping.set((this_t-t));
      }.bind(this),
      error:function(r,status,error) {
        if(status == 'abort'){
          return;
        }
        //debugger;
        console.log('status:'+status+' error:'+error);
        //alert(error);
        if(this.status == 'exited'){
          return;
        }
        if(this.gs && this.gs.currentPlayer){
          this.gs.currentPlayer.ping.set(100000); //large number
        }

        this.ping = setTimeout(this.startPinging.bind(this),1000);
      }.bind(this),
      timeout:2000
    });
  },
  registerRemoteTrigger: function(hook,vars){
    var hook_id = null;

    if(!this.gs.clientHooks || this.gs.clientHooks.length === undefined){
      debugger;
      console.log('clientHooks missing',hook,vars);
      if(hook){
        var h = hook
        var i = 0;
        while(h && i < 10){
          console.log('hook['+i+']:',h._name, h.__proto__.constructor.name);
          h = h._owner;
          i++;
        }
        console.log('hook name:',hook._name, hook._owner ? hook._owner.__proto__.constructor.name : 'no hook._owner', hook._owner._owner ? hook._owner._owner.__proto__.constructor.name : 'no hook._owner._owner');
      }
      console.log('gamestate is:',this.gs);
      console.log('currenphase is:',this.currentPhase,this.currentPhase ? this.currentPhase._name : 'not set');
      console.log('instance_id is:',this.instance_id);
      console.log('this.status is:',this.status);

      alert('game crashed, exiting');

      app.exitGame();
      return;

    }

    for(var i=0;i< this.gs.clientHooks.length;i++){
      if(hook == this.gs.clientHooks[i]){
        hook_id = i;
        break;
      }
    }
    if(hook_id === null){
      console.log('could not find client hook?');

      if(hook){
        var h = hook
        var i = 0;
        while(h && i < 10){
          console.log('hook['+i+']:',h._name, h.__proto__.constructor.name);
          h = h._owner;
          i++;
        }
        console.log('hook name:',hook._name, hook._owner ? hook._owner.__proto__.constructor.name : 'no hook._owner', hook._owner._owner ? hook._owner._owner.__proto__.constructor.name : 'no hook._owner._owner');
      }
      console.log('gamestate is:',this.gs);
      console.log('currenphase is:',this.currentPhase,this.currentPhase ? this.currentPhase._name : 'not set');
      console.log('instance_id is:',this.instance_id);
      console.log('this.status is:',this.status);

      return;
    }

    //add to remote trigger queue
    this.remoteTriggerQueue.push({
      t:this.getServerTime(),
      h:hook_id,
      v:vars
    });
    //dont wait for the next ping, send right away or wait a bit for the current ping to get back and then send
    //TODO:direct triggering
  },
  /**
   * Trigger volume up
   */
  triggerVolumeUp: function(){
    //debugger;
    this.gs.currentPlayer.triggerHook('volumeup');
    Hookable._handleTriggerQueue();
  },
});
