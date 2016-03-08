<?php
define('VC_V_PHPUNIT', true);
define('VC_V_DIE_EXCEPTION', true);

$testsDir = getenv('WP_TESTS_DIR');
if ( ! $testsDir) {
    $testsDir = '/tmp/wordpress-tests-lib';
}
require_once $testsDir.'/includes/functions.php';


tests_add_filter('muplugins_loaded', function () {
    require_once dirname(__FILE__).'/../plugin-wordpress.php';
});

require $testsDir.'/includes/bootstrap.php';
