import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';

export default function PlansShow() {
    const { plan, posts, flash } = usePage().props;
    const [scheduling, setScheduling] = useState(null);
    const [scheduleDate, setScheduleDate] = useState('');
    const [expandedPostId, setExpandedPostId] = useState(null);
    const [flashState, setFlashState] = useState(flash?.success || flash?.error ? flash : null);

    const [uploadingPostId, setUploadingPostId] = useState(null);
    const [aiLoadingPostId, setAiLoadingPostId] = useState(null);
    const [aiStatusMap, setAiStatusMap] = useState({});
    const fileInputRef = useRef(null);

    // Spinner component
    function Spinner({ className = 'h-5 w-5' }) {
        return (
            <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
        );
    }

    // Convert file to WebP format
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

    const triggerImageUpload = (postId) => {
        setUploadingPostId(postId);
        setTimeout(() => {
            fileInputRef.current?.click();
        }, 100);
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !uploadingPostId) return;

        const postId = uploadingPostId;
        try {
            const dataUrl = await toWebP(file);
            const res = await fetch('/api/upload-post-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post_id: postId, image: dataUrl }),
            });
            const result = await res.json();
            if (result.url) {
                router.reload({
                    preserveScroll: true,
                    onSuccess: () => {
                        setUploadingPostId(null);
                    }
                });
            } else {
                setUploadingPostId(null);
            }
        } catch (err) {
            console.error('Image upload error:', err);
            setUploadingPostId(null);
        }
    };

    // Auto-generate missing fields on post expand
    useEffect(() => {
        if (!expandedPostId) return;

        const post = posts.find(p => p.id === expandedPostId);
        if (!post) return;

        const missingContent = !post.text_content;
        const missingCta = !post.call_to_action;
        const missingHashtags = !post.hashtags;

        if (!missingContent && !missingCta && !missingHashtags) {
            return;
        }

        const runAutoGeneration = async () => {
            setAiLoadingPostId(post.id);
            setAiStatusMap(prev => ({ ...prev, [post.id]: '✨ Detectando campos faltantes...' }));
            try {
                if (missingContent) {
                    setAiStatusMap(prev => ({ ...prev, [post.id]: '✨ Generando contenido del post con IA...' }));
                    const res = await fetch('/api/ai/generate-post-content', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ post_id: post.id }),
                    });
                    const result = await res.json();
                    if (result.success && result.content) {
                        setAiStatusMap(prev => ({ ...prev, [post.id]: '✅ Contenido generado automáticamente.' }));
                        router.reload({
                            preserveScroll: true,
                            onSuccess: () => {
                                setAiLoadingPostId(null);
                            }
                        });
                    } else if (result.success && result.message === 'Already has content') {
                        setAiLoadingPostId(null);
                    } else {
                        setAiStatusMap(prev => ({ ...prev, [post.id]: '⚠️ No se pudo generar el contenido.' }));
                        setAiLoadingPostId(null);
                    }
                } else if (missingCta || missingHashtags) {
                    setAiStatusMap(prev => ({ ...prev, [post.id]: '✨ Completando CTA y hashtags con IA...' }));
                    const res = await fetch('/api/ai/generate-missing-fields', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ post_id: post.id }),
                    });
                    const result = await res.json();
                    if (result.call_to_action || result.hashtags) {
                        setAiStatusMap(prev => ({ ...prev, [post.id]: '✅ Campos completados automáticamente.' }));
                        router.reload({
                            preserveScroll: true,
                            onSuccess: () => {
                                setAiLoadingPostId(null);
                            }
                        });
                    } else {
                        setAiStatusMap(prev => ({ ...prev, [post.id]: '⚠️ No se pudieron generar los campos faltantes.' }));
                        setAiLoadingPostId(null);
                    }
                }
            } catch (err) {
                console.error('Error auto-generating post fields:', err);
                setAiStatusMap(prev => ({ ...prev, [post.id]: '⚠️ Error al conectar con el servicio de IA.' }));
                setAiLoadingPostId(null);
            }
        };

        runAutoGeneration();
    }, [expandedPostId, posts]);

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];

    const handleDeletePost = (postId) => {
        if (confirm('¿Eliminar esta publicación?')) {
            router.delete(route('posts.destroy', postId), {
                preserveScroll: true,
                onSuccess: () => window.location.reload(),
            });
        }
    };

    const handleSchedulePost = (postId) => {
        if (scheduleDate) {
            router.post(route('posts.schedule', postId), {
                scheduled_date: new Date(scheduleDate).toISOString(),
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    setScheduling(null);
                    setScheduleDate('');
                    window.location.reload();
                },
            });
        }
    };

    const handlePublishNow = (postId) => {
        if (confirm('¿Publicar este post ahora en LinkedIn?')) {
            router.post(route('publisher.publish', postId), {}, {
                preserveScroll: true,
                onSuccess: () => window.location.reload(),
            });
        }
    };

    const statusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            generated: 'bg-blue-100 text-blue-800',
            scheduled: 'bg-purple-100 text-purple-800',
            published: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800',
        };
        const labels = {
            pending: 'Pendiente',
            generated: 'Generado',
            scheduled: 'Programado',
            published: 'Publicado',
            failed: 'Fallido',
        };
        return (
            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">{plan?.topic_name}</h2>
                        <p className="text-sm text-gray-500">
                            {plan ? `${months[plan.month - 1]} ${plan.year}` : ''}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('plans.edit', plan?.id)}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Editar Plan
                        </Link>
                        <Link
                            href={route('plans.index')}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Volver
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={plan?.topic_name || 'Plan'} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {flashState?.success && (
                        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-800">{flashState.success}</div>
                    )}
                    {flashState?.error && (
                        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">{flashState.error}</div>
                    )}

                    {posts?.length > 0 ? (
                        <div className="space-y-4">
                            {posts.map((post) => {
                                const isExpanded = expandedPostId === post.id;
                                return (
                                    <div key={post.id} className="overflow-hidden rounded-lg bg-white shadow">
                                        <button
                                            onClick={() => setExpandedPostId(prev => prev === post.id ? null : post.id)}
                                            className={`flex w-full items-center justify-between px-6 py-4 text-left transition hover:bg-gray-50 ${isExpanded ? 'border-b border-gray-200' : ''}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-medium text-gray-400">#{post.order}</span>
                                                <span className="text-sm font-medium text-gray-900">{post.title}</span>
                                                {statusBadge(post.status)}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-gray-500">{post.date}</span>
                                                <svg className={`h-5 w-5 text-gray-400 transition ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </div>
                                        </button>

                                        {isExpanded && (
                                            <div className="p-6">
                                                {/* AI Status Banner inside the post detail */}
                                                {(aiLoadingPostId === post.id || aiStatusMap[post.id]) && (
                                                    <div className={`mb-4 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                                                        aiLoadingPostId === post.id
                                                            ? 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                                            : aiStatusMap[post.id]?.startsWith('✅')
                                                                ? 'border-green-200 bg-green-50 text-green-700'
                                                                : aiStatusMap[post.id]?.startsWith('⚠️')
                                                                    ? 'border-yellow-200 bg-yellow-50 text-yellow-700'
                                                                    : 'border-indigo-200 bg-indigo-50 text-indigo-700'
                                                    }`}>
                                                        {aiLoadingPostId === post.id && <Spinner className="h-4 w-4 flex-shrink-0" />}
                                                        <span>{aiStatusMap[post.id] || 'Generando con IA...'}</span>
                                                    </div>
                                                )}

                                                <div className="mb-4">
                                                    <h4 className="mb-1 text-xs font-semibold uppercase text-gray-500">Contenido</h4>
                                                    <p className={`whitespace-pre-wrap text-sm text-gray-700 ${aiLoadingPostId === post.id && !post.text_content ? 'animate-pulse text-gray-400' : ''}`}>
                                                        {post.text_content || (aiLoadingPostId === post.id ? 'Generando contenido con IA...' : 'Sin contenido generado')}
                                                    </p>
                                                </div>

                                                <div className="mb-4">
                                                    <h4 className="mb-1 text-xs font-semibold uppercase text-gray-500">Hashtags</h4>
                                                    <p className={`text-sm ${post.hashtags ? 'text-indigo-600' : 'text-gray-400'} ${aiLoadingPostId === post.id && !post.hashtags ? 'animate-pulse text-indigo-300' : ''}`}>
                                                        {post.hashtags || (aiLoadingPostId === post.id ? 'Generando hashtags...' : 'Sin hashtags')}
                                                    </p>
                                                </div>

                                                <div className="mb-4">
                                                    <h4 className="mb-1 text-xs font-semibold uppercase text-gray-500">Call to Action</h4>
                                                    <p className={`text-sm text-gray-700 ${aiLoadingPostId === post.id && !post.call_to_action ? 'animate-pulse text-gray-400' : ''}`}>
                                                        {post.call_to_action || (aiLoadingPostId === post.id ? 'Generando Call to Action...' : 'Sin Call to Action')}
                                                    </p>
                                                </div>

                                                {/* Imagen: ícono para cargar/subir imagen directamente desde la vista del post */}
                                                <div className="mb-4">
                                                    <h4 className="mb-1 text-xs font-semibold uppercase text-gray-500 flex items-center gap-1">
                                                        <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                                        </svg>
                                                        Imagen del Post
                                                    </h4>
                                                    {post.image_url ? (
                                                        <div className="relative group max-w-xs mt-2">
                                                            <img src={post.image_url} alt={post.title} className="max-h-48 rounded object-contain border border-gray-200" />
                                                            <button
                                                                type="button"
                                                                onClick={() => triggerImageUpload(post.id)}
                                                                disabled={uploadingPostId === post.id}
                                                                className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition duration-200"
                                                            >
                                                                {uploadingPostId === post.id ? (
                                                                    <>
                                                                        <Spinner className="h-6 w-6 text-white" />
                                                                        <span className="text-xs font-semibold mt-1">Subiendo...</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15a2.25 2.25 0 0 0 2.25-2.25V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                                                                        </svg>
                                                                        <span className="text-xs font-semibold mt-1">Cambiar Imagen</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => triggerImageUpload(post.id)}
                                                            disabled={uploadingPostId === post.id}
                                                            className="mt-2 flex items-center justify-center gap-2 border border-gray-300 rounded px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                                                        >
                                                            {uploadingPostId === post.id ? (
                                                                <>
                                                                    <Spinner className="h-4 w-4 text-indigo-600" />
                                                                    <span>Subiendo...</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    <span>Subir Imagen</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </div>

                                                {post.error_message && (
                                                    <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                                                        Error: {post.error_message}
                                                    </div>
                                                )}

                                                <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
                                                    <Link
                                                        href={route('posts.edit', post.id)}
                                                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                                    >
                                                        Editar
                                                    </Link>

                                                    {post.status !== 'published' && (
                                                        <button
                                                            onClick={() => handlePublishNow(post.id)}
                                                            className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                                                        >
                                                            Publicar Ahora
                                                        </button>
                                                    )}

                                                    {scheduling === post.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="datetime-local"
                                                                value={scheduleDate}
                                                                onChange={(e) => setScheduleDate(e.target.value)}
                                                                className="rounded-md border border-gray-300 px-2 py-1.5 text-xs"
                                                            />
                                                            <button
                                                                onClick={() => handleSchedulePost(post.id)}
                                                                className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-500"
                                                            >
                                                                Confirmar
                                                            </button>
                                                            <button
                                                                onClick={() => setScheduling(null)}
                                                                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
                                                            >
                                                                Cancelar
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setScheduling(post.id)}
                                                            className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                                        >
                                                            Programar
                                                        </button>
                                                    )}

                                                    {post.scheduled_post && (
                                                        <span className="text-xs text-purple-600">
                                                            Programado: {new Date(post.scheduled_post.scheduled_date).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}
                                                            {post.scheduled_post.status === 'published' && ` — Publicado: ${new Date(post.scheduled_post.published_at).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`}
                                                        </span>
                                                    )}

                                                    <button
                                                        onClick={() => handleDeletePost(post.id)}
                                                        className="ml-auto rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                                                    >
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-lg bg-white p-12 text-center shadow">
                            <p className="text-gray-500">No hay publicaciones en este plan.</p>
                        </div>
                    )}
                </div>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageUpload}
                className="hidden"
            />
        </AuthenticatedLayout>
    );
}