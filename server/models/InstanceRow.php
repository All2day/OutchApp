<?php
class InstanceRow extends Zend_Db_Table_Row_Abstract{
	public function start(){
		$game = $this->getGame();

		$control_url = 'http://'.$_SERVER['HTTP_HOST'].'/instance/'.$this->token;

		$command = 'node ../gameServer '.($this->instance_id).' '.($this->port*1).' '.($game->name).' '.($control_url);

		if (substr(php_uname(), 0, 7) == "Windows"){
			//die('starting local');
			set_time_limit(5);
      pclose(popen("start \"instance_".$this->instance_id."\" /B ". $command.'> cache/log/instance_'.$this->instance_id.'.log', "r"));

			$this->pid = 0;

			$this->status = 'starting';
    } else {
			exec('nohup '.$command.'> cache/log/instance_'.$this->instance_id.'.log 2>&1 & echo $!' ,$op);

			$pid = (int)$op[0];
			$this->pid = $pid;

			if($this->isProcessRunning()){
				$this->status = 'starting';
			} else {
				$this->status = 'error';
			}
		}
		$this->save();


	}

	public function getGame(){
		$gameTable = new GameTable();
		$game = $gameTable->find($this->game_id)->current();
		return $game;
	}

	public function isProcessRunning(){
		//in windows default to true
		if (substr(php_uname(), 0, 7) == "Windows"){
			if($this->pid){
				exec('tasklist /FI " PID eq '.($this->pid).'"',$op);
				$res = implode($op," ");
				if(preg_match('/\b'.$this->pid.'\b/',$res)){
					return true;
				}
				return false;
				//Zend_Debug::dump();

				//exit;
			} else {
				//look into the port
				exec('netstat -na | find "'.$this->port.'"',$op);
				if(count($op) == 0){
					return false; //best guess
				}
				Zend_Debug::dump($op);
				exit;
				return true; //at least the port is taken
			}

			return true;
		}
		$command = 'ps -p '.$this->pid;
    exec($command,$op);
    if (!isset($op[1])) return false;
    else return true;
	}

	public function stop(){
		if (substr(php_uname(), 0, 7) == "Windows"){
			$command = "taskkill /pid ".$this->pid." /f";
		} else {
			$command = 'kill '.$this->pid;
		}
		exec($command);
    if ($this->isProcessRunning() == false){
			$this->status = 'stopped';
			$this->save();
			return true;
		}
    else return false;

	}

	public function getPlayer($player_id){
		$db = $this->getTable()->getAdapter();
		$sql = "SELECT * FROM instance_player WHERE instance_id =  ".$db->quote($this->instance_id)." AND player_id=".$db->quote($player_id);

		$ip = $db->fetchRow($sql);


		return $ip;
	}

	public function getOwner(){
		$t = new PlayerTable();
		return $t->find($this->owner)->current();
	}

	public function getPlayers(){
		$db = $this->getTable()->getAdapter();
		$sql = "SELECT * FROM instance_player WHERE instance_id =  ".$db->quote($this->instance_id);

		$res = $db->fetchAll($sql);

		$ips = array();

		foreach($res as $r){
			$ips[$r['player_id']] = $r;
		}


		return $ips;
	}

	public function addPlayer($p){
		$db = $this->getTable()->getAdapter();
		$db->query("LOCK TABLES instance_player WRITE");

		$ip = $this->getPlayer($p->player_id);

		if($ip){
			$db->query('UNLOCK TABLES');
			//throw new Exception('cannot add player, already existing');
		} else {

			$sql = "INSERT INTO instance_player (instance_id, player_id, status) VALUES (".$db->quote($this->instance_id).",".$db->quote($p->player_id).",'created')";

			$db->query($sql);

			$db->query('UNLOCK TABLES');
		}

		//add to the server
		$r = null;
		if($r = $this->message('join',$p->getObject())){
			$sql = "UPDATE instance_player SET status='joined' WHERE instance_id =  ".$db->quote($this->instance_id)." AND player_id=".$db->quote($p->player_id);

			$db->query($sql);
		};

		$ip = $this->getPlayer($p->player_id);

		$ip['r'] = $r;

		return $ip;
	}

	public function updatePlayer($player){
		//find the player
		$ip = $this->getPlayer($player->player_id);

		//TODO: if the player last ping is to old, update the status and remove the player
		//Possibly it should be
	}

	public function setPlayerStatus($player_id,$status){
		$db = $this->getTable()->getAdapter();
		//find the player
		$ip = $this->getPlayer($player_id);

		if(!$ip){
			throw new Exception('no such player for this instance');
		}
		$sql = "UPDATE instance_player SET status=".$db->quote($status)." WHERE instance_id =  ".$db->quote($this->instance_id)." AND player_id=".$db->quote($player_id);

		$db->query($sql);


	}

	public function message($message,$params){
		if($this->status!='running'){
			//If loaded in windows, we dont know the process_id and there we dont know id the server is actually started, thus wait a bit for it to start
			$t = 0;
			while($this->status == 'starting' && $t < 30){
				$t++;
				usleep(200000); //0.2s
				$this->refresh();
			}
			if($this->status != 'running'){
				throw new Exception('Cannot message a server if it is not running:'.$this->status);
			}
		}

		$data_string = rawurlencode(json_encode($params));

		$ch = curl_init();
		$url = $this->url.'/message/'.urlencode($message).'?'.$data_string;

		//if using local server on windows, replace the geogames.localhost with 127.0.0.1 to make it through
		/*$url = preg_replace('/geogames.localhost/','127.0.0.1',$url);
		Zend_Debug::dump($url);
		echo ($data_string);
		$url = 'http://geogames.localhost:9023/message/join?{"hej":"fisk","fds":"sfd"}';
		$url = 'http://geogames.localhost:9023/message/join?'.rawurlencode('{"player_id":"3","type":"guest","name":"mads","token":"mads","created":"20171 005094316"}');
			Zend_Debug::dump($url);*/
		curl_setopt($ch, CURLOPT_URL, $url);
		//curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		//curl_setopt($ch, CURLOPT_PORT , 9023); //not doing anything
		//curl_setopt($ch, CURLOPT_POSTFIELDS, $data_string);
		curl_setopt($ch, CURLOPT_HTTPHEADER, array(
			'Content-Type: application/json',
			'Expect:'
			//'Content-Length: ' . strlen($data_string))
		));
		$result = curl_exec($ch);


		if(!$result){
			Zend_Debug::dump(curl_getinfo($ch));
			Zend_Debug::dump(curl_error($ch));
		}
		curl_close($ch);
		//die($this->url.'/message/'.urlencode($message).'?'.$data_string);
		//Zend_Debug::dump($this->url.'/message/'.urlencode($message).'?'.$data_string);
		$res = json_decode($result,true);
		//Zend_Debug::dump($res);
		//exit;

		return $res;
	}

	public function getObject(){
		$o = $this->toArray();

		return $o;
	}
}
