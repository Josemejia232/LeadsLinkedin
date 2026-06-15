import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function PublisherIndex() {
    const { scheduled_posts: scheduledPosts, calendar, monthName, month, year, months, flash } = usePage().props;
    const [filterMonth, setFilterMonth] = useState(month);
    const [filterYear, setFilterYear] = useState(year);

    const handleFilter = () => {
        router.get(route('publisher.scheduled'), { month: filterMonth, year: filterYear }, { preserveState: true });
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

    const handlePublishNow = (postId) => {
        if (confirm('¿Publicar este post ahora en LinkedIn?')) {
            router.post(route('posts.publish', postId));
        }
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
                                    <button
                                        onClick={() => {
                                            const m = filterMonth === 1 ? 12 : filterMonth - 1;
                                            const y = filterMonth === 1 ? filterYear - 1 : filterYear;
                                            setFilterMonth(m);
                                            setFilterYear(y);
                                            router.get(route('publisher.scheduled'), { month: m, year: y }, { preserveState: true });
                                        }}
                                        className="rounded p-1 text-gray-500 hover:bg-gray-100"
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                                    </button>
                                    <h3 className="text-lg font-medium text-gray-900">
                                        Calendario — {monthName} {year}
                                    </h3>
                                    <button
                                        onClick={() => {
                                            const m = filterMonth === 12 ? 1 : filterMonth + 1;
                                            const y = filterMonth === 12 ? filterYear + 1 : filterYear;
                                            setFilterMonth(m);
                                            setFilterYear(y);
                                            router.get(route('publisher.scheduled'), { month: m, year: y }, { preserveState: true });
                                        }}
                                        className="rounded p-1 text-gray-500 hover:bg-gray-100"
                                    >
                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <select
                                        value={filterMonth}
                                        onChange={(e) => setFilterMonth(Number(e.target.value))}
                                        className="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        {Object.entries(months).map(([key, name]) => (
                                            <option key={key} value={key}>{name}</option>
                                        ))}
                                    </select>
                                    <select
                                        value={filterYear}
                                        onChange={(e) => setFilterYear(Number(e.target.value))}
                                        className="rounded-md border-gray-300 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        {[year - 1, year, year + 1].map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={handleFilter}
                                        className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
                                    >
                                        Filtrar
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-7 gap-1 text-center text-sm">
                                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
                                    <div key={d} className="py-2 text-xs font-semibold text-gray-500">{d}</div>
                                ))}
                                {calendar?.flatMap((week) => week)?.map((day, idx) => (
                                    day.post ? (
                                        <Link
                                            key={idx}
                                            href={route('plans.show', day.post.plan_id)}
                                            className={`min-h-[80px] rounded-lg border p-1 cursor-pointer transition hover:ring-2 hover:ring-indigo-400 ${
                                                day.is_current_month
                                                    ? 'border-indigo-200 bg-indigo-50 hover:bg-indigo-100'
                                                    : 'border-transparent'
                                            }`}
                                        >
                                            {day.is_current_month && (
                                                <>
                                                    <span className="text-xs font-medium text-indigo-700">{day.day}</span>
                                                    <div
                                                        className="mt-1 truncate rounded bg-white px-1 text-xs text-gray-600 shadow-sm"
                                                        title={day.post.title}
                                                    >
                                                        {day.post.title}
                                                    </div>
                                                </>
                                            )}
                                        </Link>
                                    ) : (
                                        <div
                                            key={idx}
                                            className={`min-h-[80px] rounded-lg border p-1 ${
                                                !day.is_current_month ? 'border-transparent' : 'border-gray-200'
                                            }`}
                                        >
                                            {day.is_current_month && (
                                                <span className="text-xs font-medium text-gray-700">{day.day}</span>
                                            )}
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
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Error</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {scheduledPosts?.length > 0 ? (
                                    scheduledPosts.map((post) => (
                                        <tr key={post.id} className="hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                {post.day_post?.title || '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                {post.scheduled_date
                                                    ? new Date(post.scheduled_date).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })
                                                    : '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">
                                                {statusBadge(post.status)}
                                            </td>
                                            <td className="max-w-xs truncate px-6 py-4 text-sm text-red-600" title={post.error_message || ''}>
                                                {post.error_message || '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                <div className="flex items-center gap-1">
                                                    {post.status === 'scheduled' && (
                                                        <button
                                                            onClick={() => handlePublishNow(post.id)}
                                                            title="Publicar ahora"
                                                            className="rounded p-1.5 text-indigo-600 hover:bg-indigo-100"
                                                        >
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" /></svg>
                                                        </button>
                                                    )}
                                                    {post.status === 'failed' && (
                                                        <span title={post.error_message} className="cursor-help rounded p-1.5 text-red-500">
                                                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-sm text-gray-500">
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
