<?php

//namespace Namshi\JOSE\Signer\OpenSSL;

/**
 * Class responsible to sign inputs with the a RSA algorithm, after hashing it.
 */
abstract class Namshi_JOSE_Signer_OpenSSL_RSA extends Namshi_JOSE_Signer_OpenSSL_PublicKey
{
    /**
     * {@inheritdoc}
     */
    protected function getSupportedPrivateKeyType()
    {
        return defined('OPENSSL_KEYTYPE_RSA') ? OPENSSL_KEYTYPE_RSA : false;
    }
}
