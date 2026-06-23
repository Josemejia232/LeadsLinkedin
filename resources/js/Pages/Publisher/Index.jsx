import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';

export default function PublisherIndex() {
    const { scheduled_posts, calendar, months, month, year, flash } = usePage().props;
    const [editingId, setEditingId] = useState(null);
    const [editDate, setEditDate] = useState('');

    const handlePrevMonth = () => {
        const m = month === 1 ? 12 : month - 1;
        const y = month === 1 ? year - 1 : year;
        router.get(route('publisher.scheduled', { month: m, year: y }));
    };

    const handleNextMonth = () => {
        const m = month === 12 ? 1 : month + 1;
        const y = month === 12 ? year + 1 : year;
        router.get(route('publisher.scheduled', { month: m, year: y }));
    };

    const startEdit = (post) => {
        const d = new Date(post.scheduled_date);
        const pad = (n) => String(n).padStart(2, '0');
        setEditDate(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`);
        setEditingId(post.id);
    };

    const saveEdit = (post) => {
        if (!editDate) return;
        const dayPostId = post.day_post?.id || post.day_posts?.id;
        if (!dayPostId) return;
        router.post(route('posts.schedule', dayPostId), {
            scheduled_date: new Date(editDate).toISOString(),
        }, {
            preserveScroll: true,
            onSuccess: () => setEditingId(null),
        });
    };

    const statusBadge = (status) => {
        const styles = {
            scheduled: 'bg-purple-100 text-purple-800',
            published: 'bg-green-100 text-green-800',
            failed: 'bg-red-100 text-red-800',
            pending: 'bg-yellow-100 text-yellow-800',
        };
        const labels = {
            scheduled: 'Programado',
            published: 'Publicado',
            failed: 'Fallido',
            pending: 'Pendiente',
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
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Publicaciones Programadas
                </h2>
            }
        >
            <Head title="Publicaciones" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-800">{flash.success}</div>
                    )}
                    {flash?.error && (
                        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">{flash.error}</div>
                    )}

                    {/* Calendar */}
                    <div className="mb-8 overflow-hidden rounded-lg bg-white shadow">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <button onClick={handlePrevMonth} className="rounded p-1 text-gray-500 hover:bg-gray-100">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                                    </button>
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Calendario — {months?.[month]} {year}
                                    </h3>
                                    <button onClick={handleNextMonth} className="rounded p-1 text-gray-500 hover:bg-gray-100">
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={month}
                                        onChange={(e) => router.get(route('publisher.scheduled', { month: Number(e.target.value), year }))}
                                        className="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        {months && Object.entries(months).map(([key, name]) => (
                                            <option key={key} value={key}>{name}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={year}
                                        onChange={(e) => router.get(route('publisher.scheduled', { month, year: Number(e.target.value) }))}
                                        className="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        {[year - 1, year, year + 1].map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-7 gap-1 text-center text-sm">
                                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                                    <div key={d} className="py-2 text-xs font-semibold text-gray-500">{d}</div>
                                ))}
                                {calendar?.flatMap((week) => week)?.map((day, idx) => (
                                    day.posts?.length > 0 ? (
                                        <Link
                                            key={idx}
                                            href={route('plans.show', day.posts[0].plan_id)}
                                            className={`min-h-[80px] cursor-pointer rounded-lg border p-1 transition hover:ring-2 hover:ring-indigo-400 ${
                                                day.is_current_month
                                                    ? 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100'
                                                    : 'border-transparent'
                                            }`}
                                        >
                                            {day.is_current_month && (
                                                <>
                                                    <span className="text-xs font-medium text-indigo-700">{day.day}</span>
                                                    {day.posts.slice(0, 3).map((p, pi) => (
                                                        <div key={pi} className="mt-1 truncate rounded bg-white px-1 text-xs text-gray-600 shadow-sm" title={p.title}>
                                                            {p.title}
                                                        </div>
                                                    ))}
                                                    {day.posts.length > 3 && (
                                                        <div className="mt-0.5 text-xs text-indigo-500">+{day.posts.length - 3} más</div>
                                                    )}
                                                </>
                                            )}
                                        </Link>
                                    ) : (
                                        <div key={idx} className={`min-h-[80px] rounded-lg border p-1 ${!day.is_current_month ? 'border-transparent' : 'border-gray-200'}`}>
                                            {day.is_current_month && <span className="text-xs font-medium text-gray-700">{day.day}</span>}
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Scheduled Posts Table */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Título</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fecha Programada</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {scheduled_posts?.length > 0 ? (
                                    scheduled_posts.map((post) => (
                                        <tr key={post.id} className="hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                {post.day_post?.title || post.day_posts?.title || '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                {editingId === post.id ? (
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="datetime-local"
                                                            value={editDate}
                                                            onChange={(e) => setEditDate(e.target.value)}
                                                            className="rounded border border-gray-300 px-2 py-1 text-xs"
                                                        />
                                                        <button
                                                            onClick={() => saveEdit(post)}
                                                            className="rounded bg-indigo-600 px-2 py-1 text-xs font-medium text-white hover:bg-indigo-500"
                                                        >
                                                            Guardar
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingId(null)}
                                                            className="rounded border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span>{post.scheduled_date
                                                        ? new Date(post.scheduled_date).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Bogota' })
                                                        : '—'}</span>
                                                )}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">{statusBadge(post.status)}</td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                {editingId !== post.id && (
                                                    <button
                                                        onClick={() => startEdit(post)}
                                                        className="rounded border border-gray-300 px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                                                    >
                                                        Editar Fecha
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-10 text-center text-sm text-gray-500">
                                            No hay publicaciones programadas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}