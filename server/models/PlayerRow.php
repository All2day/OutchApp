<?php
class PlayerRow extends Zend_Db_Table_Row_Abstract{
  public function getObject(){
    $o = $this->toArray();

    unset($o['password']);

    return $o;
  }
}
