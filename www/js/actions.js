/**
 * Game engine actions
 */

 TreeObject.extend('Action',{
   type:'noop',
   init:function(obj){
   },
   do:function(){},
   traverseInputs:function(f){} //traverse all inputs
 });

Action.fromObject = function(obj,name){
  switch(obj.type){
    case 'set':
      return new SetAction(obj.target,obj.source);
    case 'vibrate':
      return new VibrateAction(obj.duration);
    case 'if':
      return new IfAction(obj.condition,obj.actions,obj.else);
    case 'remove':
      return new RemoveAction(obj);
    case 'add':
      return new AddAction(obj);
    case 'startphase':
      return new StartphaseAction(obj);
    case 'show':
      return new ShowAction(obj);
    default:
      var t = obj.type.toLowerCase().replace(/\b[a-z]/g, function(letter) {return letter.toUpperCase();})+'Action';
      var pt = (window || global)[t];
      if(pt){
        return new pt(obj,name);
      }
      console.log('unknown action type:'+obj.type);
      return new Action();
   }
 };

 Action.extend('ServerAction',{

 });

 ServerAction.extend('StartphaseAction',{
   phase:null,
   init:function(obj){
     this.phase = ScopeRef._prepareScopeRef('phases.'+obj.phase,Phase);
     this.phase.owner = this;
   },
   do:function(){
     var phase_var = this.phase.eval();
     var gs = ScopeRef._getGameState();
     if(phase_var && phase_var._value){
       console.log('starting phase',phase_var._name);
       gs.loadPhase(phase_var._name);
     } else {
       console.log('could not start unknown phase');
     }
   },
   traverseInputs:function(f){
     f(this.phase);
   }
 });

 ServerAction.extend('ExitAction',{
   init:function(obj){

   },
   do:function(){
     var gs = ScopeRef._getGameState();
     gs.removePlayer(gs.currentPlayer);
   }
 });

 ServerAction.extend('RemoveAction',{
   target:null,
   list:null,
   init:function(obj){
     this.list = ScopeRef._prepareScopeRef(obj.list);
     this.list.owner = this;
     this.target = ScopeRef._prepareScopeRef(obj.target);
     this.target.owner = this;
   },
   do:function(){
     var target_var = this.target.eval();
     var list_var = this.list.eval();

     if(list_var instanceof ListVariable && target_var){
       list_var.remove(target_var);
     }
   },
   traverseInputs:function(f){
     f(this.list);
     f(this.target);
   }
 });

 ServerAction.extend('AddAction',{
   target:null,
   list:null,
   init:function(obj){
     if(!obj.list || !obj.target){
       console.log('warning add action without list or target');
     }
     this.list = ScopeRef._prepareScopeRef(obj.list,ListVariable);
     this.list.owner = this;
     /*TODO: add list prototype as required type*/
     this.target = ScopeRef._prepareScopeRef(obj.target);
     this.target.owner = this;
   },
   do:function(){
     var list_var = this.list.eval();
     var target_var = this.target.eval();


     if(list_var instanceof ListVariable){
       if(target_var){
         list_var.add(target_var);
       } else {
         console.log('nothing to add');
       }
     } else {
       debugger;
       console.log('could not find list');
     }
   },
   traverseInputs:function(f){
     f(this.list);
     f(this.target);
   }
 });

 ServerAction.extend('ShuffleAction',{
   list:null,
   init:function(obj){
     this.list = ScopeRef._prepareScopeRef(obj.list,ListVariable);
     this.list.owner = this;
   },
   do:function(){
     var list_var = this.list.eval();

     if(list_var instanceof ListVariable){
       list_var.shuffle();
     }
   },
   traverseInputs:function(f){
     f(this.list);
   }
 });


 ServerAction.extend('StopAction',{
   timer:null,
   init:function(obj){
     this.timer = ScopeRef._prepareScopeRef(obj.timer,TimerVariable);
     this.timer.owner = this;
   },
   do:function(){
     var timer_var = this.timer.eval();

     if(timer_var instanceof TimerVariable){
       timer_var.stop();
     }
   },
   traverseInputs:function(f){
     f(this.timer);
   }
 });
 ServerAction.extend('ResetAction',{
   timer:null,
   init:function(obj){
     this.timer = ScopeRef._prepareScopeRef(obj.timer,TimerVariable);
     this.timer.owner = this;
   },
   do:function(){
     var timer_var = this.timer.eval();

     if(timer_var instanceof TimerVariable){
       timer_var.reset();
     }
   },
   traverseInputs:function(f){
     f(this.timer);
   }
 });



 ServerAction.extend('SetAction',{
   src:null,
   target:null,
   init:function(target,src){
     this.src = ScopeRef._prepareScopeRef(src);
     this.target = ScopeRef._prepareScopeRef(target);
     this.src.owner =this;
     this.target.owner = this;
   },
   do:function(){
     var target_var = this.target.eval();
     if(target_var){
       var src_var = this.src.eval();
       if(src_var === null){
         console.log('setting to null');
       }

       target_var.set(src_var);
     } else {
       console.log('could not find target');
     }
   },
   traverseInputs:function(f){
     f(this.src);
     f(this.target);
   }
 });

 ServerAction.extend('StartAction',{
   timer:null,
   init:function(obj){
     if(!obj.timer){
       console.log('timer must be defined');
     }
     this.timer = ScopeRef._prepareScopeRef(obj.timer,TimerVariable);
     this.timer.owner =this;
   },
   do:function(){
     //console.log('start action');
     var timer_var = this.timer.eval();
     if(timer_var){
       timer_var.start();
     } else {
       debugger;
       console.log('could not find timer');
     }
   },
   traverseInputs:function(f){
     f(this.timer);
   }
 });

 ServerAction.extend('CreateAction',{
   prototype:null,
   actions:null,
   target:null,
   init:function(obj){
     this.target = ScopeRef._prepareScopeRef(obj.target);
     this.prototype = ProtoType.prototypes[obj.prototype];
     this.actions = [];

     var new_obj = this.prototype.create();
     new_obj._name = this.prototype._name;
     ScopeRef._pushScope(new_obj);

     var that = this;
     $.each(obj.actions,function(i,a){
       var new_a = Action.fromObject(a,i);
       new_a.owner = that;
       that.actions.push(new_a);
     });
     ScopeRef._popScope();
   },
   do:function(){
     //console.log('creating:'+this.prototype._name);
     var new_obj = this.prototype.create();
     new_obj._name = this.prototype._name;
     ScopeRef._pushScope(new_obj);
     for(var i=0;i<this.actions.length;i++){
       this.actions[i].do();
     }
     ScopeRef._popScope();

     //add to target
     var target_var = this.target.eval();
     if(target_var instanceof ProtoTypeVariable){
       target_var.set(new_obj);
     } else
     if(target_var instanceof ListVariable){
       target_var.add(new_obj);
     }
   },
   traverseInputs:function(f){
     f(this.target);
     for(var i=0;i<this.actions.length;i++){
       this.actions[i].traverseInputs(f);
     }
   }
 });


 Action.extend('AlertAction',{
   text:null,
   init:function(obj){
     this.text = ScopeRef._prepareScopeRef(obj.text);
     this.text.owner = this;
   },
   do:function(){
     var text_var = this.text.eval();
     if(text_var instanceof Variable){
       text_var = text_var._value;
     }
     if((window || global).alert){
       alert(text_var);
     } else {
       console.log(text_var);
     }
   },traverseInputs:function(f){
     f(this.text);
   }
 });

 Action.extend('VibrateAction',{
   duration:null,
   init:function(duration){
     this.duration = ScopeRef._prepareScopeRef(duration);
     this.duration.owner = this;
   },
   do:function(scope){
     var d = this.duration ? (this.duration.eval() || 300) : 300;
     if((global || window).navigator && navigator.vibrate){
        navigator.vibrate(d);
        console.log('vibrating...' + (d));
     } else {
       console.log('no vibration:vvvvvviiiiibbbbrrraaattteee');
     }

   },traverseInputs:function(f){
     f(this.duration);
   }
 });

 Action.extend('IfAction',{
   actions:null,
   else:null,
   condition:null,
   init:function(condition,actions,elsevar){
     this.condition = ScopeRef._prepareScopeRef(condition);
     this.else = [];
     this.actions = [];
     var that = this;
     $.each(actions,function(i,a){
       var new_a = Action.fromObject(a,i);
       new_a.owner = that;
       that.actions.push(new_a);

     });
     $.each(elsevar||[],function(i,a){
       var new_a = Action.fromObject(a,i);
       new_a.owner = that;
       that.else.push(new_a);
     });
   },
   do:function(){
     var to_do;
     if(this.condition.eval()){
       to_do = this.actions;
     } else {
       to_do = this.else;
     }

     for(var i=0;i<to_do.length;i++){
       to_do[i].do();
     }
   },
   hasServerActions:function(){
     for(var i=0;i<this.actions.length;i++){
       if(this.actions[i] instanceof ServerAction || this.actions[i].hasServerActions && this.actions[i].hasServerActions()){
         return true;
       }
     }
     for(var i=0;i<this.else.length;i++){
       if(this.else[i] instanceof ServerAction || this.else[i].hasServerActions && this.else[i].hasServerActions()){
         return true;
       }
     }
     return false;
   },traverseInputs:function(f){
     f(this.condition);
     for(var i=0;i<this.actions.length;i++){
       this.actions[i].traverseInputs(f);
     }
     for(var i=0;i<this.else.length;i++){
       this.actions[i].traverseInputs(f);
     }
   }
 });

