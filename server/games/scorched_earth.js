exports.game = {
  prototypes:{
    player: {
      bombs:{
        type:"number",
        value:0
      },
      hits:{
        type:"number",
        value:0
      },
      dies:{
        type:"number",
        value:0
      }
    },
    bomb: {
      _owner:{
        type:"player"
      },
      start_pos:{
        type:"pos"
      },
      end_pos:{
        type:"pos"
      },
      timer:{
        type:"timer",
        duration:6000,
        hooks:{
          end:{
            actions:{
              '_1':{
                type:'remove',
                list:'phase.bombs',
                target:'bomb'
              },
              '_give_back_bomb':{
                type:"set",
                target:"bomb._owner.bombs",
                source:"bomb._owner.bombs-1"
              },
              '_players':{
                type:"each",
                list:"players",
                actions:{
                  '_check':{
                    type:"if",
                    condition:"^dist(el.pos,bomb.end_pos) < game.bombSize*0.5",
                    actions:{
                      /*'_0':{
                        type:"alert",
                        text:"'got it'"
                      },*/
                      '_1':{
                        type:"set",
                        target:"el.dies",
                        source:"el.dies+1"
                      },
                      '_2':{
                        type:"set",
                        target:"bomb._owner.hits",
                        source:"bomb._owner.hits+1"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  vars: {
    name: {
      type:"string"
    },
    bombSize:{
      type:"number",
      value:15
    },
    maxBombs:{
      type:"number",
      value:3
    }
  },
  phases:{
    play:{ //play phase
      vars:{
        bombs:{
          type:"list",
          prototype:"bomb"
        }
      }, //end of vars
      views:{
        'map':{
          type:"MapView",
          zoom:"18",
          center:"player.pos",
          rotation:"player.heading",
          elements:{
            'top':{
              type:"label",
              text:"'hits:'+player.hits+' dies:'+player.dies+' bombs left:'+(game.maxBombs - player.bombs)"
            }
          },
          geoElements:{
            'bomber':{
              //show:"^",
              pos:"map.dragpos ? map.dragpos : null",
              type:"circle",
              radius:5,
              color:[0,0,0,0],
              fill:"map.dragging ? 'red' : [0,0,0,0]"
            },
            'player':{
              type:"circle",
              radius:"2",
              pos:"player.pos",
              color:[0,0,255,1],
              zIndex:2,
            },
            'svg':{
              type:"SVG",
              pos:"player.pos",
              color:[0,0,255,1],
              zIndex:2,
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
            },
            'bombs':{
              type:"geolist",
              list:"phase.bombs",
              elements:{
                'bomb':{
                  type:"circle",
                  //pos:"listel.end_pos",
                  pos:"listel.start_pos*(1-listel.timer.ratioDone) + listel.end_pos*(listel.timer.ratioDone)",
                  radius:"game.bombSize*0.5"
                }
              }
            } // end of bombs
          }, //end of map view geo elements
          hooks:{
            dragend:{
              actions:{
                '_if':{
                  type:"if",
                  condition:"player.bombs < game.maxBombs",
                  actions:{
                    '_1':{
                      type:"create",
                      prototype:"bomb",
                      target:"phase.bombs",
                      actions:{
                        '_0':{
                          type:"set",
                          target:"player.bombs",
                          source:"player.bombs+1"
                        },
                        '_1':{
                          type:"set",
                          target:"bomb._owner",
                          source:"player"
                        },
                        '_2':{
                          type:"set",
                          target:"bomb.start_pos",
                          source:"player.pos"
                        },
                        '_3':{
                          type:"set",
                          target:"bomb.end_pos",
                          source:"player.pos + player.pos - element.dragpos"
                        },
                        '_4':{
                          type:"start",
                          timer:"^bomb.timer"
                        }
                      }
                    }//end of bomb create
                  }
                }

              }
            }
          }
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
            'gamename':{
              type:"label",
              text:"'spillets navn:'+game.name"
            },
            'players':{
              type:'list',
              list:'players',
              elements:{
                0:{
                  type:"label",
                  text:"listel.id+':'+(listel.hits)+'/'+(listel.dies)",
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
