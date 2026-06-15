<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AutoAuth
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            $user = User::first();
            if (!$user) {
                $user = User::create([
                    'name' => 'Default User',
                    'email' => 'default@interventoria.app',
                    'password' => bcrypt('password'),
                ]);
            }
            Auth::login($user);
        }
        return $next($request);
    }
}
