<?php

/**
 * CronController
 */
class CronController extends Zend_Controller_Action
{
	public function init(){
		$action = $this->getRequest()->getActionName();
		AdminUserTable::isAllowed($action);

		$layout = Zend_Layout::getMvcInstance();
    $layout->setLayout('admin');
	}

	/**
	 * indexAction
	 *
	 * @return void
	 */
	public function indexAction(){

	}


}