Action.extend('ShowAction',{
   view:null,
   init:function(obj){
     this.view = ScopeRef._prepareScopeRef('views.'+obj.view,ViewElement);
   },
   do:function(scp){
     var view_var = this.view.eval();
     //TODO:show it
   },
   traverseInputs:function(f){
     f(this.view);
   }
 });

Action.extend('HideAction',{
   view:null,
   init:function(obj){
     this.view = ScopeRef._prepareScopeRef('views.'+obj.view,ViewElement);
   },
   do:function(){
     var view_var = this.view.eval();
     //TODO:hide it
   },
   traverseInputs:function(f){
     f(this.view);
   }
 });

Action.extend('RepeatAction',{
  actions:null,
  times:null,
  init:function(obj){
    this.actions = [];
    this.times = ScopeRef._prepareScopeRef(obj.times,Variable);

    var that = this;
    $.each(obj.actions,function(i,a){
      var new_a = Action.fromObject(a,i);
      new_a.owner = that;
      that.actions.push(new_a);
    });
  },
  do:function(){
    var times_var = this.times.eval();

    for(var j=0;j<times_var._value;j++){
      for(var i=0;i<this.actions.length;i++){
        this.actions[i].do();
      }
    }
  },
  hasServerActions:function(){
    for(var i=0;i<this.actions.length;i++){
      if(this.actions[i] instanceof ServerAction || this.actions[i].hasServerActions && this.actions[i].hasServerActions()){
        return true;
      }
    }
    return false;
  },
  traverseInputs:function(f){
    f(this.times);
    for(var i=0;i<this.actions.length;i++){
      this.actions[i].traverseInputs(f);
    }
  }
});

