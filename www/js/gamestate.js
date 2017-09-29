require('./scoperef');
require('./actions');
require('./view');


Hookable.extend('Variable',{
  _value:null, //the value, can be either a primitive or an object or array
  _id:null, //The id of the variable
  _p:null, //The pointer if any
  _type:'var', //Type of the variable
  init:function(obj){
    this._super(obj);
    //this.set(val);
    Variable._registerVar(this);
  },
  set:function(val){ //Val can either be a primitive or a variable
    if(val instanceof PrimitiveVariable){
      val = val._value;
    } else
    if(val instanceof Variable){
      this._p = val._id;
      val = val._value;
    }

    if(this._value != val){
      this.triggerHook('change');
      var that = this;
      /*if(ScopeRef._gs && ScopeRef._gs.players){
        $.each(ScopeRef._gs.players._value,function(k,p){
          p.addChange(that,val);
        });
      }*/
    }

    this._value = val;
  },
  get:function(ref){
    if(this[ref] !== undefined){
      return this[ref];
    }
  },
  clone:function(id){
    //var v = new this.prototype();
    //v.prototype = this.prototype;
    v = Object.create(this.__proto__);
    Object.assign(v,this);

    Variable._registerVar(v,id);

    //TODO: clone hooks?


    return v;
  },
  getObject:function(){
    /*if(this._value instanceof Variable){
      return this._value.getObject();
    }*/
    return this._value;
  }
});

Variable._nextId = 1;
Variable._vars = {};
Variable._registerVar = function(v,id){
  // Client elements should not be a part of what is transfered and thus not registered
  if(v instanceof ClientElement){
    return;
  }
  //GamestatList that are not changeable should be the same on the client and thus not transfered
  if(v instanceof GameStateList && !(v instanceof GameStateChangeableList)){
    return;
  }

  if(id){
    v._id = id;
  } else {
    v._id = Variable._nextId++;
  }

  Variable._vars[v._id] = v;
};
Variable.fromObject = function(obj){
  if($.type(obj) == 'number'){
    return new NumberVariable(obj);
  }
  if($.type(obj) == 'string'){
    return new PrimitiveVariable(obj);
  }
  switch(obj.type|| 'none'){
    case 'list':
      return new ListVariable(obj);
    case 'val':
    case 'string':
      return new PrimitiveVariable(obj.value);
    case 'number':
      return new NumberVariable(obj.value);
    case 'phase':
      return new Phase();
    case 'pos':
      return new PosVariable(obj);
    case 'timer':
      return new TimerVariable(obj);
    case 'bool':
      return new BoolVariable(obj);
    case 'pointer':
      return new PointerVariable(obj);
    case 'player':
      return new Player(ProtoType.prototypes["player"],obj);
    default:
      //lookup in prototypes
      if(ProtoType.prototypes[obj.type]){
        return new ProtoTypeVariable(ProtoType.prototypes[obj.type],obj.value);
      } else {
        console.log('unknown variable type:'+obj.type);
      }
  }
}
Variable.fromUpdate = function(id,u){
  Variable._nextId = id;
  var v = Variable.fromObject({type:u.type});
  if(u.value){
    switch(u.type){
      case 'list':
        break;
    }
  }
};

Variable.extend('PointerVariable',{
  _type:'pointer',

  set:function(val){
    if(val === this._value){
      return;
    }

    var that = this;
    //if val is changed, remove all functions again
    if(this._value){
      $.each(this._value,function(n,f){
        if(n=='set' || n.match(/^\_.*/)  && n != '_name' || n=='addHook' || n=='triggerHook'){
          return;
        }
        //console.log(n,$.type(f));
        delete(that[n]);
      });
    }
    //console.log(val.vars);
    this._value = val;
    /*var keys = Object.getOwnPropertyNames(val);

    for (var n in keys) {
      console.log(keys[n],$.type(val[keys[n]]));
    }
    return;*/

    if(val){
      $.each(val,function(n,f){
        if(n=='set' || n.match(/^\_.*/) && n != '_name' || n=='addHook' || n=='triggerHook'){
          return;
        }
        //console.log(n,$.type(f));
        if($.type(f) == 'function'){
          that[n] = function(){
            //console.log(''+n+' called with ',arguments);
            return f.apply(val,arguments);
          }
        } else {
          Object.defineProperty(that,n,{
            enumerable:true,
            configurable:true,
            get:function(){return that._value[n];},
            set:function(x){that._value[n] = x;that._value.triggerHook('change');}
          });
        }
      });


    }

    this.triggerHook('change');
  },
  triggerHook:function(type){
    if(type != 'change' && this._value){
      return this._value.triggerHook(type);
    }
    this._super(type);
  }
});

