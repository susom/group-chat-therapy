<?php

namespace Stanford\GroupChatTherapy;

// Recursive implementation of a sanitizer for nested payloads
class Sanitizer
{
    public function sanitizeSingle(&$string): void
    {
        if(is_bool($string))
            return;

        if (function_exists("get_magic_quotes_gpc") && get_magic_quotes_gpc()) {
            $string = stripslashes($string);
        }
        $string = trim(htmlspecialchars($string, ENT_QUOTES));
    }

    public function sanitize($data) {
        if (is_array($data)) {
            array_walk_recursive($data, [$this, 'sanitizeSingle']);  // replace your loop with this line
        } else {
            $this->sanitizeSingle($data);
        }
        return $data;
    }
}
