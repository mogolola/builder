<?php

if (!defined('ABSPATH')) {
    header('Status: 403 Forbidden');
    header('HTTP/1.1 403 Forbidden');
    exit;
}

/** @var array $WP_version */
/** @var array $PHP_version */
/** @var array $WP_debug */
/** @var string $VC_version */
?>

<h2><?php echo esc_html__('System status', 'vcwb') ?></h2>
<table class="vcv-ui-settings-status-table">
    <thead>
    <tr>
        <th>Check</th>
        <th>Status</th>
    </tr>
    </thead>
    <tbody>
    <tr>
        <td><?php echo esc_html__('WordPress Version', 'vcwb') ?></td>
        <td class="<?php echo $WP_version['status'] ?>"><?php echo $WP_version['text']; ?></td>
    </tr>
    <tr>
        <td><?php echo esc_html__('PHP Version', 'vcwb') ?></td>
        <td class="<?php echo $PHP_version['status'] ?>"><?php echo $PHP_version['text']; ?></td>
    </tr>
    <tr>
        <td><?php echo esc_html__('WP_DEBUG', 'vcwb') ?></td>
        <td class="<?php echo $WP_debug['status'] ?>"><?php echo $WP_debug['text'] ?></td>
    </tr>
    <tr>
        <td><?php echo esc_html__('Visual Composer Version', 'vcwb') ?></td>
        <td><?php echo $VC_version; ?></td>
    </tr>
    <tr>
        <td>Test</td>
        <td>Test</td>
    </tr>
    </tbody>
</table>
