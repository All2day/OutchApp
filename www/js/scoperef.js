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
var els = s.split(/(\?|\^|!=|=|\&\&|\|\||[\{\[\]\}\)\(\'\"\+\-\*\/\>\<\.\:\,])/g);

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
      case ""://empty string, ignore
        break;
      default:
        if(struct.type != '"' && struct.type !="'"){
          var e = els[i].trim();
          if(e){
            struct.c.push(els[i].trim());
          }
        } else {
          struct.c.push(els[i]);
        }
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

ScopeRef._prepareScopeRef = function(s /*string*/,type = null, lookup_depth = 0 /* if >0 this should be a ScopeLookup*/){

  if(s===null){
    return new ScopeNull();
  }

  if(s === undefined){
    return new ScopeNull();
  }

  if($.type(s) == 'array' && s.length == 2 && $.type(s[0]) == 'number' && $.type(s[1])=='number'){
    return new ScopePos(s);
  }

  if(type == ScopeColor && $.type(s) == 'array' && s.length >= 3 && s.length <= 4){
    //all should be numeric
    var all_numeric = true;
    for(var i = 0;i< s.length && all_numeric;i++){
      if(s[i]*1 != s[i]){
        all_numeric = false;
      }
    }
    if(all_numeric){
      return new ScopeColor(s);
    }
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
      //split based on commas
      var a = [];
      for(var i=0,j=0;i<s.c.length;i++){
        if(s.c[i]==","){
          a.push(ScopeRef._prepareScopeRef(s.c.slice(j,i)));
          j=i+1;
        }
      }
      //the last
      a.push(ScopeRef._prepareScopeRef(s.c.slice(j)));
      if(a.length ==3 || a.length == 4){
        return new ScopeColor(a);
      }

      if(a.length ==2){
        return new ScopePos(a);
      }
      debugger;
      console.log('mis starting [');
      return new ScopeNull();

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
          console.log('unmatched if then else in scope');
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
      }

      //look for 3. level splitters
      for(var i=0;i< s.c.length;i++){
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

        if(lookup_depth){
          return new ScopeLookup(s.c[0],null,type);
        } else {
          return new ScopeRootLookup(s.c[0],null,type);
        }

      }

      //check if the next is a .
      if(s.c[1] == '.'){
        //check for special case where both s.c[0] and s.c[2] is numbers, then create a number

        if(s.c.length == 3 && s.c[0].match(/^\d+$/) && s.c[2].match(/^\d+$/)){

          return new ScopeNumber((s.c[0]+"."+s.c[2])*1);
        }

        var next = ScopeRef._prepareScopeRef(s.c.slice(2),type,lookup_depth+1);
        if(lookup_depth){
          return new ScopeLookup(s.c[0],next,type);
        } else {
          return new ScopeRootLookup(s.c[0],next,type);
        }
      }

      if(s.c[1].type == '['){
        var next = new ScopeFilter(ScopeRef._prepareScopeRef(s.c[1].c),ScopeRef._prepareScopeRef(s.c.slice(3),type,lookup_depth+1));

        if(lookup_depth){
          return new ScopeLookup(s.c[0],next,type);
        } else {
          return new ScopeRootLookup(s.c[0],next,type);
        }
      }

      if(s.c[1].type == '{'){
        var next = new ScopeSort(ScopeRef._prepareScopeRef(s.c[1].c),ScopeRef._prepareScopeRef(s.c.slice(3),type,lookup_depth+1));

        if(lookup_depth){
          return new ScopeLookup(s.c[0],next,type);
        } else {
          return new ScopeRootLookup(s.c[0],next,type);
        }
      }

      //check for colors and other functions
      if(s.c[1].type == '('){
        switch(s.c[0]){
          case 'rgba':
            return new ScopeColor(s.c[1].c);
          case 'formattime':
            return new ScopeFormattedtime(ScopeRef._prepareScopeRef(s.c[1].c));
        }
      }
  }


  //check for functions
  if(s.c.length == 2 && s.c[1].type=="("){
    var a = [];
    for(var i=0,j=0;i<s.c[1].c.length;i++){
      if(s.c[1].c[i]==","){
        a.push(ScopeRef._prepareScopeRef(s.c[1].c.slice(j,i)));
        j=i+1;
      }
    }
    //the last
    a.push(ScopeRef._prepareScopeRef(s.c[1].c.slice(j)));

    switch(s.c[0]){
      case 'dist':
        return new ScopeDist(a);
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

    var old_chatty = ScopeRef._chatty;
    ScopeRef._chatty = true;
    debugger;
    var v = this.inner.eval(scp,inf);
    ScopeRef._chatty = old_chatty;
    return v;
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
    var l = this.left.eval(scp,inf);
    var r = this.right.eval(scp,inf);

    if(l instanceof Variable){l = l._value;}
    if(r instanceof Variable){r = r._value;}
    if(ScopeRef._chatty){console.log('ScopeMoreThan '+l + ' > '+r+' => '+(l > r));}
    return l > r;
  }
});

LeftRightRef.extend('ScopeLessThan',{
  eval:function(scp,inf){
    var l = this.left.eval(scp,inf);
    var r = this.right.eval(scp,inf);

    if(l instanceof Variable){l = l._value;}
    if(r instanceof Variable){r = r._value;}

    if(ScopeRef._chatty){console.log('ScopeLessThan:'+l+'<'+r+' => '+(l < r));}
    return l < r;
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
     var r = this.right.eval(scp,inf);

     if(l instanceof Variable){l = l._value;}
     if(r instanceof Variable){r = r._value;}

     //if both are objects, do the operation on each element (pos)
     if($.type(l) == "object" && $.type(r) == "object"){
       var t = {};
       $.each(l,function(k,lv){
         t[k] = lv + r[k];
       });
       return t;
     }

     return l+r;
   }
 });

LeftRightRef.extend('ScopeMinus',{
  eval:function(scp,inf){
    var l;
    if(this.left){
      l = this.left.eval(scp,inf);
      if(l instanceof Variable){l = l._value;}
    } else{
      l = 0;
    }

    var r = this.right.eval(scp,inf);
    if(r instanceof Variable){r = r._value;}

    //if both are objects, do the operation on each element (pos)
    if($.type(l) == "object" && $.type(r) == "object"){
      var t = {};
      $.each(l,function(k,lv){
        t[k] = lv - r[k];
      });
      return t;
    }


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

     //if both are objects, do the operation on each element (pos)
     if($.type(l) == "object" || $.type(r) == "object"){

       var t = {};
       var o = $.type(l) == "object" ? l : r;
       var v = $.type(l) == "object" ? r : l;
       $.each(o,function(k,ov){
         t[k] = ov*v;
       });
       if(ScopeRef._chatty){
         console.log(o);
         console.log('Mult '+JSON.stringify(o)+'*'+v);
       }
       return t;
     }

     if(ScopeRef._chatty){
       console.log('Mult '+l+'*'+r);
     }

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
      var r = {};
      if(this._value.x instanceof ScopeRef){
        r.x = this._value.x.eval(scp,inf);
      } else {
        r.x = this._value.x;
      }

      if(this._value.y instanceof ScopeRef){
        r.y = this._value.y.eval(scp,inf);
      } else {
        r.y = this._value.y;
      }
      return r;
    }
  });

/**
 * nested lookup in the game state
 */
ScopeRef.extend('ScopeRootLookup',{
  ref:null,
  next:null,
  type:null,
  init:function(ref,next,type){
    this.ref = ref.trim();

    this.next = next;

    //if the lookup is not game state based (or from scope stack) register it
    if(this.ref !='phase' && this.ref!='player' && !this.gameStateLookup()){
      //get the hook
      var h = ScopeRef._getScopeRoot();

      //register on the hook, that this is a client variable
      if(h instanceof Hook){
        h.vars.push({
          d:1, //depth
          r:this //pointer to this root lookup
        });
      } else {
        //this lookup is not based on a hook, just ignore

      }
    }



    this.type = type;
  },
  traverse:function(f){
    this._super(f);
    if(this.next){
      this.next.traverse(f);
    }
  },
  //First lookup based on gameState. Returns null if the lookup is not game state based
  gameStateLookup: function(){
    var scp;
    switch(this.ref){
      case 'now':
        scp = ScopeRef._gs.getTime();//new ScopeNumber(ScopeRef._gs.getTime());
        break;
      case 'rand':
        scp = Math.random();
        break;
      case 'game':
        scp = ScopeRef._gs;
        break;
      case 'phase':
        scp = ScopeRef._gs.currentPhase;
        //if currentPhase is not set, go through ownership
        if(!scp){
          scp = ScopeRef._getScopeRoot();
          while(scp && !(scp instanceof Phase)){
            scp = scp._owner;
          }
        }
        if(!scp){
          //should always be
          debugger;
        }
        break;
      case 'phases':
        scp = ScopeRef._gs.phases;
        break;
      case 'player':
        scp = ScopeRef._gs.currentPlayer;
        //it may be that the hook originates from a timer, search for prototype vars
        if(!scp){
          //console.log('searching for '+this.ref);
          scp = ScopeRef._getScopeRoot();
          while(scp && !(scp instanceof ProtoTypeVariable && scp._type == this.ref)){
            //console.log('are at '+scp._type+' with name '+scp._name+' and id:'+scp._id);
            scp = scp._owner;
          }
          if(!scp){
            //console.log('did not find anything');
          }
          break;
        }
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
        while(scp && !(scp instanceof TimerVariable)){scp = scp._owner;}
        break;
      case 'list':
        scp = ScopeRef._getScopeRoot();
        while(scp && !(scp instanceof ListVariable)){scp = scp._owner;}
        break;
      case 'el':
        //scope stack lookups for a container with an 'el'
        //TODO:check that it is on purpose, that it does NOT check the root?
        for(var i=ScopeRef._scp.length-1;i>0;i--){
          if(ScopeRef._scp[i].get('el')){
            scp = ScopeRef._scp[i].get('el');
          }
        }
        break;
      default:
        //checked for named elements in the scope stack
        //or for prototypes with that name
        //TODO:check that it is on purpose, that it does NOT check the root?
        for(var i=ScopeRef._scp.length-1;i>0;i--){
          if(ScopeRef._scp[i]._name == this.ref){
            scp = ScopeRef._scp[i];
            //console.log('found named object in scope:'+this.ref+' index:'+scp.get('index'));
          }
        }
        //if still no result go through the ownership chain but only for game state elements
        if(!scp){
          //console.log('searching for '+this.ref);
          scp = ScopeRef._getScopeRoot();
          while(scp && !(scp instanceof ProtoTypeVariable && scp._type == this.ref)){
            //console.log('are at '+scp._type+' with name '+scp._name);
            scp = scp._owner;
          }
          if(!scp){
            //console.log('did not find anything');
          }
          break;
        }
        break;
    }

    return scp;
  },
  //Called on the top level scope lookup
  eval:function(other_scp,inf /*if set will be used to collect info on the execution*/){
    if(ScopeRef._chatty){console.log('ScopeRootLookup:'+this.ref);}
    var scp = this.gameStateLookup();

    //if a specific scope is found by the first reference use it
    if(scp){
      if(ScopeRef._chatty){console.log('GameState result:'+scp._id);}
      return this.getNext(scp,inf);
    }

    //If no hit so far, the lookup is based on client variables
    if(!(global || window)._client){
      //server execution. A stored variable should be available to lookup
      //if multiple levels of client variables are used, fx. view.elements.named_element.some_reference_var

      //get hook, should be scope root
      var h = ScopeRef._getScopeRoot();
      if(h instanceof Hook){
        for(var i=0;i<h.vars.length;i++){
          if(h.vars[i].r == this){
            console.log('using var '+i+' in hook value:'+h.vars[i].v);
            scp = h.vars[i].v;
            if(!scp || !scp.get){
              return scp;
            }
            return this.getNext(scp,inf);
          }
        }
      }

      console.log('Hit something that seems to be a client element on the server? '+this.ref);
      return;
    }

    //For client lookups
    switch(this.ref){
      case 'listel': //reference to the object used for this list element, if showing a list of players the listel for a hook fired inside will be the player used to create it.
        //debugger;
        scp = ScopeRef._getScopeRoot();

        while(scp && !(scp instanceof ListElElement ||  scp instanceof GeolistElElement)){scp = scp._owner;}
        if(scp){
          scp = scp.get('listel');
        }
        break;
      case 'element': //displayable element
        scp = ScopeRef._getScopeRoot();
        while(scp && !(scp instanceof ViewElement || scp instanceof GeoElement)){scp = scp._owner;}

        break;
    }

    if(scp){
      return this.getNext(scp,inf);
    }

    //first test all scopes in scope stac for having a var with ref, or being a prototype of that name
    var scp_temp;
    for(var i=ScopeRef._scp.length-1;i>0;i--){
      scp_temp = ScopeRef._scp[i].get(this.ref);
      if(scp_temp !== undefined){
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
      scp_temp = scp.get(this.ref);
      if(scp_temp !== undefined){
        scp = scp_temp;
        return this.getNext(scp,inf);
      }
      if(scp instanceof ProtoType && ScopeRef._name == this.ref){
        return this.getNext(scp,inf);
      }

      scp = scp._owner;
    }

    if(inf){
      inf.constant = false;
    }
    //could not find a base scope
    return null;
  },
  /*_eval:function(scp,inf){
    if(!scp){
     return null;
    }

    scp = scp.get(this.ref);
    if(!scp || !scp.get){
      return scp;
    }

    return this.getNext(scp,inf);
  },*/
  getNext:function(scp,inf){
    if(inf && (scp instanceof Variable || scp instanceof ClientElement)){
      inf.constant = false;
      inf.vars.push(scp);
    }
    if(this.next){
      scp = this.next.eval(scp,inf);
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
 * Lookups into reference
 */
ScopeRootLookup.extend('ScopeLookup',{
  ref:null,
  next:null,
  type:null,
  init:function(ref,next,type){
    this.ref = ref.trim();
    this.next = next;
    this.type = type;
  },
  //evaluates this scope reference based on the scp
  eval:function(scp,inf /*if set will be used to collect info on the execution*/){
    if(!scp){
      if(ScopeRef._chatty){console.log('ScopeLookup:'+this.ref+' but no scope, returning null');}
     return null;
    }

    scp = scp.get(this.ref);

    if(ScopeRef._chatty){console.log('ScopeLookup:'+this.ref+' res:'+(scp && scp._id ? 'var '+scp._id : scp));}

    if(!scp || !scp.get){

      return scp;
    }

    return this.getNext(scp,inf);
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
  eval:function(scp,inf){
    if(!(scp instanceof ListVariable || scp instanceof GameStateList)){
      return null;
    }

    var gso = new GameStateObject({});
    ScopeRef._pushScope(gso);

    //create an empty list
    //TODO: The Listvariable currently registers in Variable. it should not
    var new_list = new TempListVariable({prototype:scp.prototype});
    var that = this;
    $.each(scp._value,function(k,v){
      gso.el = v;
      ScopeRef._pushScope(v);

      if(that.filter.eval(undefined,inf)){
        new_list.add(v);
      }
      ScopeRef._popScope();
    });
    if(ScopeRef._chatty){console.log('ScopeFilter '+new_list._value.length + ' / '+scp._value.length);}

    return this.getNext(new_list,inf);
  }
});


/**
 * Can only be used a s a next element for a scope lookup, where the result is sorted if a list.
 */
ScopeLookup.extend('ScopeSort',{
  condition:null,
  init:function(condition,next,type){
    this.condition = condition;
    this.next = next;
    this.type = type;
  },
  traverse:function(f){
    this.condition.traverse(f);
    this._super(f);
  },
  eval:function(scp,inf){
    if(!(scp instanceof ListVariable || scp instanceof GameStateList)){
      return null;
    }

    var gso = new GameStateObject({});
    ScopeRef._pushScope(gso);

    //create an empty temporary list
    var new_list = new TempListVariable({prototype:scp.prototype});
    var that = this;
    var temp_array = [];


    $.each(scp._value,function(k,v){
      gso.el = v;
      ScopeRef._pushScope(v);

      var con = that.condition.eval(undefined,inf);
      if(con instanceof Variable){
        con = con._value;
      }

      temp_array.push({con:con,el:v});

      ScopeRef._popScope();
    });
    if(ScopeRef._chatty){console.log('ScopeSort '+new_list._value.length + ' / '+scp._value.length);}

    //sort the array
    temp_array.sort(function(a,b){
      if(a.con < b.con){
        return -1;
      }
      if(a.con > b.con){
        return 1;
      }
      return 0;
    });

    $.each(temp_array,function(i,t){
      new_list.add(t.el);
    });

    return this.getNext(new_list,inf);
  }
});



ScopeRef.extend('ScopeColor',{

  init:function(inp){
    if($.type(inp) == 'string' && inp.match(/\[(\d+),(\d+),(\d+)(?:,(\d+|\d*\.\d+))?\]/)){
      inp = [1*RegExp.$1,1*RegExp.$2,1*RegExp.$3];
      if(RegExp.$4 != ""){
        inp.push(1*RegExp.$4);
      }

    }
    if($.type(inp) == 'string' && inp.match(/#[0-9A-F]{3}[0-9A-F]{3}?/i)){
      inp = ol.color.asArray(inp);
    }
    if($.type(inp) == 'array'){
      for(var i=0;i<inp.length;i++){
        if(inp[i] instanceof Variable || inp[i] instanceof ScopeNumber){
          inp[i] = inp[i]._value;
        }
      }
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
          break;
        default:
          console.log('unknown color:'.inp);
      }
    }

  },
  eval:function(){
    return this._value;
  }
});

ScopeRef.extend('ScopeFormattedtime',{
  time:null,
  init:function(time){
    this.time=time;

  },
  eval:function(scp,inf){

    var t = this.time.eval(scp,inf);
    if(t instanceof Variable){t = t._value;}

    t = Math.floor(t/1000);

    var d = Math.floor(t/86400),
        h = ('0'+Math.floor(t/3600) % 24).slice(-2),
        m = ('0'+Math.floor(t/60)%60).slice(-2),
        s = ('0' + t % 60).slice(-2);
    return (d>0?d+'d ':'')+(h>0?h+':':'')+(m>0?m+':':'')+(t>60?s:s+'s');

    //return 'time:'+t;
  },
  traverse:function(f){
    this._super(f);
    if(this.time){
      this.time.traverse(f);
    }
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

    //if the result is a variable, take its value
    if(c && c instanceof Variable){
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

ScopeRef.extend('ScopeFunction',{
  args:null,
  init:function(args){
    this.args = args;
  },
  traverse:function(f){
    this._super(f);
    $.each(this.args,function(k,a){
      a.traverse(f);
    });
  },
  eval:function(scp,inf){
    var res = [];
    for(var i=0;i<this.args.length;i++){
      var r = this.args[i].eval(scp,inf);
      if(r instanceof Variable){
        r = r._value;
      }
      res.push(r);
    }
    return res;
  }
});

ScopeFunction.extend('ScopeDist',{
  eval:function(scp,inf){
    var res = this._super(scp,inf);

    //both args should be objects
    if(res.length!=2 || $.type(res[0]) != 'object' || $.type(res[1]) != 'object'){
      console.log('not pos in dist');
      return null;
    }

    var r = Math.sqrt(Math.pow(res[0].x - res[1].x,2) + Math.pow(res[0].y - res[1].y,2));

    if(ScopeRef._chatty){console.log('ScopeDist:'+r);}
    return r;
  }
});
