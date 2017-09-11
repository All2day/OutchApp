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
		$instance = InstanceTable::startInstance();

		$res = array(
			'instance_id' => $instance->instance_id,
			'url' => $instance->url
		);
		header('Access-Control-Allow-Origin: *');
		header('Content-Type: application/json');
		die(json_encode($res));
	}
}
