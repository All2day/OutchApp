require('./basic');
/**
 * Defines scope references
 */
Class.extend('GameProperty',{
  d: null, //default value to return if there is no result
  s: null, //string definition
  t: null, //the type
  r: null, //the scope reference when run the first time
  init:function(s,d,t){
    this.s = s;
    this.d = d;
    this.t = t;
  }
});

TreeObject.extend('ScopeRef',{
  eval:function(scp /*TreeObject*/, inf /*if pressent fill it with info like touched vars etc.*/){

  },
  traverse:function(f){
    f(this);
  }
});

ScopeRef._stringSplit = function(s /*string*/){
  //use regex to split the string into object types and names
var els = s.split(/(\?|\^|!=|=|\&\&|\|\||[\{\[\]\}\)\(\'\"\+\-\*\/\>\<\.\:])/g);

  var struct = {
    c:[],
    p:null
  };

  //add debugging
  /*if(els.length > 0 && els[0] == '^'){
    els.shift();
  }*/


  for(var i=0;i<els.length;i++){
    if(els[i] =="") continue;

    if(struct.type == "'"){
      if(els[i] == "'"){
        struct = struct.p;
      } else {
        struct.c.push(els[i]);
      }
      continue;
    }
    if(struct.type == '"'){
      if(els[i] == '"'){
        struct = struct.p;
      } else {
        struct.c.push(els[i]);
      }
      continue;
    }

    switch(els[i]){
      case '(':
      case '[':
      case '{':
      case "'":
      case '"':
        var new_struct = {
          c:[],
          p:struct,
          type:els[i]
        }
        struct.c.push(new_struct);
        struct = new_struct;
        break;
      case ')':
        if(struct.type == '('){
          struct = struct.p;
        } else {
          console.log('mismatched )');
        }
        break;
      case ']':
        if(struct.type == '['){
          struct = struct.p;
        } else {
          console.log('mismatched ]');
        }
        break;
      case '}':
        if(struct.type == '{'){
          struct = struct.p;
        } else {
          console.log('mismatched }');
        }
        break;

      default:
        struct.c.push(els[i]);
    }

  }
  if(struct.p){
    console.log('mismatched '+struct.type);
  }

  if(struct.c.length == 1 && struct.c[0].type){
    return struct.c[0];
  }

  return struct;
};

ScopeRef._prepareScopeRef = function(s /*string*/,type = null){

  if(s===null){
    return new ScopeNull();
  }

  if(s === undefined){
    return new ScopeNull();
  }

  if($.type(s) == 'array' && s.length == 2 && $.type(s[0]) == 'number' && $.type(s[1])=='number'){
    return new ScopePos(s);
  }

  if(type == ScopeColor && $.type(s) == 'array' && s.length >= 3){
    return new ScopeColor(s);
  }

  if($.type(s) == 'number'){
    return new ScopeNumber(s);
  }

  if($.type(s) == 'string'){
    s = ScopeRef._stringSplit(s);
  }

  if($.type(s) == 'array'){
    if(s.length == 1 && s[0].c){
      s = s[0];
    } else {
      s = {
        c:s
      };
    }
  }

  switch(s.type){
    case '"':
    case "'":
      //create a string
      var concat_s = '';
      $.each(s.c,function(k,v){
        concat_s+=v;
      });
      return new ScopeString(concat_s);
      break;
    case '[':
      console.log('mis starting [');
      return new ScopeNull();
    case '[':
    default:
      if(s.c.length ==0){
        return null;
      }

      if(s.c[0] == '^'){
        return new ScopeDebug(ScopeRef._prepareScopeRef(s.c.slice(1)));
      }

      //look for -1. level splitters
      for(var i=0;i< s.c.length;i++){
        if(s.c[i] == '?'){
          for(var j=i+1;j< s.c.length;j++){
            if(s.c[j] == ':'){
              return new ScopeIfThenElse(
                ScopeRef._prepareScopeRef(s.c.slice(0,i),BoolVariable),
                ScopeRef._prepareScopeRef(s.c.slice(i+1,j)),
                ScopeRef._prepareScopeRef(s.c.slice(j+1))
              );
            }
          }
          conole.log('unmatched if then else in scope');
        }
      }

      //look for 0. level splitters
      for(var i=0;i< s.c.length;i++){
        if(s.c[i] == '&&'){
          return new ScopeAnd(
            ScopeRef._prepareScopeRef(s.c.slice(0,i),BoolVariable),
            ScopeRef._prepareScopeRef(s.c.slice(i+1),BoolVariable)
          );
        }
        if(s.c[i] == '||'){
          return new ScopeOr(
            ScopeRef._prepareScopeRef(s.c.slice(0,i),BoolVariable),
            ScopeRef._prepareScopeRef(s.c.slice(i+1),BoolVariable)
          );
        }
      }

      //look for 1. level splitters
      for(var i=0;i< s.c.length;i++){
        if(s.c[i] == '<'){
          return new ScopeLessThan(
            ScopeRef._prepareScopeRef(s.c.slice(0,i)),
            ScopeRef._prepareScopeRef(s.c.slice(i+1))
          );
        }
        if(s.c[i] == '>'){
          return new ScopeMoreThan(
            ScopeRef._prepareScopeRef(s.c.slice(0,i)),
            ScopeRef._prepareScopeRef(s.c.slice(i+1))
          );
        }
        if(s.c[i] == '='){
          return new ScopeEqual(
            ScopeRef._prepareScopeRef(s.c.slice(0,i)),
            ScopeRef._prepareScopeRef(s.c.slice(i+1))
          );
        }
        if(s.c[i] == '!='){
          return new ScopeNotEqual(
            ScopeRef._prepareScopeRef(s.c.slice(0,i)),
            ScopeRef._prepareScopeRef(s.c.slice(i+1))
          );
        }
        if(s.c[i] == ':'){
          return new ScopeList(
            ScopeRef._prepareScopeRef(s.c.slice(0,i)),
            ScopeRef._prepareScopeRef(s.c.slice(i+1))
          );
        }
      }

      //look for 2. level splitters
      for(var i=0;i< s.c.length;i++){
        if(s.c[i] == '+'){
          return new ScopeAdd(
            ScopeRef._prepareScopeRef(s.c.slice(0,i)),
            ScopeRef._prepareScopeRef(s.c.slice(i+1))
          );
        }
        if(s.c[i] == '-'){
          return new ScopeMinus(
            ScopeRef._prepareScopeRef(s.c.slice(0,i)),
            ScopeRef._prepareScopeRef(s.c.slice(i+1))
          );
        }
        if(s.c[i] == '*'){
          return new ScopeMult(
            ScopeRef._prepareScopeRef(s.c.slice(0,i)),
            ScopeRef._prepareScopeRef(s.c.slice(i+1))
          );
        }
        if(s.c[i] == '/'){
          return new ScopeDiv(
            ScopeRef._prepareScopeRef(s.c.slice(0,i)),
            ScopeRef._prepareScopeRef(s.c.slice(i+1))
          );
        }
      }

      //if parenthesis, use it directly
      if(s.c.length == 1){
        if(s.c[0].type == '('){
          return ScopeRef._prepareScopeRef(s.c[0]);
        }

        //if length is just a single check that it is a number
        if(s.c.length == 1 && $.type(s.c[0]) == 'string' && s.c[0].match(/^([\d]+)(?:\.[\d])?$/)){
          return new ScopeNumber(s.c[0]);
        }
        return new ScopeLookup(s.c[0],null,type);
      }

      //check if the next is a .
      if(s.c[1] == '.'){
        return new ScopeLookup(s.c[0],ScopeRef._prepareScopeRef(s.c.slice(2)),type);
      }

      if(s.c[1].type == '['){
        return new ScopeLookup(s.c[0],
          new ScopeFilter(ScopeRef._prepareScopeRef(s.c[1].c),ScopeRef._prepareScopeRef(s.c.slice(3)),type)
        );
      }

      //check for colors
      if(s.c[1].type == '('){
        switch(s.c[0]){
          case 'rgba':
            return new ScopeColor(s.c[1].c);
        }
      }
  }


  var m;
  if($.type(s) != 'string'){
    debugger;
  }
  if(m = s.match(/^([\d]+)(?:\.[\d])?$/)){
    return new ScopeNumber(s);
  }

  //If not split correctly before this will split into a scope lookup
  if(m = s.match(/^([^\.]+)(?:\.(.*))?$/)){
    console.log('in scoperef, not split correctly earlier, thus doing it now');
    return new ScopeLookup(m[1],m[2] ? ScopeRef._prepareScopeRef(m[2]) : null,type);
  }
  console.log('unknown type:'+m);
};

ScopeRef._evalString = function(s,t /*the type*/){
  var inf = {
    vars:[], //variables that should have a change event attach and reevaluate this string
    constant:true,
    scp:[], //internal scope stack used to check if a named string in a scope lookup is a client variable that should be send to the server or not
    client_vars:[]
  };
  var scopeRef = ScopeRef._prepareScopeRef(s,t);
  //go through the scope reference for all lookups and test if they are constant

  var v = scopeRef.eval(undefined,inf);

  return {
    value:v,
    inf:inf,
    ref:scopeRef
  };
}

ScopeRef._getGameState = function(scp){
  return this._gs;
};
ScopeRef._setScope = function(scp){
  ScopeRef._scp = [scp];
}
ScopeRef._pushScope = function(scp){
  if(!scp.get){
    debugger;
  }
  ScopeRef._scp.push(scp);
}
ScopeRef._popScope = function(){
  ScopeRef._scp.pop();
}
ScopeRef._getScopeRoot = function(){
  return ScopeRef._scp[0];
}

ScopeRef.extend('ScopeDebug',{
  inner:null,
  init:function(inner){
    this.inner = inner;
  },
  eval:function(scp,inf){
    debugger;
    return this.inner.eval(scp,inf);
  },
  traverse:function(f){
    this._super(f);
    this.inner.traverse(f);
  }
});

ScopeRef.extend('ScopeNull',{
  eval:function(scp,inf){
    return null;
  }
});

ScopeRef.extend('LeftRightRef',{
  left:null,
  right:null,
  init:function(left,right){
    this.left = left;
    this.right = right;
  },
  traverse:function(f){
    this._super(f);
    if(left){
      f.traverse(f);
    }
    if(right){
      f.traverse(f);
    }
  }
});

LeftRightRef.extend('ScopeMoreThan',{
  eval:function(scp,inf){
    return this.left.eval(scp,inf) > this.right.eval(scp,inf);
  }
});

LeftRightRef.extend('ScopeLessThan',{
  eval:function(scp,inf){
    return this.left.eval(scp,inf) < this.right.eval(scp,inf);
  }
});

LeftRightRef.extend('ScopeEqual',{
  eval:function(scp,inf){
    var left_var = this.left.eval(scp,inf);
    var right_var = this.right.eval(scp,inf);
    if(left_var == right_var){
      return true;
    }
    if(left_var && left_var._value && right_var && right_var._value){
      return left_var._value == right_var._value;
    }
    return false;
  }
});

LeftRightRef.extend('ScopeNotEqual',{
  eval:function(scp,inf){
    return this.left.eval(scp,inf) != this.right.eval(scp,inf);
  }
});

LeftRightRef.extend('ScopeAnd',{
  eval:function(scp,inf){
    return this.left.eval(scp,inf) && this.right.eval(scp,inf);
  }
});

LeftRightRef.extend('ScopeOr',{
  eval:function(scp,inf){
    return this.left.eval(scp,inf) || this.right.eval(scp,inf);
  }
});

LeftRightRef.extend('ScopeList',{
  eval:function(scp,inf){

    var s = this.left.eval(scp,inf);
    var e = this.right.eval(scp,inf);
    var els = [];
    for(var i=s;i<=e;i++){
      els.push(i);
    }

    var l = new ListVariable({
      els:els //will set as _value
    });

    return l;
  }
});

ScopeRef.extend('ScopeString',{
  s:null,
  init:function(s){
    this.s = s;
  },
  eval:function(scp,inf){
    return this.s;
  }
})

 LeftRightRef.extend('ScopeAdd',{
   eval:function(scp,inf){
     var l = this.left.eval(scp,inf);
     if(l instanceof Variable){l = l._value;}
     var r = this.right.eval(scp,inf);
     if(r instanceof Variable){r = r._value;}
     return l+r;
   }
 });

 LeftRightRef.extend('ScopeMinus',{
   eval:function(scp,inf){
     var l = 0;
     if(this.left){
      l = this.left.eval(scp,inf);
      if(l instanceof Variable){l = l._value;}
     }

     var r = this.right.eval(scp,inf);
     if(r instanceof Variable){r = r._value;}
     return l-r;
   }
 });

 LeftRightRef.extend('ScopeDiv',{
   eval:function(scp,inf){
     var l = this.left.eval(scp,inf);
     if(l instanceof Variable){l = l._value;}
     var r = this.right.eval(scp,inf);
     if(r instanceof Variable){r = r._value;}
     return l/r;
   }
 });

 LeftRightRef.extend('ScopeMult',{
   eval:function(scp,inf){
     var l = this.left.eval(scp,inf);
     if(l instanceof Variable){l = l._value;}
     var r = this.right.eval(scp,inf);
     if(r instanceof Variable){r = r._value;}
     return l*r;
   }
 });

ScopeRef.extend('ScopeNumber',{
   value:null,
   init(val){
     this._value = val*1;
   },
   eval:function(scp,inf){
     return this._value;
   }
 });

 ScopeRef.extend('ScopePos',{
    value:null,
    init(val){
      this._value = {
        x:val[0],
        y:val[1]
      }
      //this._value = val;
    },
    eval:function(scp,inf){
      return this._value;
    }
  });

/**
 * nested lookup in the game state
 */
ScopeRef.extend('ScopeLookup',{
  ref:null,
  next:null,
  type:null,
  init:function(ref,next,type){
    this.ref = ref.trim();
    this.next = next;
    this.type = type;
  },
  traverse:function(f){
    this._super(f);
    if(this.next){
      this.next.traverse(f);
    }
  },
  //Called on the top level scope lookup
  eval:function(other_scp,inf /*if set will be used to collect info on the execution*/){
    var scp;
    switch(this.ref){
      case 'game':
        scp = ScopeRef._gs;
        break;
      case 'phase':
        scp = ScopeRef._gs.currentPhase;
        break;
      case 'phases':
        scp = ScopeRef._gs.phases;
        break;
      case 'player':
        scp = ScopeRef._gs.currentPlayer;
        break;
      case 'hook':
        //go back from scope to find first hook
        scp = ScopeRef._getScopeRoot();
        break;
      case 'view':
        scp = ScopeRef._gs.currentPhase.currentView;
        break;
      case 'views':
        scp = ScopeRef._gs.currentPhase.views;
        break;
      case 'players':
        scp = ScopeRef._gs.players;
        break;
      case 'timer':
        scp = ScopeRef._getScopeRoot();
        while(scp && !(scp instanceof TimerVariable)){scp = scp.owner;}
        break;
      case 'el':
        //scope stack lookups for a container with an 'el'
        for(var i=ScopeRef._scp.length-1;i>0;i--){
          if(ScopeRef._scp[i].get('el')){
            scp = ScopeRef._scp[i].get('el');
          }
        }
        break;
    }

    //checked for named elements in the scope stack
    //or for prototypes with that name
    for(var i=ScopeRef._scp.length-1;i>0;i--){
      if(ScopeRef._scp[i]._name == this.ref){
        scp = ScopeRef._scp[i];
      }
    }


    //if a specific scope is found by the first reference use it
    if(scp){
      return this.getNext(scp,inf);
    }

    //If no hit so far, the lookup is based on client variables
    if(!(global || window)._client){
      //server execution. A stored variable should be available to lookup
      //if multiple levels of client variables are used, fx. view.elements.named_element.some_reference_var
      console.log('Hit something that seems to be a client element on the server? '+this.ref);
      return;
    }

    //For client lookups
    switch(this.ref){
      case 'listel': //reference to the object used for this list element, if showing a list of players the listel for a hook fired inside will be the player used to create it.
        //debugger;
        scp = ScopeRef._getScopeRoot();

        while(scp && !(scp instanceof ListElElement ||  scp instanceof GeolistElElement)){scp = scp.owner;}
        if(scp){
          scp = scp.get('listel');
        }
        break;
      case 'element': //displayable element
        scp = ScopeRef._getScopeRoot();
        while(scp && !(scp instanceof ViewElement || scp instanceof GeoElement)){scp = scp.owner;}

        break;
    }

    if(scp){
      return this.getNext(scp,inf);
    }

    //first test all scopes in scope stac for having a var with ref, or being a prototype of that name
    var scp_temp;
    for(var i=ScopeRef._scp.length-1;i>0;i--){

      if(scp_temp = ScopeRef._scp[i].get(this.ref)){
        scp = scp_temp;
        return this.getNext(scp,inf);
      }
      if(ScopeRef._scp[i] instanceof ProtoType && ScopeRef._name == this.ref){
        scp = ScopeRef._scp[i];
        return this.getNext(scp,inf);
      }
    }
    var scp = ScopeRef._getScopeRoot();
    while(scp){
      if(scp_temp = scp.get(this.ref)){
        scp = scp_temp;
        return this.getNext(scp,inf);
      }
      if(scp instanceof ProtoType && ScopeRef._name == this.ref){
        return this.getNext(scp,inf);
      }

      scp = scp.owner;
    }

    if(inf){
      inf.constant = false;
    }
    //could not find a base scope
    return null;
  },
  _eval:function(scp,inf){
    if(!scp){
     return null;
    }

    scp = scp.get(this.ref);
    if(!scp || !scp.get){
      return scp;
    }

    return this.getNext(scp,inf);
  },
  getNext:function(scp,inf){
    if(inf && (scp instanceof Variable || scp instanceof ClientElement)){
      inf.constant = false;
      inf.vars.push(scp);
    }
    if(this.next){
      scp = this.next._eval(scp,inf);
    }

    if(this.type){
      var t_a = $.type(this.type) == 'array' ? this.type : [this.type];
      var type_match = false;
      $.each(t_a,function(k,v){
        if(scp instanceof v){type_match = true;return false;}
      });
      if(!type_match){
        //console.log('type mismatch was not');
      }
    }

    return scp;
  }
});

/**
 * Can only be used a s a next element for a scope lookup, where the result is filtere if a list.
 */
ScopeLookup.extend('ScopeFilter',{
  filter:null,
  init:function(filter,next,type){
    this.filter = filter;
    this.next = next;
    this.type = type;
  },
  traverse:function(f){
    this.filter.traverse(f);
    this._super(f);
  },
  _eval:function(scp,inf){
    if(!(scp instanceof ListVariable || scp instanceof GameStateList)){
      return null;
    }

    var gso = new GameStateObject({});
    ScopeRef._pushScope(gso);

    //create an empty list
    //TODO: The Listvariable currently registers in Variable. it should not
    var new_list = new ListVariable({prototype:scp.prototype});
    var that = this;
    $.each(scp._value,function(k,v){
      gso.el = v;
      ScopeRef._pushScope(v);
      if(that.filter.eval(undefined,inf)){
        new_list.add(v);
      }
      ScopeRef._popScope();
    });

    return this.getNext(new_list,inf);
  }
});


ScopeRef.extend('ScopeColor',{

  init:function(inp){
    if($.type(inp) == 'array'){
      if(inp.length == 3){
        this._value = [inp[0],inp[1],inp[2],1];
      } else {
        this._value = [inp[0],inp[1],inp[2],inp[3]];
      }
    } else {
      switch(inp){
        case 'red':
          this._value = [255,0,0,.4];
          break;
        case 'green':
          this._value = [0,255,0,.4];
          break;
        case 'blue':
          this._value = [0,0,255,.4];
          break;
        case 'yellow':
          this._value = [255,255,0,.4];
          break;
        case 'black':
          this._value = [0,0,0,0.4];
          break;
        case 'white':
          this._value = [255,255,255,0.4];
      }
    }

  },
  eval:function(){
    return this._value;
  }
});

ScopeRef.extend('ScopeIfThenElse',{

  init:function(condition,iftrue,iffalse){
    this.condition = condition;
    this.iftrue = iftrue;
    this.iffalse = iffalse;
  },
  eval:function(scp,inf){
    var c = this.condition.eval(scp,inf);
    if(c && c._value){
      c = c._value;
    }
    var r = null;
    if(c){
      r = this.iftrue.eval(scp,inf);
    } else {
      r = this.iffalse.eval(scp,inf);
    }
    return r;
  },
  traverse:function(f){
    this._super(f);
    this.condition.traverse(f);
    this.iftrue.traverse(f);
    this.iffalse.traverse(f);
  }
});
