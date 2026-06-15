import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { insforge } from '@/lib/insforge';

export default function PublisherIndex() {
    const [scheduledPosts, setScheduledPosts] = useState([]);
    const [calendar, setCalendar] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [flash, setFlash] = useState(null);

    const now = new Date();
    const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
    const [filterYear, setFilterYear] = useState(now.getFullYear());

    const months = {
        1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
        5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
        9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
    };

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);

                const startDate = `${filterYear}-${String(filterMonth).padStart(2, '0')}-01`;
                const endDate = new Date(filterYear, filterMonth, 0).toISOString().split('T')[0];

                const { data: postsData, error: postsError } = await insforge.database
                    .from('scheduled_posts')
                    .select('*, day_posts(*)')
                    .gte('scheduled_date', startDate)
                    .lte('scheduled_date', endDate + 'T23:59:59')
                    .order('scheduled_date', { ascending: true });

                if (postsError) {
                    setError(postsError.message);
                } else {
                    setScheduledPosts(postsData || []);
                }

                const { data: allPosts } = await insforge.database
                    .from('day_posts')
                    .select('*')
                    .gte('date', startDate)
                    .lte('date', endDate);

                buildCalendar(allPosts || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [filterMonth, filterYear]);

    const buildCalendar = (posts) => {
        const firstDay = new Date(filterYear, filterMonth - 1, 1);
        const lastDay = new Date(filterYear, filterMonth, 0);
        const startOffset = (firstDay.getDay() + 6) % 7;

        const days = [];
        const postsByDate = {};
        posts.forEach(p => {
            const dateKey = new Date(p.date).toISOString().split('T')[0];
            postsByDate[dateKey] = p;
        });

        for (let i = 0; i < startOffset; i++) {
            const d = new Date(filterYear, filterMonth - 1, -startOffset + i + 1);
            days.push({ day: d.getDate(), is_current_month: false, post: null });
        }

        for (let d = 1; d <= lastDay.getDate(); d++) {
            const dateKey = `${filterYear}-${String(filterMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({ day: d, is_current_month: true, post: postsByDate[dateKey] || null });
        }

        const remaining = 42 - days.length;
        for (let i = 1; i <= remaining; i++) {
            const d = new Date(filterYear, filterMonth, i);
            days.push({ day: d.getDate(), is_current_month: false, post: null });
        }

        const weeks = [];
        for (let i = 0; i < days.length; i += 7) {
            weeks.push(days.slice(i, i + 7));
        }
        setCalendar(weeks);
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

    const handlePrevMonth = () => {
        const m = filterMonth === 1 ? 12 : filterMonth - 1;
        const y = filterMonth === 1 ? filterYear - 1 : filterYear;
        setFilterMonth(m);
        setFilterYear(y);
    };

    const handleNextMonth = () => {
        const m = filterMonth === 12 ? 1 : filterMonth + 1;
        const y = filterMonth === 12 ? filterYear + 1 : filterYear;
        setFilterMonth(m);
        setFilterYear(y);
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
                    {error && (
                        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>
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
                                        Calendario — {months[filterMonth]} {filterYear}
                                    </h3>
                                    <button onClick={handleNextMonth} className="rounded p-1 text-gray-500 hover:bg-gray-100">
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
                                        {[filterYear - 1, filterYear, filterYear + 1].map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            {loading ? (
                                <div className="text-center text-gray-500">Cargando calendario...</div>
                            ) : (
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
                                                        <div className="mt-1 truncate rounded bg-white px-1 text-xs text-gray-600 shadow-sm" title={day.post.title}>
                                                            {day.post.title}
                                                        </div>
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
                            )}
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
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {scheduledPosts.length > 0 ? (
                                    scheduledPosts.map((post) => (
                                        <tr key={post.id} className="hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                {post.day_posts?.title || '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                {post.scheduled_date
                                                    ? new Date(post.scheduled_date).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })
                                                    : '—'}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4">{statusBadge(post.status)}</td>
                                            <td className="max-w-xs truncate px-6 py-4 text-sm text-red-600" title={post.error_message || ''}>
                                                {post.error_message || '—'}
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