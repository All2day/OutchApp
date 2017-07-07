//The Risk Game
var game = {
  prototypes:{
    fisk:{
      name:{
        type:'string',
        value:"'default'"
      },
      t2:{
        type:'timer',
        duration:500,
        hooks:{
          end:{
            actions:{
              1:{
                type:"alert",
                text:"fisk.name"
              }
            }
          }
        }
      }
    }
  },
  vars: {
    name: {
      type:"string",
      value:"'fisk2'"
    },
    center: {
      type: "pos"
    },
    dir:{
      type:"number",
      value:'8'
    },
    dir2:{
      type:"number",
      value:'10'
    },
    the_fisk:{
      type:"fisk"
    },
    fisk_list:{
      type:"list",
      prototype:"fisk"
    }
  },
  phases:{
    play:{
      vars:{
        players: {
          type:"list",
          prototype:"fisk"
        },
        t1: {
          type:"timer",
          duration:500,
          hooks:{
            end:{
              actions:{
                1:{
                  type:"alert",
                  text:"game.fisk_list.first.name"
                }
              }
            }
          }
        }
      }, // End of views
      hooks:{
        start:{
          actions:{
            1:{
              type:"create",
              prototype:"fisk",
              target:"game.fisk_list",
              actions:{
                1:{
                  type:"set",
                  target:"name",
                  source:"game.dir"
                },
              }
            },
            /*1:{
              type:"alert",
              text:"game.dir > game.dir2"
            },*/
            2:{
              type:"start",
              timer:"phase.t1"
            }
          }
        }
      }
    },
    scoreboard:{

    }
  }
};
