
<?php
/**
 * IndexController
 */
class IndexController extends Zend_Controller_Action{
	private $postdata = NULL;

	public function init(){
		header('Access-Control-Allow-Origin: *');
		header('Content-Type: application/json');
		$_SESSION['debug'] = true;

		$rawpost = file_get_contents("php://input");
		$this->postdata = json_decode($rawpost,true);

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

	public function preDispatch(){
	}

	/**
	 * indexAction
	 * The method called when first loading the site
	 *
	 * @return void
	 */
	public function indexAction(){
		die('asfd');
		header('Access-Control-Allow-Origin: *');
		header('Content-Type: application/json');
		die(json_encode($res));
	}

	public function startAction(){
		header('Access-Control-Allow-Origin: *');
		header('Content-Type: application/json');
		$game_id = $this->_getParam('game_id');
		$token = $this->_getParam('token');
		$p = PlayerTable::getFromToken($token);
		$name = $this->_getParam('name');

		if(!$p){
			throw new Exception('no such player');
			exit;
		}

		$instance = InstanceTable::startInstance($game_id,$p, $name);

		$res = array(
			'instance_id' => $instance->instance_id,
			'url' => $instance->url
		);

		die(json_encode($res));
	}

	public function stopAction(){
		$instance_id = $this->_getParam('instance_id');
		$instanceTable = new InstanceTable();
		$instance = $instanceTable->find($instance_id)->current();

		$res = array(
			'status' => 'ok'
		);

		if(!$instance){
			$res['status'] = 'error';
			$res['error'] = 'could not find instance with id:'.$instance_id;
		} else {
			if($instance->stop()){
				$res['instance_status'] = $instance->status;
			} else {
				$res['instance_status'] = $instance->status;
				$res['status'] = 'error';
				$res['error'] = 'could not stop instance';
			}
		}
		header('Access-Control-Allow-Origin: *');
		header('Content-Type: application/json');
		die(json_encode($res));
	}

	public function listinstancesAction(){
		$instanceTable = new InstanceTable();

		$instances = $instanceTable->fetchAll(
			$instanceTable->select()
			->where('status=?','running')
			->where('currentPhase=?','join')
		);
		$ins = array();

		foreach($instances as $instance){
			$i = $instance->toArray();
			$i['owner'] = $instance->getOwner();
			$i['playercount'] = count($intance->getPlayers());
			$ins[] = $i;
		}

		$res = array(
			'status' => 'ok',
			'instances' => $ins
		);

		header('Access-Control-Allow-Origin: *');
		header('Content-Type: application/json');
		die(json_encode($res));
	}


	public function listgamesAction(){
		$gameTable = new GameTable();
		$games = $gameTable->fetchAll($gameTable->select());

		$res = array(
			'status' => 'ok',
			'games' => $games->toArray()
		);

		header('Access-Control-Allow-Origin: *');
		header('Content-Type: application/json');
		die(json_encode($res));
	}

	public function gamesrcAction(){
		$game_id = $this->_getParam('game_id');

		$game_name = ''.$game_id;
		if(is_numeric($game_id)){

			$gameTable = new GameTable();
			$game = $gameTable->find($game_id)->current();
			$game_name = $game['name'];
		}
		header('Access-Control-Allow-Origin: *');
		header('Content-Type: text/javascript');

		echo file_get_contents('games/'.$game_name.'.js');
		exit;
	}

	public function gameAction(){
		$token = $this->_getParam('token',null);
		if($token) {
			$p = PlayerTable::getFromToken($token);
		} else {
			$p = null;
		}


		$game_id = $this->_getParam('game_id');

		$gameTable = new GameTable();
		$game = $gameTable->find($game_id)->current();

		$game = $game->toArray();

		//$game['src'] = 'http://'.$_SERVER['HTTP_HOST'].'/games/'.($game['name']).'.js?v='.urlencode($game['version']);
		$game['src'] = 'http://'.$_SERVER['HTTP_HOST'].'/index/gamesrc/game_id/'.($game['game_id']).'?v='.urlencode($game['version']);


		$instanceTable = new InstanceTable();
		$instances = $instanceTable->fetchAll($instanceTable->select()
			->where('status=?','running')
			->where('game_id=?',$game_id)
			->where('currentPhase=?','join'));


		$ins = array();
		foreach($instances as $instance){
			$i = $instance->toArray();
			$i['control'] = $p && $i['owner'] == $p['player_id']; //can this user control this instance
			$i['owner'] = $instance->getOwner()->getObject();

			$i['playercount'] = count($instance->getPlayers());


			$ins[] = $i;
		}

		$game['instances'] = $ins;
		$res = array(
			'status' => 'ok',
			'game' => $game
		);

		header('Access-Control-Allow-Origin: *');
		header('Content-Type: application/json');
		die(json_encode($res));
	}

	/**
	 * Simply checks the token and returns the player
	 * If the player does not exist return a guest player with no name
	 */
	public function loginAction(){
		$token = $this->_getParam('token');

		$p = PlayerTable::getFromToken($token,true);

		$res = array(
			'status' => 'ok',
			'player' => $p->getObject()
		);

		header('Access-Control-Allow-Origin: *');
		header('Content-Type: application/json');
		die(json_encode($res));
	}

	public function updateplayerAction(){
		$token = $this->_getParam('token');

		$name = $this->_getParam('name');

		$p = PlayerTable::getFromToken($token);

		$res = array(
			'status' => 'ok'
		);

		if(!$p){
			$res['status'] = 'error';
			$res['error'] = 'Token mismatch';
		} else {
			$p->name = $name;
			$p->save();

			$res['player'] = $p->getObject();
		}

		header('Access-Control-Allow-Origin: *');
		header('Content-Type: application/json');
		die(json_encode($res));
	}

	public function joininstanceAction(){
		$token = $this->_getParam('token');

		$instance_id = $this->_getParam('instance_id');

		$p = PlayerTable::getFromToken($token);
		$instance = InstanceTable::findById($instance_id);

		$res = array(
			'status' => 'ok'
		);

		if(!$p){
			$res['status'] = 'error';
			$res['error'] = 'Token mismatch';
		} else
		if(!$instance){
			$res['status'] = 'error';
			$res['error'] = 'No such instance:'.$instance_id;
		} else
		if($instance->currentPhase != 'join' && $instance->owner != $p->player_id){
			$res['status'] = 'error';
			$res['error'] = 'Instance not in join phase';
		} else {
			try{
				$instance_player = $instance->addPlayer($p);
				$res['instance_player'] = $instance_player;
				$res['instance'] = $instance->getObject();
			} catch(Exception $e){
				$res['status'] = 'error';
				$res['error'] = $e->getMessage();

			}


		}

		header('Access-Control-Allow-Origin: *');
		header('Content-Type: application/json');
		die(json_encode($res));
	}

	public function saveinstancelogAction(){
		$instance_id = $this->_getParam('instance_id');
		$token = $this->_getParam('token');
		$log = file_get_contents("php://input"); //post data


		$p = PlayerTable::getFromToken($token);
		$instance = InstanceTable::findById($instance_id);

		$res = array(
			'status' => 'ok'
		);

		if(!$p){
			$res['status'] = 'error';
			$res['error'] = 'Token mismatch';
		} else
		if(!$instance){
			$res['status'] = 'error';
			$res['error'] = 'No such instance:'.$instance_id;
		} else {
			if(!$instance->storePlayerLog($p,$log)){
				$res['status'] = 'error';
				$res['error'] = 'No such player in instance'.$instance_id;
			} else {
				//ok
			}
		}

		header('Access-Control-Allow-Origin: *');
		header('Content-Type: application/json');
		die(json_encode($res));
	}

	public function stopallAction(){
		$instanceTable = new InstanceTable();
		$instances = $instanceTable->fetchAll(
			$instanceTable->select()
			->where('status=?','running')
		);

		foreach($instances as $i => $ins){
			$ins->stop();
		}

		die('done');
	}

}
