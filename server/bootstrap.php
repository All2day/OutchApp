<?php
try{
	$start = microtime(true);

	define("VERSION","0.1");


	# Directory setup and class loading
	define("SITE_ROOT", realpath($_SERVER['DOCUMENT_ROOT']));
	set_include_path('.'
		. PATH_SEPARATOR . SITE_ROOT . ''
		. PATH_SEPARATOR . SITE_ROOT . '/Zend'
		. PATH_SEPARATOR . SITE_ROOT . '/models'
		. PATH_SEPARATOR . SITE_ROOT . '/library'
		. PATH_SEPARATOR . get_include_path());

	require 'Zend/Loader/Autoloader.php';
	$autoloader = Zend_Loader_Autoloader::getInstance();
	$autoloader->setFallbackAutoloader(true);

	#date and time settings
	ini_set('date.timezone', 'Europe/Copenhagen');

	# DB Cache
	require 'Zend/Cache.php';
	$dbCache = Zend_Cache::factory('Core', 'File',
		array('lifetime' => 1800, 'automatic_serialization' => TRUE),
		array('cache_dir' => SITE_ROOT.'/cache/dbmetadata'));


	# Initialize cache for send date
	$dateCache = Zend_Cache::factory('Core', 'File',
		array('lifetime' => 1800, 'automatic_serialization' => TRUE),
		array('cache_dir' => SITE_ROOT.'/cache/date'));
	Zend_Date::setOptions(array('cache' => $dateCache));

	# setup the db
	if(preg_match("/^(.*\.)?(geogames\.all2day)\.dk.*/",$_SERVER['SERVER_NAME'])){
		$db = Zend_Db::factory('Pdo_Mysql', array(
			'host'     => 'maindb57.co2zizjzpyw3.eu-west-1.rds.amazonaws.com',
			'username' => 'geogames',
			'password' => '3qYhQhqUupJtdK2J',
			'dbname'   => 'geogames'
		));
	} else
	if(preg_match("/^(.*\.)?(geogames)\.localhost.*/",$_SERVER['SERVER_NAME'])){
		$db = Zend_Db::factory('Pdo_Mysql', array(
			'host'     => 'localhost',
			'username' => 'root',
			'password' => '',
			'dbname'   => 'geogames'
		));
	} else
	{
		header("Location: https://geogames.all2day.dk".$_SERVER['REQUEST_URI'],TRUE,301);
		exit;
	}

		$db->query("SET NAMES 'utf8', time_zone = 'Europe/Copenhagen'");
	Zend_Db_Table_Abstract::setDefaultAdapter($db);
	$db->getProfiler()->setEnabled(false);
	Zend_Db_Table_Abstract::setDefaultMetadataCache($dbCache);

	# enable the session
	ini_set('session.gc_maxlifetime',30*24*60*60);

	//create your Zend_Session_SaveHandler_DbTable and
	//set the save handler for Zend_Session
	Zend_Session::setOptions(array('remember_me_seconds' => 60*60*24*365));
	Zend_Session::setSaveHandler(new Zend_Session_SaveHandler_DbTable(array(
    'name'           => 'session',
    'primary'        => 'id',
    'modifiedColumn' => 'modified',
    'dataColumn'     => 'data',
    'lifetimeColumn' => 'lifetime'
	)));
	Zend_Session::start();


	# Use Layout and set up view
	Zend_Layout::startMvc(
		array(
			'layoutPath' => 'views/layouts'
		)
	);

	$view = new Zend_View();

	# set default title and description
	$view->headTitle('Geogames');
	$view->headMeta()->setName('description',"Geogames");

	# set doctype
	$doctypeHelper = new Zend_View_Helper_Doctype();
	$doctypeHelper->doctype('XHTML1_STRICT');

	# escape encoding defaults to latin1, but we want utf-8
	$view->setEncoding('UTF-8');

	# show notice when using uninitialized variables in views
	$view->strictVars(true);

	#set extra helper path
	$view->addHelperPath('./helpers','');
	$viewRenderer = Zend_Controller_Action_HelperBroker::getStaticHelper('viewRenderer');
	$viewRenderer->setView($view);

	# Setup controller
	$frontController = Zend_Controller_Front::getInstance();
	$frontController->setDefaultControllerName('index');
	$frontController->setControllerDirectory(
		array(
			'default'		=> 'controllers'
		)
	);



	# set up routes
	$router = $frontController->getRouter();

	//finally dispatch
	$frontController->dispatch();

} catch(Exception $e) {
	//require_once("views/scripts/error/db.phtml");
	echo '<b>Exception:'.$e->getMessage().'</b><br>';
	$s = print_r($e->getTrace(),true);
  echo "<pre>";
	echo ($s);
	echo "</pre>";
}

exit;