Action.extend('EachAction',{
   actions:null,
   list:null,
   _name:null,
   init:function(obj,name){
     this.actions = [];
     this._name = name;

     var gso = new GameStateObject({});
     if(this._name){
       gso._name = this._name;
       ScopeRef._pushScope(gso);
     }
     var that = this;
     $.each(obj.actions,function(i,a){
       var new_a = Action.fromObject(a,i);
       new_a.owner = that;
       that.actions.push(new_a);
     });
     if(this._name){
       ScopeRef._popScope();
     }

     this.list = ScopeRef._prepareScopeRef(obj.list,[ListVariable,GameStateList]);
   },
   do:function(){
     var list_var = this.list.eval();

     var gso = new GameStateObject({});


     if(this._name){
       //console.log('setting named loop:'+this._name);
       gso._name = this._name;
       ScopeRef._pushScope(gso);
     }
     if(list_var instanceof GameStateList){
       var that = this;
       var j = 0;
       $.each(list_var._value,function(k,v){
         for(var i=0;i<that.actions.length;i++){
           gso.el = v;
           gso.index = j;
           ScopeRef._pushScope(v);
           that.actions[i].do();
           ScopeRef._popScope();
         }
         j++;
       });
     } else if (list_var instanceof ListVariable) {
       var that = this;
       var j = 0;
       $.each(list_var._value,function(k,v){
         for(var i=0;i<that.actions.length;i++){
           gso.el = v;
           gso.index = j;
           ScopeRef._pushScope(v);
           that.actions[i].do();
           ScopeRef._popScope();
         }
         j++;
       });
     }
     if(this._name){
       ScopeRef._popScope();
     }

   },
   hasServerActions:function(){
     for(var i=0;i<this.actions.length;i++){
       if(this.actions[i] instanceof ServerAction || this.actions[i].hasServerActions && this.actions[i].hasServerActions()){
         return true;
       }
     }
     return false;
   },
   traverseInputs:function(f){
     f(this.list);
     for(var i=0;i<this.actions.length;i++){
       this.actions[i].traverseInputs(f);
     }
   }
 });


/**
Lookups:
- push user variable on server trigger of hooks
- push extra level in loops, create etc.
- fast access to special entries, fx. view. phase. player. etc.
- prototype hooks should set the scope to be that object, but not at specific point in the tree, thus traversing will not go to gamestate.

Currently, evaluates on the scope ref using the action as the entry point. Perhaps, it should be set statically by the hook trigger function.
When encountering a new scope, it can be pushed and poped as a fifo list. When triggering client hook on the server the variables can be set
directly on the hook as a variable available using "get" function.

Gamestate should set itself as the grant root when set.



phase - direct entry to currentPhase
phase.something - the something variable of phase

phase.something.var2 - if something is a prototype, it can be further indexed

view - direct entry to current view
views.fisk - named view

player - direct entry to current player. Can only be used in client hooks and must be passed when triggering remotely
players - direct entry to all players

timer - refer to the timer firering this hook

hook - refers to the hook

game - refers to the game
game.colors - game variable

element - direct entry to current element - in client hooks

if not matching any of this it will try to find a variable named like this in the tree.

When looping through a list{
  list.el - refers to the current element in the list
  TODO: named list?
}

TODO: what if there is nested objects? That is an prototype called fisk that has a var called fisk which is a fisk? When a timer goes of inside a fisk object having being the X of
fisk having an internal fisk as well, fisk could both refer to the variable fisk, or the object fisk or a parent fisk. One solution would be to disallow a prototype name as a
variable name, but that is a shame as it is often the right name to use. There is a general tendency to make a solution fit for the text version of the game, but perhaps it would be
better to have somehing complex to write, but easy to digest?


*/
