import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import React, { useState, useEffect, useRef } from 'react';
import { insforge } from '@/lib/insforge';

export default function PlansShow({ planId }) {
    const [plan, setPlan] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [flash, setFlash] = useState(null);
    const [scheduling, setScheduling] = useState(null);
    const [scheduleDate, setScheduleDate] = useState('');
    const [generatingTitles, setGeneratingTitles] = useState(false);
    const [generatingContent, setGeneratingContent] = useState(false);
    const [expandedPostId, setExpandedPostId] = useState(null);
    const [uploadingPostId, setUploadingPostId] = useState(null);
    const [generatingPostContent, setGeneratingPostContent] = useState(null);
    const fileInputRefs = useRef({});

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];

    async function fetchData() {
        try {
            setLoading(true);

            const { data: planData, error: planError } = await insforge.database
                .from('monthly_plans')
                .select('*')
                .eq('id', planId)
                .single();

            if (planError) {
                setError(planError.message);
                return;
            }

            setPlan(planData);

            const { data: postsData, error: postsError } = await insforge.database
                .from('day_posts')
                .select('*')
                .eq('plan_id', planId)
                .order('date', { ascending: true });

            if (postsError) {
                setError(postsError.message);
            } else {
                setPosts(postsData || []);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();
    }, [planId]);

    const handleGenerateTitles = async () => {
        if (!confirm('¿Generar títulos de posts con IA?')) return;
        setGeneratingTitles(true);
        setError(null);
        try {
            const res = await fetch('/api/ai/generate-titles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan_id: planId }),
            });
            const result = await res.json();
            if (result.success) {
                setFlash({ success: `${result.created} títulos generados exitosamente.` });
                fetchData();
            } else {
                setError(result.error || 'Error al generar títulos');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setGeneratingTitles(false);
        }
    };

    const handleGenerateContent = async () => {
        if (!confirm('¿Generar contenido con IA para todos los posts pendientes?')) return;
        setGeneratingContent(true);
        setError(null);
        try {
            const res = await fetch('/api/ai/generate-plan-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan_id: planId }),
            });
            const result = await res.json();
            if (result.success) {
                setFlash({ success: `Contenido generado para ${result.generated} de ${result.total} posts.` });
                fetchData();
            } else {
                setError(result.error || 'Error al generar contenido');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setGeneratingContent(false);
        }
    };

    const handleGeneratePostContent = async (postId) => {
        setGeneratingPostContent(postId);
        setError(null);
        try {
            const res = await fetch('/api/ai/generate-post-content', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post_id: postId }),
            });
            const result = await res.json();
            if (result.success) {
                setPosts(prev => prev.map(p =>
                    p.id === postId
                        ? {
                            ...p,
                            text_content: result.content.text,
                            call_to_action: result.content.cta || p.call_to_action,
                            hashtags: result.content.hashtags || p.hashtags,
                            status: 'generated',
                        }
                        : p
                ));
            } else {
                setError(result.error || 'Error al generar contenido');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setGeneratingPostContent(null);
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

    const handleDeletePost = async (postId) => {
        if (confirm('¿Eliminar esta publicación?')) {
            try {
                const { error } = await insforge.database
                    .from('day_posts')
                    .delete()
                    .eq('id', postId);

                if (error) {
                    setError(error.message);
                } else {
                    setPosts(prev => prev.filter(p => p.id !== postId));
                }
            } catch (err) {
                setError(err.message);
            }
        }
    };

    const handleSchedulePost = async (postId) => {
        if (scheduleDate) {
            try {
                const { data: existing } = await insforge.database
                    .from('scheduled_posts')
                    .select('id')
                    .eq('day_post_id', postId)
                    .maybeSingle();

                const payload = {
                    day_post_id: postId,
                    scheduled_date: new Date(scheduleDate).toISOString(),
                    status: 'scheduled',
                };

                let error;
                if (existing) {
                    ({ error } = await insforge.database
                        .from('scheduled_posts')
                        .update(payload)
                        .eq('id', existing.id));
                } else {
                    ({ error } = await insforge.database
                        .from('scheduled_posts')
                        .insert([payload]));
                }

                if (error) {
                    setError(error.message);
                } else {
                    setPosts(prev => prev.map(p =>
                        p.id === postId ? { ...p, status: 'scheduled' } : p
                    ));
                    setScheduling(null);
                    setScheduleDate('');
                    setFlash({ success: 'Post programado exitosamente.' });
                }
            } catch (err) {
                setError(err.message);
            }
        }
    };

    const toggleExpand = async (postId) => {
        const wasExpanded = expandedPostId === postId;
        setExpandedPostId(prev => prev === postId ? null : postId);

        if (!wasExpanded) {
            const post = posts.find(p => p.id === postId);
            if (post && post.title) {
                const missingCta = !post.call_to_action;
                const missingHashtags = !post.hashtags;
                if (missingCta || missingHashtags) {
                    try {
                        const res = await fetch('/api/ai/generate-missing-fields', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ post_id: postId }),
                        });
                        const result = await res.json();
                        setPosts(prev => prev.map(p =>
                            p.id === postId
                                ? {
                                    ...p,
                                    call_to_action: result.call_to_action || p.call_to_action,
                                    hashtags: result.hashtags || p.hashtags,
                                }
                                : p
                        ));
                    } catch (err) {
                    }
                }
            }
        }
    };

    const toWebP = (file) => new Promise((resolve, reject) => {
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

    const handleImageUpload = async (e, postId) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploadingPostId(postId);
        try {
            const dataUrl = await toWebP(file);

            const res = await fetch('/api/upload-post-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ post_id: postId, image: dataUrl }),
            });
            const result = await res.json();

            if (result.url) {
                setPosts(prev => prev.map(p =>
                    p.id === postId ? { ...p, image_url: result.url } : p
                ));
            } else {
                setError(result.error || 'Error al subir imagen');
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setUploadingPostId(null);
        }
    };

    if (loading) {
        return (
            <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Cargando...</h2>}>
                <div className="py-12">
                    <div className="mx-auto max-w-7xl px-4 text-center text-gray-500">Cargando plan...</div>
                </div>
            </AuthenticatedLayout>
        );
    }

    if (error) {
        return (
            <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Error</h2>}>
                <div className="py-12">
                    <div className="mx-auto max-w-7xl px-4 text-center text-red-600">{error}</div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800">
                            {plan?.topic_name} - {months[plan?.month - 1]} {plan?.year}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {plan?.total_posts} posts planificados
                        </p>
                        <p className="text-xs text-gray-400">
                            Horarios: {(plan?.schedule_hours || []).map((h) => h.toString().padStart(2, '0') + ':00').join(', ')}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {posts.length === 0 && (
                            <button
                                onClick={handleGenerateTitles}
                                disabled={generatingTitles}
                                className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-sm transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {generatingTitles ? 'Generando...' : 'Generar Títulos'}
                            </button>
                        )}
                        {posts.length > 0 && (
                            <button
                                onClick={handleGenerateContent}
                                disabled={generatingContent}
                                className="inline-flex items-center rounded-md bg-emerald-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white shadow-sm transition hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50"
                            >
                                {generatingContent ? 'Generando...' : 'Generar con IA'}
                            </button>
                        )}
                        <Link
                            href={route('plans.edit', plan.id)}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Editar Plan
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`${plan?.topic_name || 'Plan'}`} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-800">{flash.success}</div>
                    )}

                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <h3 className="text-lg font-medium text-gray-900">Publicaciones</h3>
                        </div>
                        {posts.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-full">Título</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {posts.map((post) => (
                                        <React.Fragment key={post.id}>
                                            <tr className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    <button
                                                        onClick={() => toggleExpand(post.id)}
                                                        className="flex items-center gap-2 text-left w-full hover:text-indigo-600 transition"
                                                    >
                                                        <svg
                                                            className={`h-4 w-4 shrink-0 text-gray-400 transition ${expandedPostId === post.id ? 'rotate-90' : ''}`}
                                                            fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                                        </svg>
                                                        <span>{post.title}</span>
                                                    </button>
                                                </td>
                                                <td className="whitespace-nowrap px-6 py-4">{statusBadge(post.status)}</td>
                                                <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => window.location.href = route('posts.edit', post.id)}
                                                            title="Editar"
                                                            className="rounded p-1.5 text-yellow-600 hover:bg-yellow-100"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                                                        </button>
                                                        {post.status === 'generated' && (
                                                            scheduling === post.id ? (
                                                                <div className="flex items-center gap-1">
                                                                    <input
                                                                        type="datetime-local"
                                                                        value={scheduleDate}
                                                                        onChange={(e) => setScheduleDate(e.target.value)}
                                                                        className="rounded border border-gray-300 px-1 py-0.5 text-xs"
                                                                        min={new Date().toLocaleString('sv-SE', { timeZone: 'America/Bogota' }).replace(' ', 'T').slice(0, 16)}
                                                                    />
                                                                    <button
                                                                        onClick={() => handleSchedulePost(post.id)}
                                                                        title="Confirmar"
                                                                        className={`rounded p-1.5 text-white ${scheduleDate ? 'bg-purple-600 hover:bg-purple-500' : 'bg-gray-300 cursor-not-allowed'}`}
                                                                        disabled={!scheduleDate}
                                                                    >
                                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => { setScheduling(null); setScheduleDate(''); }}
                                                                        title="Cancelar"
                                                                        className="rounded p-1.5 text-gray-600 hover:bg-gray-200"
                                                                    >
                                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => {
                                                                        const now = new Date();
                                                                        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                                                                        setScheduleDate(now.toISOString().slice(0, 16));
                                                                        setScheduling(post.id);
                                                                    }}
                                                                    title="Programar"
                                                                    className="rounded p-1.5 text-purple-600 hover:bg-purple-100"
                                                                >
                                                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                                                                </button>
                                                            )
                                                        )}
                                                        <button
                                                            onClick={() => handleDeletePost(post.id)}
                                                            title="Eliminar"
                                                            className="rounded p-1.5 text-red-600 hover:bg-red-100"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedPostId === post.id && (
                                                <tr className="bg-gray-50">
                                                    <td colSpan={3} className="px-6 py-4">
                                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                            <div>
                                                                <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Contenido</h4>
                                                                {post.text_content ? (
                                                                    <p className="whitespace-pre-wrap text-sm text-gray-700">{post.text_content}</p>
                                                                ) : (
                                                                    <div className="flex items-center gap-2">
                                                                        <p className="text-sm text-gray-400">Sin contenido</p>
                                                                        <button
                                                                            onClick={() => handleGeneratePostContent(post.id)}
                                                                            disabled={generatingPostContent === post.id}
                                                                            className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-200 disabled:opacity-50"
                                                                        >
                                                                            {generatingPostContent === post.id ? 'Generando...' : 'Generar'}
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="space-y-4">
                                                                <div>
                                                                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Call to Action</h4>
                                                                    <p className="text-sm text-gray-700">{post.call_to_action || 'Sin CTA'}</p>
                                                                </div>
                                                                <div>
                                                                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Hashtags</h4>
                                                                    <p className="text-sm text-indigo-600">{post.hashtags || 'Sin hashtags'}</p>
                                                                </div>
                                                                <div>
                                                                    <h4 className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500">Imagen</h4>
                                                                    <input
                                                                        ref={el => fileInputRefs.current[post.id] = el}
                                                                        type="file"
                                                                        accept="image/jpeg,image/png,image/gif,image/webp"
                                                                        onChange={(e) => handleImageUpload(e, post.id)}
                                                                        className="hidden"
                                                                    />
                                                                    {post.image_url ? (
                                                                        <div className="relative group inline-block">
                                                                            <img
                                                                                src={post.image_url}
                                                                                alt="Post"
                                                                                className="h-24 w-24 rounded-lg border border-gray-200 object-cover"
                                                                            />
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => fileInputRefs.current[post.id]?.click()}
                                                                                className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 text-white opacity-0 transition group-hover:opacity-100"
                                                                                title="Cambiar imagen"
                                                                            >
                                                                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                                                                                </svg>
                                                                            </button>
                                                                        </div>
                                                                    ) : (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => fileInputRefs.current[post.id]?.click()}
                                                                            disabled={uploadingPostId === post.id}
                                                                            className="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500 transition hover:border-indigo-400 hover:text-indigo-600 disabled:opacity-50"
                                                                            title="Subir imagen"
                                                                        >
                                                                            {uploadingPostId === post.id ? (
                                                                                <span className="text-indigo-600">Subiendo...</span>
                                                                            ) : (
                                                                                <>
                                                                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                                                                                    </svg>
                                                                                    Subir imagen
                                                                                </>
                                                                            )}
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="p-6 text-sm text-gray-500">No hay publicaciones en este plan.</p>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}