Variable.extend('PrimitiveVariable',{
  _type:'val',
  init:function(val){
    if(val && val.hooks){
      this._super(val);
    } else {
      this._super();
    }

    if(val !== undefined){
      this.set(val);
    }
  }
});

PrimitiveVariable.extend('NumberVariable',{
  _type:'number',
  set:function(val){
    if(val instanceof PrimitiveVariable){
      val = val._value;
    }
    if($.type(val) == 'string'){
      val = val*1;
    }
    this._super(val);
  }
});

PrimitiveVariable.extend('BoolVariable',{
  _type:'bool',
  init:function(value){
    this._super();
    if(value!==undefined){
      if(value instanceof Variable){
        value = Variable._value;
      }
      this.set(value);
    }
  }
});

PrimitiveVariable.extend('PosVariable',{
  _type:'pos',
  init:function(value){

    this._value = {//TODO: decide on a pos format and method
      x:null,
      y:null,
      heading:null
    };

    this._super(value);
  },
  set:function(val){
    if(val instanceof PosVariable){
      val = val._value;
    }
    var changed = false;

    if($.type(val) == 'object'){

      if(this._value.x != val.x || this._value.y != val.y || this._value.heading != val.heading){
        changed = true;
      }
      this._value.x = val.x;
      this._value.y = val.y;
      this._value.heading = val.heading;
    }
    if(changed){
      this.triggerHook('change');
    }
  },
  clone:function(){
    var c = this._super();
    c._value = Object.assign({},this._value);

    return c;
  }
});

Variable.extend('ListVariable',{
  _type:'list',
  prototype:null,
  init:function(obj){
    this._super();
    this._value = [];
    this.prototype = obj.prototype;
    //test the type by creating a test object
    /*if(this.prototype){
      Variable.fromObject({type:this.prototype});
    }*/
    var that = this;
    if(obj.els){
      $.each(obj.els,function(key,val){
        that.add(Variable.fromObject(val));
      })
    }
  },
  add:function(v){
    //check prototype of v
    //TODO: add check for prototype
    if(!v){
      console.log('not prototype or not the correct type');
      return;
    }

    while(v._p){
      v = Variable._vars[v._p];
    }
    this._value.push(v);

    /*var ids = [];
    for(var t = 0;t<this._value.length;t++){
      ids.push(this._value[t]._id);
    }
    console.log('after add in list['+this._id+'] is:',ids);
    */
    this.triggerHook('change');

  },
  remove:function(v){
    //check prototype of v
    if(!v){
      console.log('not prototype or not the correct type');
      return;
    }

    while(v._p){
      v = Variable._vars[v._p];
    }

    var i = this._value.indexOf(v);
    //console.log('removing['+this._id+']:'+v._id);
    if(i < 0){
      console.log('could not find object to remove from list['+this._id+']:',v._id);
      var ids =[];
      for(var t = 0;t<this._value.length;t++){
        ids.push(this._value[t]._id);
      }
      console.log('in list is:',ids);

      return;
    }

    //console.log('length before remove '+this._value.length);
    this._value.remove(v);

    /*var ids =[];
    for(var t = 0;t<this._value.length;t++){
      ids.push(this._value[t]._id);
    }
    console.log('after remove in list['+this._id+'] is:',ids);
    */


    //console.log('length after remove '+this._value.length);
    //console.log(this.getObject());

    this.triggerHook('change');
  },
  clone:function(){
    var v = this._super();
    var value = [];
    for(var i=0;i<this._value.length;i++){
      value.push(this._value.clone());
    }
    v._value = value;
    return v;
  },
  set:function(i,v){
    if(i instanceof Variable || i === null){
      return this._super(i);
    }
    if(!this._value){
      this._value = [];
    }
    if(i > this._value.length-1){
      console.log('cannot set i in list');
      return;
    }
    while(v._p){
      v = Variable._vars[v._p];
    }
    this._value[i] = v;
  },
  get:function(ref){
    switch(ref){
      case 'first':
        return this._value[0];
      case 'last':
        return this._value[this._value.length-1];
      case 'shuffle':
        var c = new ListVariable(this);
        c._value.shuffle();
        return c;
      case 'any':
        return this._value[Math.floor(Math.random()*this._value.length)];
      case 'pop':
        var el = this._value.pop();
        this.triggerHook('change');
        return el;
      case 'count':
        return this._value.length;//new Variable(this._value.length);
      default:
        console.log('unknown List ref:`'+ref+'`');
    }
    return null;
  },
  shuffle:function(){
    this._value.shuffle();
    this.triggerHook('change');
    /*var that = this;
    $.each(ScopeRef._gs.players._value,function(k,p){
      p.addChange(that,that._value);
    });*/
  },
  getObject:function(){
    var a = [];
    $.each(this._value,function(k,v){
      a.push(v.getObject());
    });
    return a;
  }
});

