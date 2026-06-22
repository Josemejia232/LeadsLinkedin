<?php

namespace App\Services;

use App\Models\AppConfig;
use Illuminate\Support\Facades\Http;

class LinkedInService
{
    private const AUTH_URL = 'https://www.linkedin.com/oauth/v2/authorization';
    private const TOKEN_URL = 'https://www.linkedin.com/oauth/v2/accessToken';
    private const API_URL = 'https://api.linkedin.com/v2';
    private const SCOPES = ['w_member_social', 'openid', 'profile', 'email', 'r_refresh_token'];

    public function getOAuthUrl(): string
    {
        $redirectUri = route('publisher.linkedin-callback') . '/';

        return $this->getAuthorizationUrl($redirectUri);
    }

    public function getAuthorizationUrl(string $redirectUri): string
    {
        $params = http_build_query([
            'response_type' => 'code',
            'client_id' => AppConfig::get('LINKEDIN_CLIENT_ID'),
            'redirect_uri' => $redirectUri,
            'scope' => implode(' ', self::SCOPES),
        ]);

        return self::AUTH_URL . '?' . $params;
    }

    public function exchangeCodeForToken(string $code, string $redirectUri): array
    {
        $response = Http::asForm()->post(self::TOKEN_URL, [
            'grant_type' => 'authorization_code',
            'code' => $code,
            'client_id' => AppConfig::get('LINKEDIN_CLIENT_ID'),
            'client_secret' => AppConfig::get('LINKEDIN_CLIENT_SECRET'),
            'redirect_uri' => $redirectUri,
        ]);

        if ($response->failed()) {
            throw new \RuntimeException('LinkedIn token exchange failed: ' . ($response->json()['error_description'] ?? $response->body()));
        }

        return $response->json();
    }

    public function refreshAccessToken(string $refreshToken): array
    {
        $response = Http::asForm()->post(self::TOKEN_URL, [
            'grant_type' => 'refresh_token',
            'refresh_token' => $refreshToken,
            'client_id' => AppConfig::get('LINKEDIN_CLIENT_ID'),
            'client_secret' => AppConfig::get('LINKEDIN_CLIENT_SECRET'),
        ]);

        if ($response->failed()) {
            throw new \RuntimeException('LinkedIn token refresh failed: ' . ($response->json()['error_description'] ?? $response->body()));
        }

        return $response->json();
    }

    public function getUserInfo(string $accessToken): array
    {
        $response = Http::withToken($accessToken)
            ->get(self::API_URL . '/userinfo');

        if ($response->failed()) {
            throw new \RuntimeException('LinkedIn userinfo failed: ' . $response->body());
        }

        return $response->json();
    }

    public function getMe(string $accessToken): array
    {
        $response = Http::withToken($accessToken)
            ->withHeaders(['LinkedIn-Version' => '202412'])
            ->get(self::API_URL . '/me');

        return $response->json();
    }

    public function getValidToken(): ?string
    {
        $accessToken = AppConfig::get('LINKEDIN_ACCESS_TOKEN');

        if (!$accessToken) {
            return null;
        }

        $expiresAt = (int) AppConfig::get('LINKEDIN_TOKEN_EXPIRES_AT', '0');

        if ($expiresAt <= 0) {
            return $accessToken;
        }

        if (now()->timestamp < $expiresAt) {
            return $accessToken;
        }

        $refreshToken = AppConfig::get('LINKEDIN_REFRESH_TOKEN');

        if (!$refreshToken) {
            return null;
        }

        $data = $this->refreshAccessToken($refreshToken);

        if (isset($data['access_token'])) {
            $this->storeTokenData($data);

            return $data['access_token'];
        }

        return null;
    }

    public function handleCallback(string $code): void
    {
        $redirectUri = route('publisher.linkedin-callback') . '/';

        $data = $this->exchangeCodeForToken($code, $redirectUri);

        if (!isset($data['access_token'])) {
            throw new \RuntimeException('Failed to exchange authorization code: ' . ($data['error_description'] ?? 'Unknown error'));
        }

        $userInfo = $this->getUserInfo($data['access_token']);

        $personId = $userInfo['sub'] ?? '';

        if (empty($personId)) {
            throw new \RuntimeException(
                'No se pudo obtener el ID de LinkedIn. ' .
                'Respuesta /userinfo: ' . json_encode($userInfo)
            );
        }

        $this->storeTokenDataWithUser(
            $data,
            $personId,
            $userInfo['name'] ?? '',
            $userInfo['email'] ?? ''
        );
    }

    public function storeTokenData(array $data): void
    {
        AppConfig::set('LINKEDIN_ACCESS_TOKEN', $data['access_token'] ?? '');

        if (isset($data['refresh_token'])) {
            AppConfig::set('LINKEDIN_REFRESH_TOKEN', $data['refresh_token']);
        }

        if (isset($data['expires_in'])) {
            AppConfig::set('LINKEDIN_TOKEN_EXPIRES_AT', (string) (now()->timestamp + (int) $data['expires_in']));
        }
    }

    public function storeTokenDataWithUser(
        array $data,
        string $personId,
        string $personName,
        string $personEmail
    ): void {
        $this->storeTokenData($data);

        AppConfig::set('LINKEDIN_PERSON_ID', $personId);
        AppConfig::set('LINKEDIN_PERSON_NAME', $personName);
        AppConfig::set('LINKEDIN_PERSON_EMAIL', $personEmail);
    }

    public function publish($post): array
    {
        $token = $this->getValidToken();
        if (!$token) {
            throw new \RuntimeException('LinkedIn not connected');
        }

        $personId = AppConfig::get('LINKEDIN_PERSON_ID');
        $text = $post->text_content ?? $post->title;

        return $this->createTextPost($token, $personId, $text);
    }

    public function createTextPost(string $accessToken, string $personId, string $text): array
    {
        $urn = "urn:li:person:{$personId}";

        $response = Http::withToken($accessToken)
            ->withHeaders(['LinkedIn-Version' => '202412'])
            ->post(self::API_URL . '/rest/posts', [
                'author' => $urn,
                'commentary' => $text,
                'visibility' => 'PUBLIC',
                'lifecycleState' => 'PUBLISHED',
                'distribution' => [
                    'feedDistribution' => 'MAIN_FEED',
                    'targetEntities' => [],
                    'thirdPartyDistributionChannels' => [],
                ],
            ]);

        $body = $response->json();
        $postId = $body['id'] ?? '';

        if ($response->failed() && empty($postId)) {
            return [
                'postId' => '',
                'responseData' => $body,
                'statusCode' => $response->status(),
            ];
        }

        return [
            'postId' => $postId,
            'responseData' => $body,
            'statusCode' => $response->status(),
        ];
    }
}
