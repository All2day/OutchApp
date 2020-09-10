<?php

class GameTable extends Zend_Db_Table_Abstract
{
	protected $_name = 'game';
	protected $_rowClass = 'GameRow';

	public function find($id = null){
		if(is_numeric($id)){
			return parent::find($id);
		}

		return $this->fetchAll($this->select()->where('name=?',$id)->limit(1));
	}
}
