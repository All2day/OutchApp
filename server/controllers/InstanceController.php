<?php

/**
 * InstanceController
 */
class InstanceController extends Zend_Controller_Action
{
	private $instance = null;
	private $postdata = null;

	private $res = null;

	public function init(){
		$token = $this->_getParam('token');

		if(!$token && isset($_SERVER['HTTP_X_INSTANCE_TOKEN'])){
			$token = $header_token = $_SERVER['HTTP_X_INSTANCE_TOKEN'];
			//die($token);
		} else {
			//die('no token');
		}

		All2day_Log::action('instance',0,$token);

		$this->instance = InstanceTable::getFromToken($token);

		if(!$this->instance){
			die('could not find with token:'.$token. ' '. $header_token);
		}

		$rawpost = file_get_contents("php://input");
		$this->postdata = json_decode($rawpost,true);

		$this->res = array(
			'status' => 'ok'
		);

		$layout = Zend_Layout::getMvcInstance();
    $layout->setLayout('empty');
	}

	protected function _getParam($key,$def = NULL){
		if($this->postdata !== NULL && isset($this->postdata[$key])){
			return $this->postdata[$key];
		}
		return parent::_getParam($key,$def);
	}

	protected function _isJson(){
		return $this->postdata !== NULL;
	}

	public function postDispatch(){
		header('Access-Control-Allow-Origin: *');
		header('Content-Type: application/json');
		die(json_encode($this->res));
	}

	/**
	 * indexAction
	 *
	 * @return void
	 */
	public function indexAction(){

	}

	public function infoAction(){
		$this->res['instance'] = $this->instance->toArray();
	}

	public function updateAction(){
		$status = $this->_getParam('status');
		$settings = $this->_getParam('settings');
		$results = $this->_getParam('results');
		$phase = $this->_getParam('phase');
		$process_id = $this->_getParam('process_id');



		$this->res['data'] = $this->postdata;
		$this->res['phase'] = $phase;
		$this->instance->status = 'running';

		if(!$this->instance->pid){
			$this->instance->pid = $process_id;
		}
		if($phase){
			$this->instance->currentPhase = $phase;

			if($settings){
				$this->instance->settings_obj = json_encode($settings);
			}

			if($results){
				$ips = $this->instance->getPlayers();

				foreach($results as $token => $result){
					$p = PlayerTable::getFromToken($token);
					$this->instance->setPlayerResult($p->player_id,$result);

					unset($ips[$p->player_id]);
				}
			}
		} else {

			$live_players = 0;
			$ips = $this->instance->getPlayers();
			$players = $this->_getParam('players');
			if($players){
				foreach($players as $player){
					//get player_id from token
					$p = PlayerTable::getFromToken($player['token']);
					$player['player_id'] = $p->player_id;


					if($ips[$p->player_id]['status'] !== $player['status']){
						$this->instance->setPlayerStatus($p->player_id, $player['status']);
					}

					unset($ips[$p->player_id]);

					if($player['status'] === 'joined'){
						$live_players++;
					}
					//$this->instance->setPlayerStatus($p->player_id, $player['status']);
				}
			}

			foreach($ips as $player_id => $ip){
				if($ip['status'] == 'exited'){
					continue;
				}

				//give newly joined users 30s to actually join
				if($ip['status'] == 'created' && strtotime($ip['start']) > time()-30){
					$live_players++;
				} else {
					//otherwise count them as timeouts
					$this->instance->setPlayerStatus($player_id, 'timeout');
				}
			}

			//check the number of players. If there have been players but all have exited, stop the game
			if(!$live_players){
				//end the geogames
				$this->instance->stop();
				//Zend_Debug::dump($ips);
				//Zend_Debug::dump($live_players);
				//die('is stopped');
			}
		}

		$this->instance->last_ping = new Zend_Db_Expr('NOW()');
		$this->instance->save();

	}

}
