<?php
/**
 * Extension class for Zend_OpenId.  Provides oauth access.
 * 
 * @author Mads Kessel mads@kessel.dk
 * @date 05August2013
 */
class Zend_OpenId_Extension_Oauth extends Zend_OpenId_Extension
{
    /**
     * Namespace URI for oauth
     */
    const NS_URL = 'http://specs.openid.net/extensions/oauth/1.0';
    
    /**
     * Holds the attribute and the returned value.
     */
    private $_properties = array();
    
    public function __construct()
    {
    }
    
    /**
     * Returns associative array of SREG variables
     *
     * @return array
     */
    public function getProperties() {
        if (is_array($this->_properties)) {
            return $this->_properties;
        } else {
            return array();
        }
    }
    
    private function splitParams($params)
    {
        $final = array();
        
        // Loop the parameters
        foreach ($params as $identifier => $value)
        {
            // Split the identifier at the boundries
            $levels = explode('_', $identifier);
            
            // Get the last value as the key
            $key = array_pop($levels);
            
            // Loop the levels, creating any that don't exist
            $currentlevel = &$final;
            foreach ($levels as $level)
            {
                // Check if the level is defined
                if (!isset($currentlevel[$level]))
                    // Create the level
                    $currentlevel[$level] = array();
                else
                {
                    // Change any found value to the first key of an array
                    if (!is_array($currentlevel[$level]))
                        $currentlevel[$level] = array($currentlevel[$level]);
                }
                
                // Move down to the next level
                $currentlevel = &$currentlevel[$level];
            }
            
            // Set the value
            $currentlevel[$key] = $value;
        }
        
        return $final;
    }
    
    
    /**
     * Generates a request to be sent to the provider requesting the
     * specified attributes.
     *
     * @param array &$params request's var/val pairs
     * @return bool
     */
    public function prepareRequest(&$params)
    {   
        // Set the name space
        $params['openid.ns.oauth'] = self::NS_URL;
        
        // Set the mode
        $params['openid.oauth.consumer'] = $_SERVER['HTTP_HOST'];
        
        $params['openid.oauth.scope'] = 'https://www.google.com/m8/feeds/';
        return true;
    }

    /**
     * Parses the request from the consumer to determine what attribute values
     * to return to the consumer.
     *
     * @param array $params request's var/val pairs
     * @return bool
     */
    public function parseRequest($params)
    {
        return true;
    }

    /**
     * Generates a response to the consumer's request that contains the
     * requested attributes.
     *
     * @param array &$params response's var/val pairs
     * @return bool
     */
    public function prepareResponse(&$params)
    {
        return true;
    }

    /**
     * Gets property values from the response returned by the provider
     *
     * @param array $params response's var/val pairs
     * @return bool
     */
    public function parseResponse($params)
    {
        $params = $this->splitParams($params);
        $oauth = null;
        
        // Get the data name space
        if (isset($params['openid']['ns']['oauth']) && $params['openid']['ns']['oauth'] == self::NS_URL)
            $oauth = $params['openid']['oauth'];
        else
        {
            // Loop the extensions looking for the namespace url
            foreach ($params['openid']['ns'] as $namespace => $uri)
            {
                // Check if the uri is attribute exchange
                if ($uri == self::NS_URL)
                {
                    $oauth = $params['openid'][$namespace];
                    break;
                }
            }
        }
        
        // Check if the data was found
        if ($oauth == null)
            return false;
        
        // Verify that a request token has been set
        if (!isset($oauth['request_token'])){
        	return false;  
        }
        // Get the attributes
        $this->_properties['request_token'] = $oauth['request_token'];
        
        return true;
    }
}