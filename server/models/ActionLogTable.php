<?php

/**
 * ActionLog table
 */
class ActionLogTable extends Zend_Db_Table_Abstract
{
	protected $_name = 'action_log';

	public function partialSave($row){
		$d = new DateTime('now');
		$row['timestamp'] = $d->format('Y-m-d H:i:s');

		$this->_name = 'action_log_'.$d->format('Y_m');



		try{
			//$row->save();

			$this->insert($row->toArray());

		} catch(Exception $e){
			$db = $this->getAdapter();

			//Check if it is caused by the table not existing

			//Check autoincrement value from previous table
			$d->modify("-1 month");
			$t_old = 'action_log_'.$d->format('Y_m');
			$sql = "SELECT `AUTO_INCREMENT`
FROM  INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND   TABLE_NAME   = '".$t_old."'";

			$res = $db->fetchRow($sql);

			if($res === false){
				$sql = "SELECT `AUTO_INCREMENT`
FROM  INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND   TABLE_NAME   = 'action_log'";

				$res = $db->fetchRow($sql);
			}

			$ai_value = $res['AUTO_INCREMENT'];

			//if the table is missing, create it
			$sql = "CREATE TABLE IF NOT EXISTS `".$this->_name."` (
			  `action_log_id` int(11) NOT NULL auto_increment COMMENT 'To let it be 100% cronological',
			  `timestamp` timestamp NOT NULL default CURRENT_TIMESTAMP,
			  `target_id` int(11) NOT NULL COMMENT 'An identifier for the target this action is performed on',
			  `type` varchar(64) collate utf8_danish_ci NOT NULL COMMENT 'the type of action',
			  `data` text collate utf8_danish_ci,
			  PRIMARY KEY  (`action_log_id`),
			  KEY `timestamp` (`timestamp`),
			  KEY `type` (`type`),
			  KEY `target_id` (`target_id`),
			  KEY `type_timestamp` (`type`,`timestamp`)
			) ENGINE=MyISAM  DEFAULT CHARSET=utf8 COLLATE=utf8_danish_ci AUTO_INCREMENT=".$ai_value;

			$db->query($sql);

			//save it again as the first row
			$this->insert($row->toArray());
		}

	}

	const _logStart = '2013-07-01';

	/**
	 * Because of partitioning, all reading actions, must be done through this function resulting in sql with unions over the necessary tables
	 */
	public static function get($sql,$from=null, $to=null){

		$parts = self::splitSql($sql);

		//echo "start:".($parts['range_start'] ? $range_start->format('Y-m-d') : 'null');
		//echo "end:".($range_end ? $range_end->format('Y-m-d') : 'null');

		$range_start = $parts['range_start'];
		$range_end = $parts['range_end'];

		if(!$range_start){
			//first date where we have log from
			$range_start = new DateTime(self::_logStart);
		}


		if(!$range_end){
			//simply use now to fetch everything up til now
			$range_end = new DateTime("now");
		}

		if($from){
			$range_start = new DateTime($from);
		}
		if($to){
			$range_end = new DateTime($to);
		}

		//limit the start range to start of data
		$range_start = max(new DateTime(self::_logStart),$range_start);

		$range_start->modify("first day of +0 month");
		$range_end->modify("last day of +0 month");

		//get the months contained in this range
		$period = new DatePeriod($range_start,new DateInterval('P1M'),$range_end);

		$unions = array();


		$res = "";

		$dates = iterator_to_array($period);

		if(count($dates) > 1){
			foreach($dates as $date){
				$t = 'action_log_'.$date->format('Y_m');

				$out_sql = "SELECT
				".$parts['select']."
				FROM
				".$parts['from']['before']." ".$t." ".($parts['from']['as'] ? "AS ".$parts['from']['as'] : "AS action_log")." ".$parts['from']['after']."
				WHERE
				".$parts['where']." ".$parts['order']." ".$parts['limit'];

				$unions[] = $out_sql;
			}

			$unions = array_reverse($unions);
			foreach($unions as $this_sql){
				if($res){
					$res.=" UNION ALL ";
				}
				$res.="(".$this_sql.")";
			}
			$res = "SELECT * FROM (".$res.") AS t1 ".$parts['rest'];
		} else {
			if(count($dates) > 0){
				$date = reset($dates);
				$t = 'action_log_'.$date->format('Y_m');
			} else {
				$t = 'action_log';
			}
			$res = "SELECT
				".$parts['select']."
				FROM
				".$parts['from']['before']." ".$t." ".($parts['from']['as'] ? "AS ".$parts['from']['as'] : "AS action_log")." ".$parts['from']['after']."
				WHERE
				".$parts['where']." ".$parts['rest'];
		}

		//Zend_Debug::dump($res);

		//exit;
		return $res;
	}

	/**
	 * Splits the sql into parts ready to be put together in another way
	 */
	private static function splitSql($sql){
		$res = array('sql' => $sql);

		//split the sql using regex
		//"/^SELECT\s+(.*?)\s+FROM\s+(.*?)\s+WHERE\s+(.*?)(\s+(GROUP BY|LIMIT|HAVING|ORDER BY).*)?;?\s*$/i"
		if(!preg_match("/^\s*SELECT\s+(.*?)\s+FROM\s+(.*?)\s+WHERE\s+(.*?)(\s+(GROUP BY|LIMIT|HAVING|ORDER BY).*?)?;?\s*$/is",	$sql,$matches)){
			die('not matching:'.$sql);

			return $sql;
		}
		//Zend_Debug::dump($matches);
		$select = $matches[1];
		$from = $matches[2];
		$where = $matches[3];
		$rest = isset($matches[4]) ? $matches[4] : '';

		$res['select'] = $select;
		$res['from'] = $from;
		$res['where'] = $where;
		$res['rest'] = $rest;

		//split from clause to detect where action_log table is being used
		if(!preg_match("/^(.*?)\`?action_log\`?(\s+AS\s+([a-z0-9_]+))?(.*)$/is",$from,$matches)){
			die('could not find from table');
		}

		//echo "tables:";
		//Zend_Debug::dump($matches);

		$before = $matches[1];
		$as = $matches[3];
		if(!$as){
			$as = "action_log";
		}
		$after = $matches[4];

		$res['from'] = array(
			'from' => $from,
			'before' => $before,
			'as' => $as,
			'after' => $after
		);

		//split rest into modifiers
		preg_match("/^\s*(GROUP\s+BY\s+(.*?))?(?:\s+(HAVING\s+(.*?)))?(?:\s+(ORDER\s+BY\s+(.*?)))?(?:\s+(LIMIT\s+(.*?)))?$/is",$rest,$matches);
		//echo "matches:";
		//Zend_Debug::dump($matches);

		$group = isset($matches[1]) ? $matches[1] : '';
		$having = isset($matches[3]) ? $matches[3] : '';
		$order = isset($matches[5]) ? $matches[5] : '';
		$limit = isset($matches[7]) ? $matches[7] : '';

		$res['group'] = $group;
		$res['having'] = $having;
		$res['order'] = $order;
		$res['limit'] = $limit;
		$res['limit_rows']  = isset($matches[8]) ? $matches[8] : 0;

		//go through where to find matching timestamps in the clause
		if(!preg_match_all("/(?:\s([a-z0-9_]+)\.)?timestamp\s*(>\=|<\=|\>|\<)\s*(.*?)\s*(?:AND|OR|$)\s*/i",$where,$matches)){
			//die('could not split where');
		}
		//echo "timestamps";
		//Zend_Debug::dump($matches);

		$range_start = null;
		$range_end = null;

		if(count($matches)){
			foreach($matches[0] as $i => $full){
				$comp = $matches[2][$i];
				$ts = $matches[3][$i];
				$t = $matches[1][$i];
				if($t && $t != $as){
					//echo "not as ".$as;
					continue;
				}
				if($comp == ">" || $comp == ">="){
					$range_start = self::sql_date($ts);
				}
				if($comp == "<" || $comp == "<="){
					$range_end = self::sql_date($ts);
					$range_end->modify("-1 day"); //the date should not be part of the period
				}
			}
		}

		$res['range_start'] = $range_start;
		$res['range_end'] = $range_end;

		return $res;

	}

	private static function sql_date($str){
		if(preg_match("/('\d{4}-\d{2}-\d{2}'|CURRENT_DATE\(\)|DATE\(NOW\(\)\)|NOW\(\))\s*(?:(\+|\-)\s*INTERVAL\s+(\d+)\s+(DAY|WEEK|MONTH))?/i",$str,$matches)){
			$date_str = $matches[1];
			if(preg_match("/CURRENT_DATE\(\)|DATE\(NOW\(\)\)|NOW\(\)/",$date_str)){
				$date = new DateTime("now");
			} else {
				$date_str = trim($date_str,"'\"`");
				$date = new DateTime($date_str);
			}

			if(isset($matches[2]) && $matches[2]){
				$date->modify($matches[2].$matches[3]." ".$matches[4]);
			}
			return $date;
			//echo $date->format('Y-m-d');
			//Zend_Debug::dump($matches);
			//exit;
		} else {
			$str = trim($str,"'\"`");
			$date = new DateTime($str);

			return $date;
		}
	}

	public static function fetchFirst($sql){
		$parts = self::splitSql($sql);
		$range_start = $parts['range_start'];
		$range_end = $parts['range_end'];

		if(!$range_start){
			//first date where we have log from
			$range_start = new DateTime(self::_logStart);
		} else {
			$range_start = max(new DateTime(self::_logStart),$range_start);
		}

		if(!$range_end){
			//simply use now to fetch everything up til now
			$range_end = new DateTime("now");
		}

		$range_start->modify("first day of +0 month");
		$range_end->modify("last day of +0 month");

		//get the months contained in this range
		$period = new DatePeriod($range_start,new DateInterval('P1M'),$range_end);

		//get tables
		$tables = array();
		foreach($period as $month){
			$tables[] = 'action_log_'.$month->format('Y_m');
		}

		$tables = array_reverse($tables);

		$rows = array();
		$missing_rows = $parts['limit_rows'];

		$db = Zend_Db_Table_Abstract::getDefaultAdapter();

		foreach($tables as $t){

			$t_sql = "SELECT
				".$parts['select']."
				FROM
				".$parts['from']['before']." ".$t." ".($parts['from']['as'] ? "AS ".$parts['from']['as'] : "AS action_log")." ".$parts['from']['after']."
				WHERE
				".$parts['where']." ".$parts['group']." ".$parts['having']." ".$parts['order']." LIMIT ".$missing_rows;

			//Zend_Debug::dump($t_sql);

			$res = $db->fetchAll($t_sql);
			$missing_rows-=count($res);
			$rows =array_merge($rows,$res);


			if($missing_rows <=0){
				break;
			}
		}

		//Zend_Debug::dump($rows);

		return $rows;
	}


	public static function getAdminUserLogTypes($as_string = false,$cat = null){
		if($as_string){
			$types = self::getAdminUserLogTypes(false,$cat);
			foreach($types as $i => $t){
				$types[$i] = "'".$t."'";
			}
			return implode(",",$types);
		}

		$types = array(
			'offer' => array(
				'offer_wait',
				'offer_partner_edit',
				'offer_nonpartner_edit',
				'offer_edited_edit',
				'offer_blocked_edit',
				'offer_crawled_blocked',
				'offer_edited_blocked',
				'offer_unblocked',
				'offer_autoblock',
				'offer_autoend',
				'offer_touched',
				'offer_copy_of',
				'offer_id_change',
				'offer_manend',
				'offer_denewsletter',
				'offer_renewsletter',
				'offer_restarted',

			),
			'supertag' => array(
				'supertag_created',
				'supertag_edited',
			)
		);

		if($cat){
			return $types[$cat];
		}
		$res = array();
		foreach($types as $t){
			$res=array_merge($res,$t);
		}
		return $res;

	}
}
