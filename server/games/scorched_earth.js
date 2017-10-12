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
      },
      pos:{
        type:"pos"
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
        duration:"game.bombDuration*1000",
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
    bombDuration:{
      type:"number",
      value:6
    },
    maxBombs:{
      type:"number",
      value:3
    }
  },
  phases:{
    join:{
      //normal join phase, though there should be exactly two players
      views:{
        '_1':{
          type:'page',
          title:"'Setup'",
          elements:{

            'map':{
              type:'MapView',
              //width:80,
              height:20,
              zoom:"'fit'",
              center:"players.gameowner.pos",
              heading:"players.gameowner.heading",
              geoElements:{
                'players':{
                  type:"geolist",
                  list:"players",
                  elements:{
                    'p':{
                      type:"circle",
                      radius:"2",
                      fill:"'blue'",
                      pos:"listel.pos"
                    }
                  }
                }
              }
            },//end of map
            'gamename':{
              show:"player != players.gameowner",
              type:"label",
              text:"'spillets navn:'+game.name"
            },
            'input':{
              show:"player = players.gameowner",
              type:"input",
              default:"'fedt navn'",
              hooks:{
                change:{
                  actions:{
                    '_1':{
                      type:"set",
                      target:"game.name",
                      source:"element.value"
                    }
                  }
                }
              }
            },
            'delay':{
              type:"label",
              text:"'Bombe flyvetid:'+game.bombDuration+'s'"
            },
            'bombDurationSlider':{
              show:"player = players.gameowner",
              type:"slider",
              default:"game.bombDuration",
              min:3,
              max:10,
              hooks:{
                change:{
                  actions:{
                    '_1':{
                      type:"set",
                      target:"game.bombDuration",
                      source:"^element.value"
                    }
                  }
                }
              }
            },
            'maxBombs':{
              type:"label",
              text:"'Antal bomber:'+game.maxBombs"
            },
            'maxBombsSlider':{
              show:"player = players.gameowner",
              type:"slider",
              default:"game.maxBombs",
              min:1,
              max:10,
              hooks:{
                change:{
                  actions:{
                    '_1':{
                      type:"set",
                      target:"game.maxBombs",
                      source:"^element.value"
                    }
                  }
                }
              }
            },
            'players':{
              type:'list',
              list:'players',
              elements:{
                0:{
                  type:"label",
                  text:"listel.name",
                  /*hooks:{
                    click:{
                      actions:{
                        '_set':{
                          type:"set",
                          target:"game.name",
                          source:"listel.id"
                        }
                      }
                    }
                  }*/
                }
              }
            },

            '_1':{
              type:'bottombutton',
              text:"'Start game'",
              show:"player = players.gameowner",
              hooks:{
                click:{
                  actions:{
                    '_1':{
                      type:"startphase",
                      phase:"play"

                    }
                  }
                }
              }
            },
            '_2':{
              type:'bottombutton',
              text:"'Waiting...'",
              show:"player != players.gameowner",
            }
          }
        }
      },
      vars:{

      },
      hooks:{

      }
    },
    play:{ //play phase
      vars:{
        bombs:{
          type:"list",
          prototype:"bomb"
        },
        stopTimer:{
          type:"timer",
          duration:300000, // 5 min
          hooks:{
            end:{
              actions:{
                '_1':{
                  type:'startphase',
                  phase:'scoreboard'
                }
              }
            }
          }
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
            },
            't':{
              type:"timer",
              timer:"phase.stopTimer"
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
                  //pos:"listel.start_pos*(1-listel.timer.ratioDone) + listel.end_pos*(listel.timer.ratioDone)",
                  pos:"listel.start_pos + (listel.end_pos - listel.start_pos)*(listel.timer.ratioDone)",
                  radius:"game.bombSize*0.5"
                },
                'svgbomb':{
                  type:"SVG",
                  //radius:"game.bombSize*0.5",
                  pos:"listel.start_pos + (listel.end_pos - listel.start_pos)*(listel.timer.ratioDone)",
                  scale:"game.bombSize/100",
                  rotation:"now*0.005 + listel.timer.ratioDone",
                  svg:'<svg width="100" height="100" version="1.1" xmlns="http://www.w3.org/2000/svg">'
                    + '<path stroke="red" id="svg_1" fill="none" stroke-width="4" d="m42.2952,54.35156c0,0 -1.91882,0 -1.91882,0c0,4.36263 1.91882,8.72526 4.79705,8.72526c7.67528,0 14.39114,-4.36263 14.39114,-8.72526c0,-10.47031 -6.71587,-17.45052 -14.39114,-17.45052c-13.43173,0 -23.98524,6.98021 -23.98524,17.45052c0,13.96042 10.55351,26.17578 23.98524,26.17578c18.22878,0 33.57934,-12.21536 33.57934,-26.17578c0,-20.0681 -15.35055,-34.90104 -33.57934,-34.90104c-23.98524,0 -43.17343,14.83294 -43.17343,34.90104c0,23.5582 19.18819,43.6263 43.17343,43.6263c28.78229,0 52.76753,-20.0681 52.76753,-43.6263c0,-29.66588 -23.98524,-52.35156 -52.76753,-52.35156"/>'
                    + '</svg>',
                  zIndex:2,
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
            '_1':{
              type:'start',
              timer:'phase.stopTimer'
            }
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
                  text:"listel.id+':'+(listel.hits)+'/'+(listel.dies)+ 'total distance:'+listel.total_distance",
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
