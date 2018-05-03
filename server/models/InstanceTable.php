<?php

class InstanceTable extends Zend_Db_Table_Abstract
{
	protected $_name = 'instance';
	protected $_rowClass = 'InstanceRow';

	public static function getFromToken($token){
		$t = new InstanceTable();
		$p = $t->fetchRow($t->select()->where('token=?',$token));

		return $p;
	}

	public static function findById($instance_id){
		$t = new InstanceTable();
		$p = $t->find($instance_id)->current();

		return $p;
	}


	public static function startInstance($game_id,$owner, $name,$pos){
    $db = Zend_Db_Table_Abstract::getDefaultAdapter();
		$gameTable = new GameTable();
		$game = $gameTable->find($game_id)->current();


		//create a new instance
		$instanceTable = new InstanceTable();
		$instance = $instanceTable->createRow();
    $instance->status = 'created';
		$instance->game_id = $game_id;
		$instance->version = $game->version;
		$instance->owner = $owner->player_id;
		//TODO: check that the token does not already exist in a running game
		$instance->token = md5(uniqid(rand(), true));

		$instance->name = $name;

    $instance->save();

		$instance->setPos($pos);

    //find free port

    $sql = "SELECT max(port) FROM `instance` WHERE status = 'running'";

    $db->query('LOCK TABLES `instance` WRITE');
    $port = $db->fetchOne($sql);
    if(!$port){
			if(preg_match("/^(.*\.)?(geogames\.all2day)\.dk.*/",$_SERVER['SERVER_NAME'])){
				$port = 9000;
			} else {
				$port = 9500;
			}

    }
    $instance->port = $port+1;
    $instance->save();
    $db->query('UNLOCK TABLES');


    //$instance->url = 'http://geogames.all2day.dk:'.$instance->port;
		$instance->url = 'http://'.$_SERVER['HTTP_HOST'].':'.$instance->port;
		$instance->start();

    return $instance;
  }
}
