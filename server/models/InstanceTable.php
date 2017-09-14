<?php

class InstanceTable extends Zend_Db_Table_Abstract
{
	protected $_name = 'instance';
	protected $_rowClass = 'InstanceRow';

  public static function startInstance($game_id){
    $db = Zend_Db_Table_Abstract::getDefaultAdapter();
    //create a new instance
		$instanceTable = new InstanceTable();
		$instance = $instanceTable->createRow();
    $instance->status = 'created';
		$instance->game_id = $game_id;
    $instance->save();

    //find free port

    $sql = "SELECT max(port) FROM `instance` WHERE status = 'running'";

    $db->query('LOCK TABLES `instance` WRITE');
    $port = $db->fetchOne($sql);
    if(!$port){
      $port = 9000;
    }
    $instance->port = $port+1;
    $instance->save();
    $db->query('UNLOCK TABLES');

    $instance->url = 'http://geogames.all2day.dk:'.$instance->port;

		$instance->start();

    return $instance;
  }
}
