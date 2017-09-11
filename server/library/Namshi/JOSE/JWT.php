
<?php

/*namespace Namshi\JOSE;

use Namshi\JOSE\Base64\Base64UrlSafeEncoder;
use Namshi\JOSE\Base64\Encoder;
*/

/**
 * Class representing a JSON Web Token.
 */
class Namshi_JOSE_JWT
{
    /**
     * @var array
     */
    protected $payload;

    /**
     * @var array
     */
    protected $header;

    /**
     * @var Encoder
     */
    protected $encoder;

    /**
     * Constructor.
     *
     * @param array $payload
     * @param array $header
     */
    public function __construct($payload, array $header)
    {
        $this->setPayload($payload);
        $this->setHeader($header);
        $this->setEncoder(new Namshi_JOSE_Base64_Base64UrlSafeEncoder());
    }

    /**
     * @param Encoder $encoder
     */
    public function setEncoder(Namshi_JOSE_Base64_Encoder $encoder)
    {
        $this->encoder = $encoder;

        return $this;
    }

    /**
     * Generates the signininput for the current JWT.
     *
     * @return string
     */
    public function generateSigninInput()
    {
        if(is_array($this->getPayload())){
          $base64payload = $this->encoder->encode(json_encode($this->getPayload(), JSON_UNESCAPED_SLASHES));
        } else {
          $base64payload = $this->getPayload();
        }

        $base64header = $this->encoder->encode(json_encode($this->getHeader(), JSON_UNESCAPED_SLASHES));
        echo "base64";
        Zend_Debug::dump(sprintf('%s.%s', $base64header, $base64payload));
        return sprintf('%s.%s', $base64header, $base64payload);
    }

    /**
     * Returns the payload of the JWT.
     *
     * @return array
     */
    public function getPayload()
    {
        return $this->payload;
    }

    /**
     * Sets the payload of the current JWT.
     *
     * @param array $payload
     */
    public function setPayload($payload)
    {
        $this->payload = $payload;

        return $this;
    }

    /**
     * Returns the header of the JWT.
     *
     * @return array
     */
    public function getHeader()
    {
        return $this->header;
    }

    /**
     * Sets the header of this JWT.
     *
     * @param array $header
     */
    public function setHeader(array $header)
    {
        $this->header = $header;

        return $this;
    }
}
