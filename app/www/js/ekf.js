window.efk = {
  X_hat: null,
  A: null,
  C: null,
  P: null,
  G: null,
  T0: null,
  T_last:null,
  T_last_print:null,
  started: false,

  accelerationUpdate: function(a){

    if(efk.T0 === null){
      efk.T_last = a.timestamp;
      efk.T0 = a.timestamp;
      efk.T_last_print = a.timestamp;
      return;
    }

    if(efk.T_last == a.timestamp){
      //console.log('same timestamp');
      return;
    }

    //setup
    var dT = 0.001*(a.timestamp - efk.T_last);
    efk.T_last = a.timestamp;

    var twodivdTsquared = 2/(dT*dT);
    efk.A = math.matrix([[1,0,0,dT,0,0],
                         [0,1,0,0,dT,0],
                         [0,0,1,0,0,dT],
                         [0,0,0,1,0,0],
                         [0,0,0,0,1,0],
                         [0,0,0,0,0,1]]);
    efk.C = math.matrix([[-twodivdTsquared,0,0,2/dT,0,0],
                        [0,-twodivdTsquared,0,0,2/dT,0],
                        [0,0,-twodivdTsquared,0,0,2/dT]]);

    efk.Z = math.matrix([a.x,a.y,a.z-9.81]);

    //predict
    efk.X_hat = math.multiply(efk.A,efk.X_hat);

    efk.P = math.multiply(math.multiply(efk.A,efk.P),math.transpose(efk.A));

    //update
    //G = P*Ct*(C*P*Ct+R)^-1
    efk.G = math.multiply(
              math.multiply(
                efk.P,
                math.transpose(efk.C)
              ),
              math.inv(
                math.add(
                  math.multiply(
                    math.multiply(
                      efk.C,
                      efk.P
                    ),
                    math.transpose(efk.C)
                  ),
                  efk.R
                )
              )
            );
    efk.X_hat = math.add(efk.X_hat,math.multiply(efk.G,math.subtract(efk.Z,math.multiply(efk.C,efk.X_hat))));
    efk.P = math.multiply(math.subtract(math.eye(6),math.multiply(efk.G,efk.C)),efk.P);

    if(a.timestamp - efk.T_last_print > 500 || efk.show_all_calculations || true ){
      var total_a = math.norm(efk.Z);
      //var total_efk_a = math.norm(math.matrix([efk.X_hat.get([3]),efk.X_hat.get([4]),efk.X_hat.get([5])]));
      var total_efk_a = math.norm(math.subset(efk.X_hat,math.index([3,4,5])));
      console.log('total acceleration:'+total_a+","+total_efk_a);
      efk.T_last_print = a.timestamp;
      console.log('Acceleration ' + efk.Z.toString() + '\n' +
            'Timestamp: '      + a.timestamp + '\n');

      console.log(efk.X_hat.toString());
    }
  },
  accelerationError: function(e){
    alert('a error');
  },
  initialize: function(){


    efk.X_hat =  math.matrix([0,0,0,0,0,0]); //dist,vel
    efk.P = math.eye(6);//math.matrix([[1,0],[0,1]]);
    efk.R = math.matrix([[0.01,0,0],
                         [0,0.01,0],
                         [0,0,0.01]]);


    if(!navigator.accelerometer){
      console.log('could not start EFK');
      efk.show_all_calculations = true;
      efk.accelerationUpdate({x:0.045,y:-0.065,z:9.81-0.03,timestamp:4017});
      efk.accelerationUpdate({x:0.045,y:0.34,z:9.81-0.03,timestamp:4309});
      efk.accelerationUpdate({x:0.055,y:0.196,z:9.81-0.020,timestamp:4437});
      efk.accelerationUpdate({x:0.045,y:-0.022,z:9.81-0.039,timestamp:4490});
      efk.accelerationUpdate({x:0.060,y:0.59,z:9.81,timestamp:4617});
      efk.accelerationUpdate({x:0.074,y:0.37,z:9.81-0.13,timestamp:4730});
      efk.accelerationUpdate({x:0.239,y:0.148,z:9.81+0.007,timestamp:4791});
      efk.accelerationUpdate({x:0.045,y:0.045,z:9.81+0.2,timestamp:4909});
      efk.accelerationUpdate({x:-0.026,y:-0.527,z:9.81+0.179,timestamp:5029});
      efk.accelerationUpdate({x:0.0,y:-0.143,z:9.81-0.039,timestamp:5089});
      
      return;

      efk.accelerationUpdate({x:0.0,y:0.0,z:9.81,timestamp:0});
      efk.accelerationUpdate({x:0.0,y:0.0,z:9.81,timestamp:100});
      efk.accelerationUpdate({x:0.0,y:0.0,z:9.81,timestamp:200});
      efk.accelerationUpdate({x:0.0,y:0.0,z:9.81,timestamp:300});
      efk.accelerationUpdate({x:0.0,y:0.0,z:9.81,timestamp:400});
      efk.accelerationUpdate({x:0.0,y:0.0,z:9.81,timestamp:500});
      efk.accelerationUpdate({x:0.0,y:0.0,z:9.81,timestamp:600});
      efk.accelerationUpdate({x:0.0,y:0.0,z:9.81,timestamp:700});
      efk.accelerationUpdate({x:0.0,y:0.0,z:9.81,timestamp:800});
      efk.accelerationUpdate({x:0.0,y:0.0,z:9.81,timestamp:900});
      efk.accelerationUpdate({x:0.0,y:0.1,z:9.81,timestamp:1000});
      efk.accelerationUpdate({x:0.1,y:0.0,z:9.80,timestamp:1200});
      efk.accelerationUpdate({x:0.1,y:-0.1,z:9.82,timestamp:1300});
      efk.accelerationUpdate({x:-0.1,y:-0.1,z:9.80,timestamp:1400});
      efk.accelerationUpdate({x:0.2,y:0.1,z:9.79,timestamp:1500});
      return;
    }



    //efk.start();


  },
  start: function(){
    var options = { frequency: 100 };
    efk.accelerationWatchID = navigator.accelerometer.watchAcceleration(efk.accelerationUpdate, efk.accelerationError, options);
    efk.started = true;
    /*
    var watchId = navigator.geolocation.watchPosition(function(pos){
      console.log(pos.coords.longitude+","+pos.coords.latitude+","+pos.coords.heading);
      //app.map.getView().setZoom(12);

      app.playerPoint = new ol.geom.Point(ol.proj.transform([pos.coords.longitude, pos.coords.latitude], 'EPSG:4326', 'EPSG:3857'));

      //app.map.getView().setCenter(ol.proj.transform([pos.coords.longitude, pos.coords.latitude], 'EPSG:4326', 'EPSG:3857'));

      //app.map.getView().setRotation(pos.coords.heading*Math.PI*2/360);
      //app.map.render();

      console.log('all set');
    },
      function(err){
        console.log(err);
      },
      {enableHighAccuracy: true, timeout:1000,maximumAge:0});
    */
    console.log('efk started');
  },

  stop: function(){
    navigator.accelerometer.clearWatch(efk.accelerationWatchID);

    efk.started = false;
    console.log('efk stopped');
  }
}
