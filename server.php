<?php
/**
 * Php script for taking care of server stuff
 */

 $command = exec("node gameServer >/dev/null &");
 $pid = exec("nohup $command > /dev/null 2>&1 & echo $!");
$info = "Login server started...PID: $pid";
