import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function PlansShow() {
    const { plan, posts, flash } = usePage().props;
    const [scheduling, setScheduling] = useState(null);
    const [scheduleDate, setScheduleDate] = useState('');
    const [expandedPostId, setExpandedPostId] = useState(null);
    const [flashState, setFlashState] = useState(flash?.success || flash?.error ? flash : null);

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
                                                <div className="mb-4">
                                                    <h4 className="mb-1 text-xs font-semibold uppercase text-gray-500">Contenido</h4>
                                                    <p className="whitespace-pre-wrap text-sm text-gray-700">
                                                        {post.text_content || 'Sin contenido generado'}
                                                    </p>
                                                </div>

                                                {post.hashtags && (
                                                    <div className="mb-4">
                                                        <h4 className="mb-1 text-xs font-semibold uppercase text-gray-500">Hashtags</h4>
                                                        <p className="text-sm text-indigo-600">{post.hashtags}</p>
                                                    </div>
                                                )}

                                                {post.call_to_action && (
                                                    <div className="mb-4">
                                                        <h4 className="mb-1 text-xs font-semibold uppercase text-gray-500">Call to Action</h4>
                                                        <p className="text-sm text-gray-700">{post.call_to_action}</p>
                                                    </div>
                                                )}

                                                {post.image_url && (
                                                    <div className="mb-4">
                                                        <img src={post.image_url} alt={post.title} className="max-h-48 rounded object-contain" />
                                                    </div>
                                                )}

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
        </AuthenticatedLayout>
    );
}