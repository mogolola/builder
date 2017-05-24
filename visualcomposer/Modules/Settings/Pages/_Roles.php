<?php

namespace VisualComposer\Modules\Settings\Pages;

if (!defined('ABSPATH')) {
    header('Status: 403 Forbidden');
    header('HTTP/1.1 403 Forbidden');
    exit;
}

use VisualComposer\Framework\Container;
use VisualComposer\Framework\Illuminate\Support\Module;
use VisualComposer\Helpers\Access\Role;
use VisualComposer\Helpers\Request;
use VisualComposer\Helpers\Traits\EventsFilters;
use VisualComposer\Helpers\Traits\WpFiltersActions;
use VisualComposer\Modules\Settings\Traits\Page;

/**
 * Class Roles.
 */
class Roles extends Container /*implements Module*/
{
    use Page;
    use EventsFilters;
    use WpFiltersActions;

    /**
     * @var string
     */
    protected $slug = 'vcv-roles';

    /**
     * @var string
     */
    protected $templatePath = 'settings/pages/roles/index';

    /**
     * @var bool
     */
    protected $postTypes = false;

    /**
     * @var bool
     */
    protected $excludedPostTypes = false;

    /**
     * @var array
     */
    protected $parts = [
        'post_types',
        'backend_editor',
        'frontend_editor',
        'post_settings',
        'settings',
        'templates',
        //'shortcodes',
        //'grid_builder',
        //'presets',
    ];

    /**
     * Roles constructor.
     */
    public function __construct()
    {
        /** @see \VisualComposer\Modules\Settings\Pages\Roles::addPage */
        $this->addFilter(
            'vcv:settings:getPages',
            'addPage',
            60
        );

        /** @see \VisualComposer\Modules\Settings\Pages\Roles::saveSettingsResponse */
        $this->wpAddAction(
            'wp_ajax_vcv:rolesSettingsSave',
            'saveSettingsResponse'
        );
    }

    /**
     * @param array $pages
     *
     * @return array
     */
    private function addPage($pages)
    {
        $pages[] = [
            'slug' => $this->getSlug(),
            'title' => __('Role Manager', 'vcwb'),
            'controller' => $this,
        ];

        return $pages;
    }

    /**
     * Get list of parts.
     *
     * @return mixed|void
     */
    public function getParts()
    {
        return apply_filters('vcv:settings:pages:roles:getParts', $this->parts);
    }

    /**
     * Check required capability for this role to have user access.
     *
     * @param $part
     *
     * @return array
     */
    public function getPartCapability($part)
    {
        // TODO: Remove this check.
        return 'settings' !== $part ? [
            'edit_posts',
            'edit_pages',
        ] : 'manage_options';
    }

    /**
     * @param $role
     * @param $caps
     *
     * @return bool
     */
    public function hasRoleCapability($role, $caps)
    {
        $has = false;
        $wpRole = get_role($role);
        if (is_string($caps)) {
            $has = $wpRole->has_cap($caps);
        } elseif (is_array($caps)) {
            $i = 0;
            // TODO: Check out of bounds.
            while (false === $has && $i < count($caps)) {
                $has = $this->hasRoleCapability($role, $caps[ $i++ ]);
            }
        }

        return $has;
    }

    /**
     * @return \WP_Roles
     */
    public function getWpRoles()
    {
        // @codingStandardsIgnoreStart
        global $wp_roles;
        if (function_exists('wp_roles')) {
            return $wp_roles;
        } else {
            if (!isset($wp_roles)) {
                $wp_roles = new \WP_Roles();
            }
        }

        return $wp_roles;
        // @codingStandardsIgnoreEnd
    }

    /**
     * @param array $params
     *
     * @return array
     */
    public function save($params = [])
    {
        $data = ['message' => ''];
        $roles = $this->getWpRoles();
        $editableRoles = get_editable_roles();
        foreach ($params as $role => $parts) {
            if (is_string($parts)) {
                $parts = json_decode(stripslashes($parts), true);
            }
            if (isset($editableRoles[ $role ])) {
                foreach ($parts as $part => $settings) {
                    /** @see \VisualComposer\Modules\Settings\Pages\Roles::parseRole */
                    $this->call('parseRole', [$role, $part, $roles, $settings]);
                }
            }
        }
        $data['message'] = __('Roles settings successfully saved.', 'vcwb');

        return $data;
    }

    /**
     * @return array|bool
     */
    public function getPostTypes()
    {
        if (false === $this->postTypes) {
            $this->postTypes = [];
            $excluded = $this->getExcludedPostTypes();
            foreach (get_post_types(['public' => true]) as $postType) {
                if (!in_array($postType, $excluded)) {
                    $this->postTypes[] = [
                        $postType,
                        $postType,
                    ];
                }
            }
        }

        return $this->postTypes;
    }

    /**
     * @return array|bool
     */
    public function getExcludedPostTypes()
    {
        if (false === $this->excludedPostTypes) {
            $this->excludedPostTypes = apply_filters(
                'vcv:settings:pages:roles:getExcludedPostTypes',
                [
                    'attachment',
                    'revision',
                    'nav_menu_item',
                    'mediapage',
                ]
            );
        }

        return $this->excludedPostTypes;
    }

    public function saveSettingsResponse()
    {
        /** @see \VisualComposer\Modules\Settings\Pages\Roles::saveSettings */
        $data = $this->call('saveSettings');
        wp_send_json($data);
    }

    /**
     * Save roles.
     *
     * @param Request $request
     *
     * @return array
     */
    private function saveSettings(Request $request)
    {
        $field = 'vcv-settings-' . $this->getSlug() . '-action';
        $data = ['status' => false];
        // TODO: Use Nonce helper!
        if (check_admin_referer($field, 'vcv_nonce_field') && current_user_can('manage_options')) {
            /** @see \VisualComposer\Modules\Settings\Pages\Roles::save */
            $data = $this->call('save', [$request->input('vc_roles', [])]);
        }

        return $data;
    }

    /**
     * @param $role
     * @param $part
     * @param $roles \WP_Roles
     * @param $settings
     * @param \VisualComposer\Helpers\Access\Role $roleAccess
     */
    private function parseRole($role, $part, $roles, $settings, Role $roleAccess)
    {
        $partKey = $roleAccess->who($role)->part($part)->getStateKey();
        $stateValue = '0';
        // @codingStandardsIgnoreLine
        $roles->use_db = false; // Disable saving in DB on every cap change.
        foreach ($settings as $key => $value) {
            if ('_state' === $key) {
                $stateValue = in_array(
                    $value,
                    [
                        '0',
                        '1',
                    ]
                ) ? (boolean)$value : $value;
            } else {
                if (empty($value)) {
                    $roles->remove_cap($role, $partKey . '/' . $key);
                } else {
                    $roles->add_cap($role, $partKey . '/' . $key, true);
                }
            }
        }
        // @codingStandardsIgnoreLine
        $roles->use_db = true; //  Enable for the lat change in cap of role to store data in DB.
        $roles->add_cap($role, $partKey, $stateValue);
    }
}