//timer
Variable.extend('TimerVariable',{
  _type:'timer',
  start_time:0,
  duration:0,
  duration_src:null,
  init: function(obj){
    this._super(obj);
    this.fromObject(obj);
  },
  fromObject: function(obj){
    //digest the object

    this.duration = ScopeRef._evalString(obj.duration).value;
    this.duration_src = obj.duration;

    this._super(obj);
    this._value = {
      duration:this.duration,
      status:null,
      start_time:0
    };
  },
  start: function(){
    //console.log('timer with id '+this._id+' started');
    this.triggerHook('start');
    var that = this;
    this.start_time = ScopeRef._gs.getTime();

    this._value.status = 'started';
    this._value.start_time = this.start_time;

    this.duration = ScopeRef._evalString(this.duration_src).value;
    this._value.duration = this.duration;
    //register this timer on the current phase
    ScopeRef._getGameState().currentPhase.registerTimer(this);
    this._timeout = setTimeout(function(){
      ScopeRef._getGameState().currentPhase.deregisterTimer(this);
      //console.log('timer ended');
      that._value.status = 'ended';
      that.triggerHook('end');
      //this happens outside normal tick time, thus trigger manually
      Hookable._handleTriggerQueue();
    },this.duration);

    this.triggerHook('change');
  },
  stop: function(){
    ScopeRef._getGameState().currentPhase.deregisterTimer(this);
    clearTimeout(this._timeout);
    this._value.status = 'stopped';
    this.triggerHook('stop');
    this.triggerHook('change');
  },
  reset: function(){
    this.triggerHook('change');
  },
  _stop: function(){ //Internal stop
    clearTimeout(this._timeout);
    this._value = null;
  },
  set:function(val){

    var old_val = this._value;
    this._value = val;
    if(old_val !== null && val !== null){
      if(old_val.duration != val.duration || old_val.status != val.status || old_val.start_time != val.start_time){
        //console.log('timer change');
        this.triggerHook('change');
      }

      //Removed 2017-09-26 - set of timer only used on client, why the need to register/deregister timer?
      //All timers will be triggered continously while animating, thus this is necessary.
      //The problem is that the timer may be created before the current phase is set
      //Which we need to look into
      if(old_val.status != val.status && ScopeRef._getGameState().currentPhase._value){
        if(val.status == 'started'){
          ScopeRef._getGameState().currentPhase.registerTimer(this);
        } else {
          ScopeRef._getGameState().currentPhase.deregisterTimer(this);
        }
      }


    } else if(val !== old_val){
      this.triggerHook('change');
    }
    //this._super(val);
    //console.log('setting timer to:'+val + 'r:'+this.get('ratioDone')+' d:'+this._value.duration);
  },
  clone: function(){
    //when cloning a timer, all hooks must be cloned as well
    var v = this._super();
    console.log('cloning timer');
    v._hooks = new GameStateList();
    $.each(this._hooks._value, function(ht,hs){
      var v_hs = new GameStateList();
      $.each(hs._value,function(n,h){
        v_hs.add(n,h.clone());
      });
      v._hooks.add(ht,v_hs);
    });
    //copy the value
    v._value = Object.assign({},this._value);

    return v;
  },
  get:function(ref){

    switch(ref){
      case 'ratioDone': //between 0 and 1
        if(!this._value || this._value.status != 'started') return 0;
        var t = ScopeRef._gs.getTime();

        return Math.min(1,(t - this._value.start_time)/this._value.duration);
      case 'duration':
        return this._value === null ? Infinity : this._value.duration;
    }
  }
});




