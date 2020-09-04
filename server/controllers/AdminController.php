<?php

class AdminController extends Zend_Controller_Action{
	private $postdata = NULL;

	public function init(){
		$action = $this->getRequest()->getActionName();

		$layout = Zend_Layout::getMvcInstance();
		$layout->setLayout('admin');

		if(!isset($_SERVER['PHP_AUTH_USER']) || !isset($_SERVER['PHP_AUTH_PW'])){
			header( 'WWW-Authenticate: Basic realm="GeoPlay"' );
			header( 'HTTP/1.0 401 Unauthorized' );
			echo 'Authorization Required.';
			exit;
		}

		$user = $_SERVER['PHP_AUTH_USER'];
		$pass = $_SERVER['PHP_AUTH_PW'];

		if($user == 'admin' && md5('asdfsadfsadfsad'.$pass) == '41abdd9e4fe08c6103a1fce75845cdbe'){

		} else {
			header( 'WWW-Authenticate: Basic realm="GeoPlay"' );
			header( 'HTTP/1.0 401 Unauthorized' );
			echo 'Authorization Required.';
			exit;
		}

	}

	/**
	 * indexAction
	 * The method called when first loading the site
	 *
	 * @return void
	 */
	public function indexAction(){

	}

	public function instanceAction(){
		$instance_id = $this->_getParam('instance_id');

		$instanceTable = new InstanceTable();

		$instance = $instanceTable->find($instance_id)->current();

		if(!$instance){
			throw new Exception('No such instance');
		}

		$this->view->instance = $instance;
	}

	public function iplogAction(){
		$instance_id = $this->_getParam('instance_id');
		$player_id = $this->_getParam('player_id');

		$instanceTable = new InstanceTable();

		$instance = $instanceTable->find($instance_id)->current();

		if(!$instance){
			throw new Exception('No such instance');
		}

		$p = $instance->getPlayer($player_id);

		if(!$p){
			throw new Exception('No such player on instance');
		}

		$log = $p['log'];

		die($log);
	}


	public function instancesAction(){

		$instanceTable = new InstanceTable();


		$instances = $instanceTable->fetchAll($instanceTable->select()->order('instance_id DESC')->limit(100));

		$this->view->instances = $instances;
	}

	public function instancelogAction(){
		$instance_id = $this->_getParam('instance_id');
		$log = file_get_contents('cache/log/instance_'.$instance_id.'.log');
		$log = preg_replace("/\n/","<br />",$log);
		echo "<h1>Log for instance_".$instance_id."</h1>";
		echo $log;
		exit;
	}

}
