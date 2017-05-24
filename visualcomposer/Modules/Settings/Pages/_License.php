<?php

namespace VisualComposer\Modules\Settings\Pages;

if (!defined('ABSPATH')) {
    header('Status: 403 Forbidden');
    header('HTTP/1.1 403 Forbidden');
    exit;
}

use VisualComposer\Framework\Container;
use VisualComposer\Framework\Illuminate\Support\Module;
use VisualComposer\Helpers\Traits\EventsFilters;
use VisualComposer\Modules\Settings\Traits\Page;

/**
 * Class License.
 */
class License extends Container /*implements Module*/
{
    use Page;
    use EventsFilters;

    /**
     * @var string
     */
    protected $slug = 'vcv-license';

    /**
     * @var string
     */
    protected $templatePath = 'settings/pages/license/index';

    /**
     * License constructor.
     */
    public function __construct()
    {
        /** @see \VisualComposer\Modules\Settings\Pages\License::addPage */
        $this->addFilter(
            'vcv:settings:getPages',
            'addPage',
            30
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
            'title' => __('Product License', 'vcwb'),
            'controller' => $this,
        ];

        return $pages;
    }
}