import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { insforge } from '@/lib/insforge';

export default function PlansShow({ planId }) {
    const [plan, setPlan] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [flash, setFlash] = useState(null);
    const [scheduling, setScheduling] = useState(null);
    const [scheduleDate, setScheduleDate] = useState('');

    const months = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];

    useEffect(() => {
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

        fetchData();
    }, [planId]);

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
                const { error } = await insforge.database
                    .from('scheduled_posts')
                    .upsert([{
                        day_post_id: postId,
                        scheduled_date: new Date(scheduleDate).toISOString(),
                        status: 'scheduled',
                    }]);

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
                                        <tr key={post.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{post.title}</td>
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
                                                                    min={new Date().toISOString().slice(0, 16)}
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