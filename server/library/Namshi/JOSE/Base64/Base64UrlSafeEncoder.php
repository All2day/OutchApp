<?php

//namespace Namshi\JOSE\Base64;

class Namshi_JOSE_Base64_Base64UrlSafeEncoder implements Namshi_JOSE_Base64_Encoder
{
    public function encode($data)
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    public function decode($data)
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }
}
