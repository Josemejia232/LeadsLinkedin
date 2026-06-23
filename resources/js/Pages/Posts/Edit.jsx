import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

const STRATEGIC_HOURS_MAP = {
    1: [10],
    2: [10, 11, 12],
    3: [9, 10, 11, 12, 13, 14],
};

function getStrategicHours(dateStr) {
    if (!dateStr) return [];
    const d = new Date(dateStr);
    return STRATEGIC_HOURS_MAP[d.getDay()] || [];
}

function hourLabel(h) {
    if (h < 12) return `${h}:00 AM`;
    if (h === 12) return '12:00 PM';
    return `${h - 12}:00 PM`;
}

function buildHours(strategic) {
    const hours = [];
    for (let h = 6; h <= 22; h++) {
        const isStrategic = strategic.includes(h);
        hours.push({ hour: h, label: `${hourLabel(h)}${isStrategic ? ' ★' : ''}`, isStrategic });
    }
    return hours;
}

// Spinner icon component
function Spinner({ className = 'h-5 w-5' }) {
    return (
        <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
    );
}

export default function PostsEdit() {
    const { post, scheduledPost, flash } = usePage().props;
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    // AI auto-generation states
    const [aiLoading, setAiLoading] = useState(false);
    const [aiStatus, setAiStatus] = useState(''); // message to show user
    const [aiGenerated, setAiGenerated] = useState(false); // did we auto-generate on mount?

    const { data, setData, put, processing, errors } = useForm({
        title: post.title || '',
        text_content: post.text_content || '',
        hashtags: post.hashtags || '',
        call_to_action: post.call_to_action || '',
    });

    const [scheduleDate, setScheduleDate] = useState(() => {
        if (scheduledPost?.scheduled_date) {
            const d = new Date(scheduledPost.scheduled_date);
            return d.toLocaleString('sv-SE', { timeZone: 'America/Bogota' }).replace(' ', 'T').slice(0, 16);
        }
        return '';
    });
    const [scheduleProcessing, setScheduleProcessing] = useState(false);

    const postDate = post?.date ? new Date(post.date).toISOString().split('T')[0] : '';
    const strategicHours = getStrategicHours(post?.date);
    const allHours = buildHours(strategicHours);
    const currentHour = scheduledPost?.scheduled_date ? new Date(scheduledPost.scheduled_date).getHours() : 10;

    // ─── Auto-generation on mount ──────────────────────────────────────────────
    useEffect(() => {
        const missingContent = !post.text_content;
        const missingCta = !post.call_to_action;
        const missingHashtags = !post.hashtags;

        if (!missingContent && !missingCta && !missingHashtags) {
            // Nothing to generate
            return;
        }

        const run = async () => {
            setAiLoading(true);
            try {
                if (missingContent) {
                    // Generate full content (text + cta + hashtags)
                    setAiStatus('✨ Generando contenido del post con IA...');
                    const res = await fetch('/api/ai/generate-post-content', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ post_id: post.id }),
                    });
                    const result = await res.json();
                    if (result.success && result.content) {
                        setData(prev => ({
                            ...prev,
                            text_content: result.content.text || prev.text_content,
                            hashtags: result.content.hashtags || prev.hashtags,
                            call_to_action: result.content.cta || prev.call_to_action,
                        }));
                        setAiStatus('✅ Contenido generado automáticamente. Revisa y guarda.');
                        setAiGenerated(true);
                    } else if (result.message === 'Already has content') {
                        // Already had content, nothing to do
                        setAiStatus('');
                    } else {
                        setAiStatus('⚠️ No se pudo generar el contenido automáticamente.');
                    }
                } else if (missingCta || missingHashtags) {
                    // Generate only missing CTA and/or hashtags
                    setAiStatus('✨ Completando CTA y hashtags faltantes con IA...');
                    const res = await fetch('/api/ai/generate-missing-fields', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ post_id: post.id }),
                    });
                    const result = await res.json();
                    if (result.call_to_action || result.hashtags) {
                        setData(prev => ({
                            ...prev,
                            call_to_action: result.call_to_action || prev.call_to_action,
                            hashtags: result.hashtags || prev.hashtags,
                        }));
                        setAiStatus('✅ Campos completados automáticamente. Revisa y guarda.');
                        setAiGenerated(true);
                    } else if (result.error) {
                        setAiStatus(`⚠️ ${result.error}`);
                    } else {
                        setAiStatus('');
                    }
                }
            } catch (err) {
                console.error('AI auto-generation error:', err);
                setAiStatus('⚠️ Error al conectar con el servicio de IA.');
            } finally {
                setAiLoading(false);
            }
        };

        run();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Manual re-generate ────────────────────────────────────────────────────
    const handleRegenerateContent = async () => {
        setAiLoading(true);
        setAiStatus('✨ Regenerando contenido con IA...');
        try {
            const res = await fetch('/api/ai/generate-post-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post_id: post.id }),
            });
            const result = await res.json();
            if (result.success && result.content) {
                setData(prev => ({
                    ...prev,
                    text_content: result.content.text || prev.text_content,
                    hashtags: result.content.hashtags || prev.hashtags,
                    call_to_action: result.content.cta || prev.call_to_action,
                }));
                setAiStatus('✅ Contenido regenerado. Revisa los campos.');
            } else {
                setAiStatus('⚠️ No se pudo regenerar el contenido.');
            }
        } catch (err) {
            setAiStatus('⚠️ Error al regenerar.');
        } finally {
            setAiLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('posts.update', post.id));
    };

    const handleScheduleSubmit = async () => {
        setScheduleProcessing(true);
        try {
            await fetch(route('posts.schedule', post.id), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ scheduled_date: new Date(scheduleDate).toISOString() }),
            });
            window.location.reload();
        } catch (err) {
            console.error(err);
        } finally {
            setScheduleProcessing(false);
        }
    };

    const handleHourChange = (hour) => {
        const newDate = postDate + 'T' + hour.toString().padStart(2, '0') + ':00';
        setScheduleDate(newDate);
    };

    function toWebP(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const c = document.createElement('canvas');
                c.width = img.width;
                c.height = img.height;
                c.getContext('2d').drawImage(img, 0, 0);
                c.toBlob((blob) => {
                    const r = new FileReader();
                    r.onload = () => resolve(r.result);
                    r.onerror = reject;
                    r.readAsDataURL(blob);
                }, 'image/webp', 0.8);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        try {
            const dataUrl = await toWebP(file);
            const res = await fetch('/api/upload-post-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post_id: post.id, image: dataUrl }),
            });
            const result = await res.json();
            if (result.url) {
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Editar Publicación</h2>
                    <Link
                        href={route('plans.show', post.plan_id)}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >
                        Volver al Plan
                    </Link>
                </div>
            }
        >
            <Head title="Editar Publicación" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">

                    {/* Flash messages */}
                    {flash?.success && (
                        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-800">{flash.success}</div>
                    )}
                    {errors.submit && (
                        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">{errors.submit}</div>
                    )}

                    {/* AI Status Banner */}
                    {(aiLoading || aiStatus) && (
                        <div className={`mb-4 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                            aiLoading
                                ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                : aiStatus.startsWith('✅')
                                    ? 'border-green-200 bg-green-50 text-green-700'
                                    : aiStatus.startsWith('⚠️')
                                        ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
                                        : 'border-indigo-200 bg-indigo-50 text-indigo-700'
                        }`}>
                            {aiLoading && <Spinner className="h-4 w-4 flex-shrink-0" />}
                            <span>{aiStatus || 'Generando con IA...'}</span>
                        </div>
                    )}

                    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
                        <form onSubmit={handleSubmit} className="p-6">

                            {/* Title */}
                            <div className="mb-6">
                                <InputLabel htmlFor="title" value="Título" />
                                <TextInput
                                    id="title"
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    className="mt-1 block w-full"
                                    required
                                />
                            </div>

                            {/* Content */}
                            <div className="mb-6">
                                <div className="mb-1 flex items-center justify-between">
                                    <InputLabel htmlFor="text_content" value="Contenido" />
                                    {aiLoading && <span className="flex items-center gap-1 text-xs text-indigo-500"><Spinner className="h-3 w-3" /> generando...</span>}
                                </div>
                                <textarea
                                    id="text_content"
                                    rows={12}
                                    value={data.text_content}
                                    onChange={(e) => setData('text_content', e.target.value)}
                                    disabled={aiLoading}
                                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${aiLoading ? 'animate-pulse bg-gray-50' : ''}`}
                                    placeholder={aiLoading ? 'Generando con IA...' : ''}
                                />
                            </div>

                            {/* Hashtags */}
                            <div className="mb-6">
                                <div className="mb-1 flex items-center justify-between">
                                    <InputLabel htmlFor="hashtags" value="Hashtags" />
                                    {aiLoading && <span className="flex items-center gap-1 text-xs text-indigo-500"><Spinner className="h-3 w-3" /> generando...</span>}
                                </div>
                                <TextInput
                                    id="hashtags"
                                    type="text"
                                    value={data.hashtags}
                                    onChange={(e) => setData('hashtags', e.target.value)}
                                    disabled={aiLoading}
                                    className={`mt-1 block w-full ${aiLoading ? 'animate-pulse bg-gray-50' : ''}`}
                                    placeholder={aiLoading ? 'Generando hashtags...' : '#hashtag1 #hashtag2'}
                                />
                            </div>

                            {/* Call to Action */}
                            <div className="mb-6">
                                <div className="mb-1 flex items-center justify-between">
                                    <InputLabel htmlFor="call_to_action" value="Call to Action" />
                                    {aiLoading && <span className="flex items-center gap-1 text-xs text-indigo-500"><Spinner className="h-3 w-3" /> generando...</span>}
                                </div>
                                <textarea
                                    id="call_to_action"
                                    rows={3}
                                    value={data.call_to_action}
                                    onChange={(e) => setData('call_to_action', e.target.value)}
                                    disabled={aiLoading}
                                    className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${aiLoading ? 'animate-pulse bg-gray-50' : ''}`}
                                    placeholder={aiLoading ? 'Generando CTA...' : '¿Qué opinas tú?'}
                                />
                            </div>

                            {/* Schedule section */}
                            {scheduledPost && (
                                <div className="mb-6 rounded-lg border border-purple-200 bg-purple-50 p-4">
                                    <div className="mb-3 flex items-center justify-between">
                                        <div>
                                            <InputLabel value="Horario de Publicación" />
                                            <p className="mt-0.5 text-xs text-purple-600">
                                                Fecha: <span className="font-semibold">{new Date(scheduledPost.scheduled_date).toLocaleDateString('es-ES', { dateStyle: 'long', timeZone: 'America/Bogota' })}</span>
                                            </p>
                                        </div>
                                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                            scheduledPost.status === 'scheduled' ? 'bg-purple-100 text-purple-800' :
                                            scheduledPost.status === 'published' ? 'bg-green-100 text-green-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {scheduledPost.status === 'scheduled' ? 'Programado' : scheduledPost.status === 'published' ? 'Publicado' : scheduledPost.status}
                                        </span>
                                    </div>
                                    <div className="flex items-end gap-3">
                                        <div className="flex-1">
                                            <InputLabel htmlFor="scheduled_hour" value="Hora" />
                                            <select
                                                id="scheduled_hour"
                                                value={currentHour || 10}
                                                onChange={(e) => handleHourChange(Number(e.target.value))}
                                                className="mt-1 block w-full rounded-md border-purple-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
                                            >
                                                {allHours.map((h) => (
                                                    <option key={h.hour} value={h.hour}>
                                                        {h.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleScheduleSubmit}
                                            disabled={scheduleProcessing}
                                            className="inline-flex items-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-25"
                                        >
                                            {scheduleProcessing ? 'Guardando...' : 'Actualizar'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Submit row */}
                            <div className="flex items-center justify-between">
                                {/* Re-generate button */}
                                <button
                                    type="button"
                                    onClick={handleRegenerateContent}
                                    disabled={aiLoading || processing}
                                    title="Regenerar contenido con IA"
                                    className="inline-flex items-center gap-2 rounded-md border border-indigo-300 bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-100 disabled:opacity-40"
                                >
                                    {aiLoading
                                        ? <Spinner className="h-3.5 w-3.5" />
                                        : (
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                            </svg>
                                        )
                                    }
                                    Regenerar con IA
                                </button>

                                <PrimaryButton disabled={processing || aiLoading}>
                                    {processing ? 'Actualizando...' : 'Actualizar Publicación'}
                                </PrimaryButton>
                            </div>
                        </form>

                        {/* Image upload section */}
                        <div className="border-t border-gray-200 p-6">
                            <div className="mb-1 flex items-center gap-2">
                                {/* Camera icon */}
                                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                                </svg>
                                <InputLabel value="Imagen del Post" />
                            </div>
                            <p className="mb-3 text-xs text-gray-500">Se convertirá automáticamente a WebP para optimizar peso.</p>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                onChange={handleImageUpload}
                                className="hidden"
                            />

                            {post?.image_url ? (
                                <div className="group relative mt-3">
                                    <img
                                        src={post.image_url}
                                        alt="Preview"
                                        className="w-full rounded-lg border border-gray-200 object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-black/50 text-white opacity-0 transition group-hover:opacity-100"
                                    >
                                        {uploading ? (
                                            <>
                                                <Spinner className="h-6 w-6" />
                                                <span className="text-sm font-medium">Subiendo...</span>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                                                </svg>
                                                <span className="text-sm font-medium">Cambiar imagen</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="flex w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gray-300 px-6 py-10 text-sm text-gray-500 transition hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-50"
                                >
                                    {uploading ? (
                                        <>
                                            <Spinner className="h-8 w-8 text-indigo-500" />
                                            <span>Subiendo imagen...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                                            </svg>
                                            <div className="text-center">
                                                <span className="font-medium text-indigo-600">Haz clic para subir imagen</span>
                                                <p className="mt-1 text-xs text-gray-400">JPG, PNG, GIF, WebP · Máx 5MB</p>
                                            </div>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}