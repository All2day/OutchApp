<?php
class InstanceRow extends Zend_Db_Table_Row_Abstract{
	public function start(){
		$command = 'nohup '.'node ../gameServer '.($this->instance_id).' '.($this->port*1).' > cache/log/instance_'.$this->instance_id.'.log 2>&1 & echo $!';
		exec($command ,$op);

		$pid = (int)$op[0];
		$this->pid = $pid;

		$this->save();

		if($this->isProcessRunning()){
			$this->status = 'running';
		} else {
			$this->status = 'error';
		}
		$this->save();
	}

	public function isProcessRunning(){
		$command = 'ps -p '.$this->pid;
    exec($command,$op);
    if (!isset($op[1])) return false;
    else return true;
	}

	public function stop(){
		$command = 'kill '.$this->pid;
    exec($command);
    if ($this->isProcessRunning() == false){
			$this->status = 'stopped';
			$this->save();
			return true;
		}
    else return false;
	}
}