/************************
 * START OF GAME STATE
 ************************/


Variable.extend('GameStateObject',{
  _type:'object',
  _name:null, //The name given to this object in its parent
  init:function(inp,type){
    this._super();
    this.fromObject(inp,type);
  },
  fromObject(inp,type){
    this._super(inp);
    /*if(!inp){return;}
    var that = this;
    that.hooks = new GameStateList();
    that.hooks.owner = this;
    debugger;
    $.each(inp.hooks || {},function(k,h){
      that.hooks.add(k,new GameStateList(h,Hook))
    })*/
  },
  get:function(ref){
    if(this[ref] !== undefined){
      return this[ref];
    }
    if(this.vars){
      return this.vars.get(ref);
    }
    return null;
  },
  getObject:function(){
    var o = {};
    $.each(this,function(k,v){
      if(k!='owner' && k!='_hooks' && v instanceof Variable){
        o[k] = v.getObject();
      }
    });
    return o;
  }
});

GameStateObject.extend('GameStateList',{
  _type:'gslist',
  _count:0,
  init:function(inp,type){
    this._super();
    this._value = {};
    this.fromObject(inp,type);
  },
  fromObject:function(inp,type){
    if(!inp){
      return;
    }
    var that = this;
    $.each(inp,function(key,val){
      if(key == 'type'){return;}

      var el;
      if(type && type.fromObject){
        el = type.fromObject(val);
      } else
      if(type){
        el = new type(val);
      } else
      if(val.type){
        el = Variable.fromObject(val);
      } else {
        el = new GameStateObject(val);
      }
      that.add(key,el);
    });
  },
  add:function(name,variable){
    if(name === undefined || variable === undefined){
      return;
    }
    this._value[name] = variable;

    //only define ownership as this if this is the first owner
    if(!variable.owner){
      variable._name = name;
      variable.owner = this;
    }
    var that = this;

    Object.defineProperty(this,name,{
      enumerable:true,
      configurable:true,
      get:function(){return that.get(name);},
      set:function(x){that.set(name,x);that.triggerHook('change');}
    });
    this._count++;

    this.triggerHook('change');
  },
  remove: function(name){
    if(this._value[name]){
      delete(this._value[name]);
      this._count--;
      //also delete the properties bound to the this object
      delete(this[name]);
      this.triggerHook('change');
    };


  },
  get:function(name){
    switch(name){
      case 'length':
        return this._count;
      case 'count':
        return this._count;
    }
    if(this._value !== null){

      if(this._value[name] !== undefined){
        return this._value[name];
      }
      if(this.vars instanceof GameStateObject){
        return this.vars.get(name);
      }
      if(this._value.vars instanceof GameStateObject){

        return this._value.vars.get(name);
      }
    }
    return null;
  },
  set:function(name,val){
    if(val === undefined){return this._super(name);}
    if(this._value[name] !== undefined){
      this._value[name].set(val);
    }
  },
  firstKey:function(){
    var key = Object.keys(this._value)[0];
    return key;
  },
  getClientHooks(hooks){
    this._super(hooks);
    $.each(this._value,function(key,v){
      v.getClientHooks(hooks);
    });
  },
  count:function(){
    return this._count;
  },
  getObject:function(){
    var o = this._super();
    if(this._value){
      $.each(this._value,function(k,v){
        if(v instanceof Variable){
          o[k] = v.getObject();
        } else {

        }
      });
    }
    return o;
  }
});

GameStateList.extend('GameStateChangeableList',{});

/**
 * Special list for players with special filters
 */
GameStateChangeableList.extend('PlayerList',{
  remove:function(ref){
    if(this.get(ref) == ScopeRef._gs.currentPlayer){
      //removing self
      if((window || global).alert){
        //alert('exited');
      } else {
        console.log(ref+ ' exited');
      }
      if((window || global).app){
        app.exitGame();
      }
    }
    this._super(ref);
  },
  get:function(ref){
    switch(ref){
      case 'others': //all other players
        var l = new GameStateList();
        $.each(this._value,function(n,p){
          if(p !== ScopeRef._gs.currentPlayer){
            l.add(n,p);
          }
        });
        return l;
        break;
      case 'gameowner':
        //the owner is the first one in the list
        return this._value[this.firstKey()];
    }
    return this._super(ref);
  }
});

