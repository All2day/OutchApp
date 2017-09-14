<?php
/**
 * IndexController
 */
class IndexController extends Zend_Controller_Action{
	private $postdata = NULL;

	public function init(){
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
		$game_id = $this->_getParam('game_id');

		$instance = InstanceTable::startInstance($game_id);

		$res = array(
			'instance_id' => $instance->instance_id,
			'url' => $instance->url
		);
		header('Access-Control-Allow-Origin: *');
		header('Content-Type: application/json');
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

		$instances = $instanceTable->fetchAll($instanceTable->select()->where('status=?','running'));

		$res = array(
			'status' => 'ok',
			'instances' => $instances->toArray()
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

	public function gameAction(){
		$game_id = $this->_getParam('game_id');

		$gameTable = new GameTable();
		$game = $gameTable->find($game_id)->current();

		$game = $game->toArray();

		$game['src'] = 'http://'.$_SERVER['HTTP_HOST'].'/games/'.($game['name']).'.js?v='.urlencode($game['version']);

		$instanceTable = new InstanceTable();
		$instances = $instanceTable->fetchAll($instanceTable->select()->where('status=?','running')->where('game_id=?',$game_id));

		$game['instances'] = $instances->toArray();
		$res = array(
			'status' => 'ok',
			'game' => $game
		);

		header('Access-Control-Allow-Origin: *');
		header('Content-Type: application/json');
		die(json_encode($res));
	}
}
