//The Slither Game
exports.game = {
  prototypes:{
    player: {
      size:{
        type:"number",
        value:2 /*number of seconds the tail follows you*/
      },
      tail:{
        type:"list",
        prototype:"point"
      },
      pos:{
        type:"pos",
        hooks:{
          change:{
            actions:{
              '_1':{
                type:"set",
                target:"^player.tail"
              }
            }
          }
        }
      }
    },
    point:{
      pos:{
        type: "pos"
      }
    }
  },
  phases:{
    play:{ //play phase
      vars:{

      },
      views:{
        1:{
          type:"MapView",
          zoom:"19",//"'fit'",
          center:"player.pos",
          elements:{
            /*'test':{
              type:"timer",
              timer:"player.nextCard"
            }*/
          },
          geoElements:{
            'player':{
              type:"circle",
              radius:"2",
              pos:"player.pos",
              rotation:"player.heading",
              color:[0,0,255,1],
              zIndex:2,
              //fill:[0,0,255,0.4]
              fill:"'blue'",
              geoElements:{
                'tri':{
                  type:"box",
                  pos:[0,3],
                  width:1,
                  height:2,
                  color:[0,0,255,1],
                  zIndex:2
                },
                'tail':{
                  type:"geolist",
                  list:"player.tail",
                  elements:{
                    1:{
                      type:"circle",
                      radius:"1",
                      pos:"listel.pos",
                      color:[0,255,0,1]
                    }
                  }
                }
              }
            },
            'list of players':{ //The player cards
              type:"geolist",
              list:"players.others",
              elements:{
                1:{
                  type:"circle",
                  radius:"1",
                  zIndex:1,
                  pos:"listel.pos",
                  color:[0,255,0,1],
                  fill:[0,255,0,0.4]
                }
              }
            }
          } //end of map view geo elements
        }, //End of map view
      }, // End of views
      hooks:{
        start:{
          actions:{
          }
        } //end of start hook
      }
    },
    scoreboard:{
      views:{
        '_1':{
          type:'page',
          elements:{
            'players':{
              type:'list',
              list:'players',
              elements:{
                0:{
                  type:"label",
                  text:"listel.id+':'+(listel.hand.count=0 ? ' winner!!!':' looser:'+listel.hand.count) + ' total distance:'+listel.total_distance+'m'",
                }
              }
            },
            'exit':{
              type:'button',
              text:'"exit"',
              hooks:{
                click:{
                  actions:{
                    '_1':{
                      type:"exit"
                    }
                  }
                }
              }
            }
          }

        }//end of page
      }
    }
  }
}; //end of game