GameStateChangeableList.extend('Phase',{
  _type:'phase',
  //views:null, /*GameStateList*/
  //vars:null,
  _obj:null, //store phase object for lazy loading
  _runningTimers:null, //list of timers started when this phase is loaded. Used to stop timers again when unloading

  views:null,
  vars:null,
  /*_hooks:null,*/
  init:function(obj){
    obj = obj || {};
    //dont change the actual object, make  copy
    obj = $.extend(Object.create(Object.getPrototypeOf(obj)),obj);
    this._obj = {
      views:obj.views,
    //  vars:obj.vars,
      hooks:obj.hooks
    };

    ScopeRef._setScope(this);

    var hooks = new GameStateList({},Hook);
    var views = new GameStateList({},ViewElement);
    var vars = new GameStateList(obj.vars || {},Variable);

    delete obj.views;
    delete obj.vars;
    delete obj.hooks;

    this._super(obj);

    //TODO: why was these props defined as set and get vars of the _value object?
    this.views = views;
    this.vars = vars;
    this._hooks = hooks;

    /*this.add('views',views);
    this.add('vars',vars);
    this.add('_hooks',hooks);
    */
    this._runningTimers = [];
  },
  load:function(){
    //lazy loading of objects
    if(this._obj.hooks){
      this._hooks.fromObject(this._obj.hooks || {},Hook);
      delete(this._obj['hooks']);
    }
    if(this._obj.views){
      this.views.fromObject(this._obj.views || {},ViewElement);
      delete(this._obj['views']);
    }


    //this.vars.fromObject(this._obj.vars || {},Variable);

    //this.views.owner = this;

    //var vars = new GameStateList(obj.vars || {},Variable);
    //vars.owner = this;
    //this.add('vars',vars);
  },
  unload:function(){
    $.each(this._runningTimers,function(i,t){
      t._stop();
    });
    this._runningTimers = [];
  },
  /*getClientHooks(hooks){//TODO:why not as a function?
    this._super(hooks);
    this.views.getClientHooks(hooks);
  },*/
  getClientHooks:function(hooks){//TODO:why not as a function?
    this._super(hooks);
    this.views.getClientHooks(hooks);
  },
  registerTimer:function(timer){
    this._runningTimers.push(timer);
  },
  deregisterTimer:function(timer){
    this._runningTimers.remove(timer);
  }
});




/*GameStateChangeableList*/GameStateList.extend('ProtoType',{
  _type:'prototype',
  _name:null,
  init:function(obj,name){
    this._super(obj);
    this._name = name;
    //this.fromObject(obj);
  },
  fromObject:function(obj){
    //delete obj.type;
    this._super(obj);
  },
  create:function(){
    var v = null;
    if(this._name == 'player'){
      v = new Player(this,{value:{}});
    } else {
      v = new ProtoTypeVariable(this,{});
    }
    /*if(ScopeRef._gs && ScopeRef._gs.players){
      var that = this;
      $.each(ScopeRef._gs.players._value,function(k,p){
        p.addChange(null,v);
      });
    }*/
    return v;
  }
});
ProtoType.prototypes = {};
ProtoType.create = function(type,obj){
  return ProtoType.prototypes[type].create();
};

