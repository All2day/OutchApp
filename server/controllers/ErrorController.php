<?php

/**
* ErrorController
*/
class ErrorController extends Zend_Controller_Action{

	/**
	 * Standard error function, that shows a nice error message
	 */
	public function errorAction()
	{
		header('Access-Control-Allow-Origin: *');
		$this->getResponse()->clearBody();

		$errors = $this->_getParam('error_handler');

		ob_start();
		Zend_Debug::dump($errors->exception);
		$e = ob_get_contents();
		ob_end_clean();
		$e_string = '<b>Exception:'.$errors->exception->getMessage().'</b><br />'.
				'error in url:'.$_SERVER['REQUEST_URI'].
				'<br />from referer:'.(isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : "")
				."<br />ip:".$_SERVER['REMOTE_ADDR']
				."<br />user agent:".$_SERVER['HTTP_USER_AGENT']
				."<br />".print_r($errors->exception->getTrace(),true);


		try{
			//Mawct_Log::action('exception',0,$e_string);

		} catch(Exception $e){
			//ignore not more we can do
		}
		if(isset($_SESSION['debug'])){
			die($e_string);
		}
	}
}
