import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function PlansShow() {
    const { plan, posts, flash } = usePage().props;
    const [scheduling, setScheduling] = useState(null);
    const [scheduleDate, setScheduleDate] = useState('');

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];

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

    const handleDeletePost = (postId) => {
        if (confirm('¿Eliminar esta publicación?')) {
            router.delete(route('posts.destroy', postId));
        }
    };

    const handleGenerateAll = () => {
        if (confirm('¿Generar contenido para todos los posts pendientes?')) {
            router.post(route('plans.generate-posts', plan.id));
        }
    };

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
                        <button
                            onClick={handleGenerateAll}
                            className="inline-flex items-center rounded-md bg-green-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                            Generar Todo
                        </button>
                        <Link
                            href={route('plans.edit', plan.id)}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
                    {flash?.error && (
                        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">{flash.error}</div>
                    )}

                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <h3 className="text-lg font-medium text-gray-900">Publicaciones</h3>
                        </div>
                        {posts?.length > 0 ? (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 w-full">Título</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fecha y Hora</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 whitespace-nowrap">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {posts.map((post) => (
                                        <tr key={post.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{post.title}</td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                {post.scheduled_post?.scheduled_date
                                                    ? new Date(post.scheduled_post.scheduled_date).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })
                                                    : <span className="text-gray-400 italic">Sin programar</span>
                                                }
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">{statusBadge(post.status)}</td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                <div className="flex items-center gap-1">
                                                    {post.status === 'pending' && (
                                                        <button
                                                            onClick={() => router.post(route('ai.generate-content', post.id))}
                                                            title="Generar contenido"
                                                            className="rounded p-1.5 text-green-600 hover:bg-green-100"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" /></svg>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => router.get(route('posts.edit', post.id))}
                                                        title="Editar"
                                                        className="rounded p-1.5 text-yellow-600 hover:bg-yellow-100"
                                                    >
                                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                                                    </button>
                                                    {post.status === 'generated' && (
                                                        <button
                                                            onClick={() => router.post(route('posts.upload-image', post.id))}
                                                            title="Subir imagen"
                                                            className="rounded p-1.5 text-blue-600 hover:bg-blue-100"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21ZM8.25 8.625a1.125 1.125 0 1 0 0-2.25 1.125 1.125 0 0 0 0 2.25Z" /></svg>
                                                        </button>
                                                    )}
                                                    {post.status === 'generated' && (
                                                        scheduling === post.id ? (
                                                            <div className="flex items-center gap-1">
                                                                <input
                                                                    type="datetime-local"
                                                                    value={scheduleDate}
                                                                    onChange={(e) => setScheduleDate(e.target.value)}
                                                                    className="rounded border border-gray-300 px-1 py-0.5 text-xs"
                                                                    min={new Date().toISOString().slice(0, 16)}
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        if (scheduleDate) {
                                                                            router.post(route('publisher.schedule', post.id), { scheduled_date: scheduleDate });
                                                                            setScheduling(null);
                                                                            setScheduleDate('');
                                                                        }
                                                                    }}
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
                                                    {(post.status === 'generated' || post.status === 'scheduled') && (
                                                        <button
                                                            onClick={() => router.post(route('publisher.publish-now', post.id))}
                                                            title="Publicar ahora"
                                                            className="rounded p-1.5 text-indigo-600 hover:bg-indigo-100"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
                                                        </button>
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