Variable.extend('ProtoTypeVariable',{
  _type:'prototypevar',
  prototype:null,
  init:function(type,obj){

    this.prototype = type;
    this._type = type._name;

    if(obj){
      debugger;
      //add prototype variables to this
      var that = this;
      var value = {};
      $.each(this.prototype._value||{},function(name,v){
        if(name!== 'type');
        if(obj[name] !== undefined){
          value[name] = v.clone(obj[name]);
        } else {
          value[name] = v.clone();
        }
        value[name].owner = that;
      });
      this._value = value;
    }

    this._super();
  },
  get:function(ref){
    return this._value !== null ? this._value[ref] : null;
  },
  add:function(ref,v){
    if(!ref){
      return;
    }
    if(!this._value){
      this._value = {};
    }
    if(this._value[ref] === undefined){
      this._value[ref] = v;
    }
  },
  set:function(ref,v){
    var old_value =this._value;
    if(!ref){
      //console.log('setting to null in protovar '+this.prototype.name);
      this._value = null;
      delete(this._p);

      if(this._value !== old_value){
        this.triggerHook('change');
      }
      return;
    }
    if(ref instanceof ProtoTypeVariable && ref.prototype == this.prototype){
      this._value = ref._value;
      this._p = ref._id; //register a pointer for this
      //TODO: if pointing to an object that are later changed in this same update this may not chnage
      //It does not matter that much, only when creating objects

      if(this._value !== old_value){
        this.triggerHook('change');
      }
      return;
    }
    if(!this._value){
      this._value = {};
    }
    if($.type(ref) == 'object'){
      //go through all elements and set them
      var old_keys = Object.keys(this._value);
      var that = this;
      $.each(ref,function(n,p){
        old_keys.remove(n);
        if(that._value[n] === undefined){
          //new variable, use the adder function
          that.add(n,Variable._vars[p]);
        } else {
          //existing variable, set using the set function
          //Variable._vars[id]._value[n] = Variable._vars[p];
          that.set(n,Variable._vars[p]);
        }
      });
      //add cleanup removing nonexisting entries
      $.each(old_keys,function(i,n){
        that.remove(n);
      });
    } else
    if(this._value[ref] === undefined){
      console.log('setting '+ref+' to '+v+' in protovar '+this.prototype._name);
      this._value[ref] = v;
    }
  },
  getObject:function(){
    if(this._value === null){
      return null;
    }
    var o = {};
    $.each(this._value,function(k,v){
      o[k] = v.getObject();
    });
    return o;
  },
  fromObject:function(){
    debugger;
  }
});

/**
 * The extendable player object
 * 1) Could be a Prototype with the name 'player'. When there is a name match with existing prototypes,
      it is "joined".
 * 2)
 */
ProtoTypeVariable.extend('Player',{
  pos:null,
  ping:null,
  name:null,
  total_distance:0,
  id:null,
  gsUpdates:null,
  init:function(type,obj){
    this._super(type,obj ? obj.value:undefined);
    this.gsUpdates = [];
    this.gsUpdates.push(new GameStateUpdate());

    //if the value is already set (not null Player) check for pos
    if(this._value){
      if(this._value['pos']){
        this.pos = this._value['pos'];
      } else {
        this.pos = new PosVariable();
      }
    }


    //TODO: register on a change hook on all variables and a 'new' hook on
    //gamestate, that is triggered when registering new vars.
  },

  //updates the players position from coordinates in meters*meters
  updatePosition:function(c){

    if(Number.isNaN(c[0]) || Number.isNaN(c[1])){
      console.log('bad player pos update:',c[0],c[1],c[2]);
      return;
    }
    //update total distance if in a play phase
    if(this.pos._value && ScopeRef._getGameState().currentPhase._name == 'play'){
      var d = Math.sqrt(Math.pow(this.pos._value.x - c[0],2) + Math.pow(this.pos._value.y - c[1],2));
      this.total_distance+=d;
    }
    this.pos.set({
      x:c[0],
      y:c[1],
      heading:c[2] !== undefined ? c[2] : 0
    });
    this.triggerHook('change');
  },
  get:function(ref){
    switch(ref){
      case 'pos':
        return this.pos;
      case 'total_distance':
        return ~~this.total_distance;
      case 'id':
        return this._name;
      case 'heading':
        return this.pos._value.heading !== undefined ? this.pos._value.heading : 0;
    }
    return this._super(ref);
  },
  set:function(ref,val){
    this._super(ref,val);

    if($.type(ref) == 'object' && !this.pos){
      if(this._value['pos']){
        this.pos = this._value['pos'];
      } else {
        this.pos = new PosVariable();
      }

    }
  }
});

