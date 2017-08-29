require('./basic');
/**
 * Defines scope references
 */
Class.extend('GameProperty',{
  d: null, //default value to return if there is no result
  s: null, //string definition
  init:function(s,d){
    this.s = s;
    this.d = d;
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
  var els = s.split(/(!=|=|\&\&|\|\||[\{\[\]\}\)\(\'\"\+\-\>\<\.\:])/g);

  var struct = {
    c:[],
    p:null
  };

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
            ScopeRef._prepareScopeRef(s.c.slice(0,i),NumberVariable),
            ScopeRef._prepareScopeRef(s.c.slice(i+1),NumberVariable)
          );
        }
        if(s.c[i] == '/'){
          return new ScopeDiv(
            ScopeRef._prepareScopeRef(s.c.slice(0,i),NumberVariable),
            ScopeRef._prepareScopeRef(s.c.slice(i+1),NumberVariable)
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

  if(m = s.match(/^([^\.]+)(?:\.(.*))?$/)){
    return new ScopeLookup(m[1],m[2] ? ScopeRef._prepareScopeRef(m[2]) : null,type);
  }
  console.log('unknown type:'+m);
};

ScopeRef._evalString = function(s){
  var inf = {
    vars:[],
    constant:true
  };
  var scopeRef = ScopeRef._prepareScopeRef(s);
  //go through the scope reference for all lookups and test if they are constant

  /*scopeRef.traverse(function(sr){
    if(sr instanceof ScopeLookup){

    }
    console.log(sr);
  });*/
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
})

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
    if(left_var && right_var){
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
  eval:function(other_scp,inf){
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
        /*if(scp_p){
          return this.getNext(scp_p);
        }*/
        //if no currentplayer expect that it is in the
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

      case 'element': //displayable element
        scp = ScopeRef._getScopeRoot();
        while(scp && !(scp instanceof ViewElement)){scp = scp.owner;}
        break;
      case 'timer':
        scp = ScopeRef._getScopeRoot();
        while(scp && !(scp instanceof TimerVariable)){scp = scp.owner;}
        break;
      case 'listel': //reference to the object used for this list element, if showing a list of players the listel for a hook fired inside will be the player used to create it.
        //debugger;
        scp = ScopeRef._getScopeRoot();

        while(scp && !(scp instanceof ListElElement ||  scp instanceof GeolistElElement)){scp = scp.owner;}
        if(scp){
          scp = scp.get('listel');
        }
        break;
      case 'hand':
        //debugger;
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
    if(!scp){
      return null;
    }

    return this.getNext(scp,inf);
  },
  getNext:function(scp,inf){
    if(inf && scp instanceof Variable){
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
        console.log('type mismatch was not');
      }
    }

    return scp;
  }
});

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
  init:function(color_array){

  }
});
