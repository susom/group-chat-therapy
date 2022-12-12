<?php
namespace Stanford\GroupTherapy;

include_once "emLoggerTrait.php";

use \REDCap;
use \Exception;
use \Logging;


class GroupTherapy extends \ExternalModules\AbstractExternalModule {
    use emLoggerTrait;

    public function injectJavascript($page)
    {
        try {

            $jsFilePath = $this->getUrl("scripts/$page.js");
//            $csrfToken = json_encode($this->getCSRFToken());
            print "<script type='module' src=$jsFilePath></script>";
//            print "<script type='text/javascript'>var ajaxUrl = $ajaxFilePath; var csrfToken = $csrfToken</script>";


        } catch (\Exception $e) {
            \REDCap::logEvent("Error injecting js: $e");
            $this->emError($e);
        }
    }

}