Class.extend('GameStateUpdate',{
  changes:{},
  init:function(){

  },
  addChange(v,new_v,list_index){

    if(v===null){

      //adding a new variable
      var value = null;
      if(new_v instanceof ListVariable){
        value = [];
        $.each(new_v._value || [],function(k,el){
          value.push(el._id);
        });
      } else
      if(new_v instanceof ProtoTypeVariable){
        value = {};
        $.each(new_v._value||{},function(k,el){
          value[k] = el._id;
        });
      } else
      if(new_v instanceof Variable){
        value = new_v._value;
      } else {
        debugger;
      }
      this.changes[new_v._id] = {type:new_v._type,value:value};
      return;
    }

    if(v instanceof ListVariable){
      var type = null;
      var last_index = v._value ? v._value.length-1 : 0;
      if(new_v === null && list_index == last_index){
        type = 'pop';
      } else
      if(list_index == last_index){
        //add or possibly changing the last but it comes out to the same
        type = 'add';
      } else{
        type = 'change';
      }

      if(!this.changes[v._id]){
        this.changes[v._id] = {};
        this.changes[v._id]._type = type;
      } else
      if(this.changes[v._id]._type != type || type == 'change'){
        //change to full index
        this.changes[v._id]._type = 'full';
      } else
      if(this.changes[v._id]._type == type){
        this.changes[v._id][list_index] = new_v._id || new_v;
      }

      //on add, simply adding with the list index will work
      //on pop, setting the list index to null will work as well
      //on remove, setting fx. the first index to null will move
      //all other indexes one spot. If all "orders" are in order
      //it should work, but objects does not guarantee order, and
      //there will be duplicate indexes if the same index is removed
      //twice.
      //Most operations on lists are either adds or pops. Thus this should
      //work if only adds or pops have been seen in this update, but if different
      //types are seen, the full list index should be used.
    } else
    if(this.changes[v._id] && this.changes[v._id].type !== undefined){
      this.changes[v._id].value = new_v;
    } else {
      this.changes[v._id] = new_v && new_v._id || new_v;
    }
  }
});
/**
  Game state update methology
  must handle: references and changes to them
  lists and their order and be able to change the order
    swap, completely change the order, remove, add etc
  create new objects when needed to add to a reference
  handle null, that is setting a game state reference to null
  handle objects and prototypes, fx. like the variables of a timer,
  the sub vars of a prototype etc.

  method1:
  create a shallow copy of the game state looking somethat like the game object.
  it will be easily debuggable as one can see what is send and what is not.

  method2:
  keep an index of all objects in the game on both server and client. when changing
  an object, it is the reference that is used for the change, fx. 4:12 would set
  the value of the 4 variable to 12.
  This is compact and easier to maintain as a game state update will simply be an
  object with a bunch of references. Easier for objects with multiple ownership,
  that is if it is in multiple lists.


  method3:
  simply send the full game state to the client at each go. This is simpley
  but may make it more difficult to register changes on the client in order
  to change graphics. It is needed though as it will be necessary to do so
  from time to time to keep the game states in sync.

  variables
  has an owner where it is referenced
  has a _value which can be null
  handles change events
  simple variables like strings and numbers is never referenced

  is a variable a simple shell around the _value? fx. can a timer be overwritten
  by another timer by setting the _value or does it require more?

  What variables in a game state can change and what cannot? Somethings may change
  but not by user fx when a player is joining.

  the gamestate in itself is a GameStateObject with different internal gamestateObjects
  the vars may change, but there will never be more vars, thus it is not the vars, but
  the actual variables that are changing and they are all variables
  the players may change, by adding players etc, but mostly it will be vars of the players changing
  the phases will never change but internal vars of the phases will
  the currentphase will change.

  Problem: If we reference all the variables by id, then we also needs an internal
  garbage collection method as one can create circula references that is not easy to
  remove by ownership of the variables.
  Or would it? One can simply use the game state tree and walk through all the branches
  marking all variables and remove those that are not used?

*/



