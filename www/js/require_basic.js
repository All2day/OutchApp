/* Simulate basic require functionality to allow both uses within cordova and node*/
window.require = function(file,force_request){

  if(!file.match(/.js(\?.*)?$|^http\:.*/)){
    file = file+'.js';
  }
  var m = file.match(/^\.\/(.*)/);
  if(m){
    file = 'js/'+m[1];
  }
  if(!require.cache){
    require.cache = {};
  }
  if(require.cache[file]){
    //do nothing
    return require.cache[file];
  }
  console.log('loading file:'+file);
  //debugger;
  window.global = null;

  window.exports = {};
  window.module = {

  };

  //if document is already loaded, use a http request
  if(document.readyState === "complete" || true){
    var request = new XMLHttpRequest();
    request.open('GET', file, false);
    request.send();
    if (request.readyState != 4){
      debugger;
      return;
    }
    if (request.status != 200){
      console.log('could not load source file:'+file);
      return false;
    }

    eval(request.responseText);
  } else {
    //if ready state is not yet complete adding the file directly will make it load
    //synchronously and keep it for fx. chrome dev
    $('<script>')
      .attr('type', 'text/javascript')
      .attr('src',file)
      .attr('async',false)
      .appendTo('head');
  }
  require.cache[file] = exports;
  return exports;
};
