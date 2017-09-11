<?php

//namespace Namshi\JOSE\Base64;

interface Namshi_JOSE_Base64_Encoder
{
    /**
     * @param string $data
     *
     * @return string
     */
    public function encode($data);

    /**
     * @param string $data
     *
     * @return string
     */
    public function decode($data);
}
