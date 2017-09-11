<?php
/**
 * Provides static functionality for logging in the lokus project
 */

class All2day_Log{

	/**
	 * Initiliaze the logs
	 */
	static function init(){

		//create the error log
		/*if(!self::$error){
			$db = Zend_Db_Table_Abstract::getDefaultAdapter();

			$columnMapping = array(
				'reviewer_id' => 'priority',
				'message' => 'message'
			);
			$writer = new Zend_Log_Writer_Db($db,'error_log',$columnMapping);

			//create the action log with connection to the database
			self::$error = new Zend_Log($writer);
		}*/

	}

	/*public static function _error_handler($errno, $errstr){
		//do absolutely nothing... well... relax... the problem is solved!
	}*/

	/*public static function error($exception){
		//set_error_handler(array('Lokus_Log', '_error_handler'));

		try{
			//log
			$errorLogTable = new ErrorLogTable();

			$errorLog = $errorLogTable->createRow();

			$errorLog->message = $exception->getMessage();

			$stacktrace = $exception->getTrace();

			$trace = array();
			foreach($stacktrace as $i => $s){
				$new_s = $s;
				$new_s['args'] = array();

				foreach($s['args'] as $j => $a){
					if(is_object($a)){
						$new_s['args'][$j] = get_class($a);
					} else
					if(is_array($a)){
						$new_a = array();
						foreach($a as $k => $av){
							if(is_object($av)){
								$new_a[$k] = get_class($av);
							} else
							if(is_array($av)){
								$new_a[$k] = 'array('.count($av).')';
							}
						}
						$new_s['args'][$j] = $new_a;
					} else {
						$new_s['args'][$j] = $a;
					}
				}

				$trace[$i] = $new_s;
			}

			$stacktrace = $trace;

			array_unshift($stacktrace, array('file' => $exception->getFile(), 'line' => $exception->getLine()));

			$errorLog->stacktrace = Zend_Json::encode($stacktrace);

			if($exception instanceof Lokus_Exception){
				$errorLog->priority = $exception->priority;
			}

			$errorLog->url = isset($_SERVER['REQUEST_URI']) ? $_SERVER['REQUEST_URI'] : 'CLI';
			$errorLog->post = file_get_contents('php://input');
			$errorLog->user_agent = isset($_SERVER['HTTP_USER_AGENT']) ? $_SERVER['HTTP_USER_AGENT'] : 'CLI';
			$errorLog->session_id = Zend_Registry::isRegistered('session_id') ? Zend_Registry::get('session_id') : 0;
			$errorLog->referer = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '';

			$errorLog->save();

		} catch(Exception $e2){
			//problem
			//ignore
		}

		//restore_error_handler();
	}*/


	/**
	 * Static logging of actions in the system
	 */
	public static function action($type, $target_id = 0, $data = null,$not_robots = false){
		if($not_robots){
			//check if the user is a robot, if so ignore it
			if(Zend_Registry::get('session')->is_robot){
				return;
			}
		}
		$actionLogTable = new ActionLogTable();
		$actionLog = $actionLogTable->createRow();
		$actionLog->type = $type;
		if(is_array($data)){
			$data = Zend_Json::encode($data);
		}
		$actionLog->target_id = $target_id;
		$actionLog->data = $data;
		$actionLog->save();
	}

	/*public static function syslog($type = 'system', $message = 'Standard message')
	{
		$syslog = new SyslogTable();

		$newLogRow = $syslog->createRow();

		$newLogRow->type = $type;
		$newLogRow->message = $message;

		$newLogRow->save();
	}*/

	/**
	 * Used for profiling times
	 */
	public static $times;
	public static $last_time;
	public static $start_time;
	public static $profiling_enabled = null;


	public static function profile($name){
		if(self::$profiling_enabled === null){
			//determine if debug is enabled for this round
			if(isset($_GET['profile'])){
				self::$profiling_enabled = ($_GET['profile'] == 'true' ? true : false);
			} else {
				if(isset($_SESSION['profile'])){
					self::$profiling_enabled = $_SESSION['profile'];
				}
			}
		}

		if(!self::$profiling_enabled){
			return;
		}

		if(!is_array(self::$times)){
			self::$times = array();

			if(!self::$start_time){
				global $start;
				self::$start_time = $start; //microtime(true);
			}
		}

		$t = microtime(true) - self::$start_time;

		self::$times[$name] = "".((int)(1000*$t));
		if(self::$last_time){
			self::$times[$name].=" - ".((int)(1000*($t - self::$last_time)));
		}

		self::$last_time = $t;
	}

	public static function profile_print($force = false){
		if(self::$profiling_enabled){
			$_SESSION['profile'] = true;
		} else{
			unset($_SESSION['profile']);
		}

		if(!$force && !self::$profiling_enabled){
			return;
		}

		//check that the header content type is not json
		if(in_array('Content-Type: application/json',headers_list())){
			return;
		}


		foreach(self::$times as $name => $time){
			echo "".$name.":".$time."<br>";
		}
	}
}
