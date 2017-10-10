<?php

class PlayerTable extends Zend_Db_Table_Abstract
{
	protected $_name = 'player';
	protected $_rowClass = 'PlayerRow';

	public static function getFromToken($token,$create_missing=false){
		$t = new PlayerTable();
		$p = $t->fetchRow($t->select()->where('token=?',$token));

		if(!$p && $create_missing){
			$p = $t->createRow();
			$p->token = $token;
			$p->save();
		}
		return $p;
	}
}