GameStateObject.extend('GameState',{
  _type:'gs',
  prototypes: null,
  phases: null,
  currentPhase:null,
  vars:null,
  players:null,
  init:function(game){
    this._super();

    //Register as the gamestate in ScopeRef
    ScopeRef._gs = this;

    var that = this;
    //load protypes
    this.prototypes = {};

    $.each(game.prototypes,function(key,val){
      that.prototypes[key] = new ProtoType({},key);
      that.prototypes[key].owner = that;
    });
    ProtoType.prototypes = this.prototypes;


    //fill them now to allow circular references
    $.each(this.prototypes,function(key,val){

      val.fromObject(game.prototypes[key]);
    });


    //load the game state from the game object
    this.vars = new GameStateList(game.vars || {},Variable);
    this.vars.owner = this;


    //load the phases
    /*this.phases = {};
    $.each(game.phases,function(key,val){
      that.phases[key] = new Phase(val);
      that.phases[key].owner = that;
    });*/
    this.phases = new GameStateList(game.phases,Phase);

    this.phases.owner = this;

    this.currentPhase = new PointerVariable();

    //set players
    this.players = new PlayerList({},Player);
  },
  addPlayer:function(id){
    console.log('adding player:'+id);
    var p = this.prototypes.player.create();
    this.players.add(id,p);
  },
  /**
   * Basic time function. Can be overwritten in clients
   * To adjust for time differences
   */
  getTime:function(){
    return new Date().getTime();
  },
  /**
   * Removes a player
   */
  removePlayer:function(player){

    //TODO: send message to server that the player has exited
    //TODO: figure out how the player is to react to being exited
    if(this.players.get(player._name)){
      this.players.remove(player._name);
    } else {
      console.log('no such player:'+player._name);
    }
  },

  /**
   * Unload current phase (if any) and load new phase. Handles triggers etc.
   */
  loadPhase:function(phase){
    if(!phase){
      phase = this.phases.firstKey();
    }
    console.log('loading phase:'+phase);

    //if this currentphase trigger hooks for ending the phase
    if(this.currentPhase._value){
      this.currentPhase.unload();
      this.currentPhase.triggerHook('end');
      Hookable._handleTriggerQueue();
    }

    var new_phase = this.phases.get(phase);

    if(!new_phase){
      console.log('no such phase:'+phase);
      return;
    }

    new_phase.load();
    this.currentPhase.set(new_phase);



    //load all hooks
    this.clientHooks = [];

    /*this.clientHooks = */
    this.currentPhase.getClientHooks(this.clientHooks);

    //console.log('client hooks:',this.clientHooks);

    //console.log(this.phases.play._);
    //console.log(this.currentPhase._hooks.start);
    this.currentPhase.triggerHook('start');

    Hookable._handleTriggerQueue();
  },
  /**
   * Called on server game state, triggers a client hook with server functionality, fx setting server var.
   */
  triggerClientHook: function(player_id,id,vars){
    this.currentPlayer = this.players[player_id];
    if(!this.clientHooks[id]){
      console.log(this.clientHooks);
      console.log('client hook missing:'+id);
      //TODO: if a clien has not gone through all the same phases as the server it may have a different set of ids for its functions and thus calling will fail. All ids should be forced through somehow
    }
    var h = this.clientHooks[id];


    //Set the reference for each of the client based variables
    $.each(vars||{},function(i,v){
      if(v.v){
        h.vars[i].v = v.v;
      } else {
        h.vars[i].v = Variable._vars[v.p];
      }
    });

    ScopeRef._setScope(h);
    h.trigger(h);
    this.currentPlayer = null;
    Hookable._handleTriggerQueue();

  },
  getFullState: function(){
    var o = {};

    $.each(Variable._vars,function(id,v){

      var el = {
        type: v._type
      };

      if(!(v instanceof GameStateChangeableList) && (
          v instanceof GameStateList
          || v instanceof ProtoType
          || v instanceof Phase
          || v instanceof ClientElement
          || v instanceof GameStateObject)){
        //ignore these, as they are not mutatable
        return;
      } else
      if(v._p){
        el.p = v._p;  //reference
      } else
      if(v._value === null){
        //simply not se
        el.value=null;
      } else
      if(v instanceof PointerVariable){
        el.p = v._value._id;
      } else
      if(v instanceof ListVariable){
        el.value = [];
        $.each(v._value||[],function(k,element){
          el.value.push(element._id);
        });
        el.prototype = v.prototype;
      } else
      if(v instanceof ProtoTypeVariable){
        el.value = {};
        $.each(v._value||{},function(k,element){
          if(!element){
            console.log('error while getting prototype content of v');
            console.log(v);
          }
          el.value[k]=element._id;
        });

      } else
      if(v instanceof GameStateChangeableList){
        el.value = {};
        $.each(v._value||{},function(k,element){
          el.value[k]=element._id;
        });
      } else
      if(v._value!==null){
        el.value=v._value;
      } else {
        debugger;
      }

      o[id] = el;

    });

    return o;
  }
});
