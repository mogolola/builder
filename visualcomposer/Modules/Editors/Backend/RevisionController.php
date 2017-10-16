<?php

namespace VisualComposer\Modules\Editors\Backend;

if (!defined('ABSPATH')) {
    header('Status: 403 Forbidden');
    header('HTTP/1.1 403 Forbidden');
    exit;
}

use VisualComposer\Framework\Container;
use VisualComposer\Framework\Illuminate\Support\Module;
use VisualComposer\Helpers\Traits\WpFiltersActions;
use VisualComposer\Helpers\Traits\EventsFilters;
use VisualComposer\Helpers\Request;

class RevisionController extends Container implements Module
{
    use WpFiltersActions;
    use EventsFilters;

    public function __construct()
    {
        /** @see \VisualComposer\Modules\Editors\Backend\RevisionController::saveRevisionMeta */
        $this->wpAddAction('save_post', 'saveRevisionMeta');
        /** @see \VisualComposer\Modules\Editors\Backend\RevisionController::restoreRevision */
        $this->wpAddAction('wp_restore_post_revision', 'restoreRevision');

        /** @see \VisualComposer\Modules\Editors\Backend\RevisionController::getRevisionData */
        $this->addFilter(
            'vcv:ajax:getRevisionData:adminNonce',
            'getRevisionData'
        );
    }

    /**
     * Save meta for revision.
     *
     * @param $postId
     * @param $post
     */
    protected function saveRevisionMeta($postId, $post)
    {
        $requestHelper = vchelper('Request');
        $data = $requestHelper->input('data');

        $vcvData = $data['wp_autosave']['vcv-data'];
        // @codingStandardsIgnoreLine
        if (wp_is_post_revision($postId)) {
            if (false !== $vcvData) {
                // @codingStandardsIgnoreLine
                update_metadata('post', $postId, VCV_PREFIX . 'pageContent', $vcvData);
            }
        }
    }

    /**
     * @param $postId
     * @param $revisionId
     */
    protected function restoreRevision($postId, $revisionId)
    {
        // @codingStandardsIgnoreStart
        // $post = get_post($postId);
        $revision = get_post($revisionId);
        $pageContent = get_metadata('post', $revision->ID, VCV_PREFIX . 'pageContent', true);

        if (false !== $pageContent) {
            update_post_meta($postId, VCV_PREFIX . 'pageContent', $pageContent);
        } else {
            delete_post_meta($postId, VCV_PREFIX . 'pageContent');
        }
        // @codingStandardsIgnoreEnd
    }

    /**
     * @param \VisualComposer\Helpers\Request $requestHelper
     *
     * @return array
     */
    protected function getRevisionData(Request $requestHelper)
    {
        $response = [];
        $sourceId = $requestHelper->input('vcv-source-id');
        //get all post revisions
        $postRevisions = wp_get_post_revisions($sourceId);
        //take the latest one
        $latestRevision = array_shift($postRevisions);

        $pageContent = get_post_meta($latestRevision->ID, 'vcv-pageContent', true);

        $response['pageContent'] = $pageContent;

        return $response;
    }
}
