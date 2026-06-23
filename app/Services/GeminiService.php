<?php

namespace App\Services;

use App\Helpers\Utf8;
use App\Models\AppConfig;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    private const API_URL = 'https://api.openai.com/v1/chat/completions';
    private const MODEL = 'gpt-4o-mini';

    private const LINKEDIN_SYSTEM_PROMPT = "Eres un experto en marketing de contenidos B2B para LinkedIn. SIEMPRE sigues esta estructura universal para cada publicación:\n\n1. HOOK (primera línea): Una frase impactante basada en el tema que genera curiosidad inmediata. Debe enganchar al lector en los primeros 2 segundos. Usa datos sorprendentes, preguntas retóricas, o declaraciones polémicas.\n\n2. CUERPO (desarrollo): 3-5 párrafos cortos con valor concreto. Usa emojis para separar ideas. Incluye datos, estadísticas o ejemplos reales. Mantén párrafos de máximo 2-3 líneas para legibilidad en móvil.\n\n3. CTA (llamada a la acción): Pregunta o invitación a la acción que genere engagement (comentarios, compartidos).\n\nREGLAS:\n- Nunca uses títulos con asteriscos en el cuerpo del texto\n- El hook NUNCA debe empezar con \"¿Sabías que?\" o \"En el mundo de...\"\n- Usa lenguaje directo y conversacional\n- Incluye números específicos cuando sea posible\n- El texto total debe tener entre 100 y 300 palabras";

    private ?string $apiKey = null;
    private ?string $lastRawResponse = null;

    public function getLastRawResponse(): ?string
    {
        return $this->lastRawResponse;
    }

    public function setApiKey(?string $apiKey): self
    {
        $this->apiKey = $apiKey;
        return $this;
    }

    public function generate(string $prompt, float $temperature = 0.8, int $maxTokens = 4096, ?string $apiKey = null): string
    {
        $maxRetries = 3;
        $attempt = 0;

        while ($attempt < $maxRetries) {
            $attempt++;
            try {
                $key = $apiKey ?? $this->apiKey ?? AppConfig::get('GEMINI_API_KEY');
                if (!$key) {
                    Log::warning('GeminiService: no API key configured');
                    $this->lastRawResponse = 'No API key configured';
                    return '';
                }

                $response = Http::timeout(60)
                    ->withToken($key)
                    ->post(self::API_URL, Utf8::clean([
                        'model' => self::MODEL,
                        'messages' => [
                            ['role' => 'system', 'content' => self::LINKEDIN_SYSTEM_PROMPT],
                            ['role' => 'user', 'content' => $prompt],
                        ],
                        'temperature' => $temperature,
                        'max_tokens' => $maxTokens,
                    ]));

                if ($response->status() === 429 && $attempt < $maxRetries) {
                    $delay = 5 * $attempt;
                    Log::warning("GeminiService: rate limited (attempt {$attempt}), retrying in {$delay}s");
                    $this->lastRawResponse = "HTTP 429: rate limited, retrying in {$delay}s";
                    sleep($delay);
                    continue;
                }

                if ($response->failed()) {
                    $body = $response->body();
                    $this->lastRawResponse = "HTTP {$response->status()}: {$body}";
                    Log::error("GeminiService: API request failed - status {$response->status()}: {$body}");
                    return '';
                }

                $data = $response->json();
                $this->lastRawResponse = json_encode($data, JSON_INVALID_UTF8_SUBSTITUTE);

                $text = $data['choices'][0]['message']['content'] ?? '';

                if (empty($text)) {
                    Log::warning('GeminiService: API returned empty text', ['response' => $data]);
                }

                return $text;
            } catch (\Throwable $e) {
                $this->lastRawResponse = 'Exception: ' . $e->getMessage();
                Log::error('GeminiService: exception: ' . $e->getMessage());
                return '';
            }
        }

        return '';
    }

    public function generatePostContent(
        string $topic,
        string $title,
        string $postType,
        string $keywords,
        string $callToAction = ''
    ): array {
        $prompt = "Genera un post breve y directo para LinkedIn.\n\nTema: {$topic}\nTítulo: {$title}\nTipo: {$postType}\nPalabras clave: {$keywords}\n\nDevuelve tu respuesta usando este formato exacto:\n\n---HOOK---\n[Escribe aquí el hook, una frase impactante que enganche]\n---CONTENIDO---\n[Escribe aquí 2-3 párrafos cortos]\n---CTA---\n[Escribe aquí un llamado a la acción, una pregunta para generar comentarios]\n---HASHTAGS---\n[Escribe aquí 5-10 hashtags relevantes separados por espacio, empezando cada uno con #]";

        $response = $this->generate($prompt);

        $text = '';
        $hashtags = '';
        $cta = '';

        $pattern = '/---HOOK---\s*(.*?)\s*---CONTENIDO---\s*(.*?)\s*---CTA---\s*(.*?)\s*---HASHTAGS---\s*(.*?)$/s';
        if (preg_match($pattern, $response, $m)) {
            $hook = trim($m[1]);
            $body = trim($m[2]);
            $cta = trim($m[3]);
            $hashtags = trim($m[4]);

            if ($hook && $body) {
                $text = $hook . "\n\n" . $body;
            } elseif ($hook) {
                $text = $hook;
            } elseif ($body) {
                $text = $body;
            }
        }

        if (!$text) {
            $parts = preg_split('/\n\n+/', trim($response), 3);
            $text = trim($parts[0] ?? '');
            if (count($parts) > 1) {
                $text .= "\n\n" . trim($parts[1] ?? '');
            }
            if (count($parts) > 2) {
                $last = trim($parts[2]);
                if (preg_match('/^(.*?)((?:#[^\s#]+\s*)+)$/s', $last, $hm)) {
                    $cta = trim($hm[1]);
                    $hashtags = trim($hm[2]);
                } else {
                    $cta = $last;
                }
            }
        }

        if (!$text) {
            $text = $response;
        }

        return [
            'text' => $text,
            'hashtags' => $hashtags,
            'cta' => $cta,
        ];
    }

    public function generatePostTitles(
        string $topicName,
        string $industry,
        string $keywords,
        int $totalPosts = 20
    ): array {
        $prompt = "Genera {$totalPosts} títulos variados y atractivos para publicaciones de LinkedIn sobre el tema '{$topicName}' en la industria '{$industry}'. Palabras clave: {$keywords}.

REGLAS PARA TÍTULOS (hooks):
- Cada título DEBE ser un gancho que genere curiosidad inmediata
- Usa datos específicos o estadísticas cuando sea posible
- Haz preguntas retóricas que obliguen a pensar
- Evita empezar con '¿Sabías que?' o 'En el mundo de...'
- Sé directo y concreto en máximo 10-15 palabras
- Incluye números cuando sea relevante

Devuelve solo los títulos numerados del 1 al {$totalPosts}.";

        $response = $this->generate($prompt);

        $lines = explode("\n", $response);
        $titles = [];

        foreach ($lines as $line) {
            $line = trim($line);
            if (!$line) {
                continue;
            }

            $cleaned = preg_replace('/^\d+[\.\)]\s*/', '', $line);

            if ($cleaned && $cleaned !== $line) {
                $titles[] = $cleaned;
            } elseif (!preg_match('/^\d+[\.\)]/', $line)) {
                $titles[] = $line;
            }
        }

        return $titles;
    }

    public function generateMonthlyPlan(
        string $topicName,
        string $industry,
        string $keywords,
        string $objectives,
        string $targetAudience,
        int $totalPosts = 20
    ): string {
        $prompt = "Crea un plan mensual de contenido para LinkedIn sobre el tema '{$topicName}' en la industria '{$industry}'. Palabras clave: {$keywords}. Objetivos: {$objectives}. Audiencia objetivo: {$targetAudience}. Genera {$totalPosts} ideas de publicaciones con estructura: día del mes, título, breve descripción y tipo de contenido (educativo, inspiracional, promocional, interactivo).";

        return $this->generate($prompt);
    }

    public function generateTopicSuggestions(string $topicName): array
    {
        $prompt = "Eres un experto en marketing de contenidos B2B para LinkedIn. Analiza el tema '{$topicName}' y sugiere: industria relacionada, palabras clave relevantes, objetivos de contenido, audiencia objetivo, y 5 títulos sugeridos para publicaciones. Devuelve en formato: INDUSTRIA: ... KEYWORDS: ... OBJETIVOS: ... AUDIENCIA: ... TITULOS: ...";

        $response = $this->generate($prompt);

        $industry = '';
        $keywords = '';
        $objectives = '';
        $audience = '';
        $titles = [];

        if (preg_match('/INDUSTRIA:\s*(.*?)(?:\n|$)($|KEYWORDS:)/s', $response, $m)) {
            $industry = trim($m[1]);
        }
        if (preg_match('/KEYWORDS:\s*(.*?)(?:\n|$)($|OBJETIVOS:)/s', $response, $m)) {
            $keywords = trim($m[1]);
        }
        if (preg_match('/OBJETIVOS:\s*(.*?)(?:\n|$)($|AUDIENCIA:)/s', $response, $m)) {
            $objectives = trim($m[1]);
        }
        if (preg_match('/AUDIENCIA:\s*(.*?)(?:\n|$)($|TITULOS:)/s', $response, $m)) {
            $audience = trim($m[1]);
        }
        if (preg_match('/TITULOS:\s*(.*?)$/s', $response, $m)) {
            $titleLines = explode("\n", trim($m[1]));
            foreach ($titleLines as $line) {
                $line = trim($line);
                if ($line) {
                    $cleaned = preg_replace('/^\d+[\.\)]\s*/', '', $line);
                    $titles[] = $cleaned ?: $line;
                }
            }
        }

        if (!$industry && !$keywords && !$objectives && !$audience && !$titles) {
            $industry = $response;
        }

        return [
            'industry' => $industry,
            'keywords' => $keywords,
            'objectives' => $objectives,
            'audience' => $audience,
            'titles' => $titles,
        ];
    }

    public function generateCtaAndHashtags(string $topic, string $title): array
    {
        $prompt = "Tema: {$topic}\nTítulo: {$title}\n\nGenera solo un Call to Action (una pregunta para LinkedIn que invite a comentar) y 5-10 hashtags relevantes separados por espacio.\n\nFormato:\nCTA: [texto]\nHASHTAGS: [#tag1 #tag2 ...]";

        $response = $this->generate($prompt);

        $cta = '';
        $hashtags = '';

        if (preg_match('/CTA:\s*(.+?)(?:\n|$)/s', $response, $m)) {
            $cta = trim($m[1]);
        }
        if (preg_match('/HASHTAGS:\s*(.+?)$/s', $response, $m)) {
            $hashtags = trim($m[1]);
        }

        if (!$cta && !$hashtags) {
            $lines = explode("\n", trim($response));
            $cta = trim($lines[0] ?? '');
            if (count($lines) > 1) {
                $last = trim($lines[count($lines) - 1]);
                if (str_starts_with($last, '#')) {
                    $hashtags = $last;
                }
            }
        }

        return ['cta' => $cta, 'hashtags' => $hashtags];
    }
}
