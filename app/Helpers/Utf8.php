<?php

namespace App\Helpers;

class Utf8
{
    public static function clean(mixed $data): mixed
    {
        if (is_string($data)) {
            if (function_exists('mb_convert_encoding')) {
                $cleaned = mb_convert_encoding($data, 'UTF-8', 'UTF-8');
                return $cleaned !== false ? $cleaned : '';
            }
            if (preg_match('//u', $data)) {
                return $data;
            }
            return utf8_encode($data);
        }
        if (is_array($data)) {
            return array_map([self::class, 'clean'], $data);
        }
        if (is_object($data)) {
            foreach ($data as $key => $value) {
                $data->$key = self::clean($value);
            }
            return $data;
        }
        return $data;
    }
}
