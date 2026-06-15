import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { insforge } from '@/lib/insforge';

export default function Dashboard() {
    const [stats, setStats] = useState({
        total_plans: 0,
        total_posts: 0,
        pending_posts: 0,
        generated_posts: 0,
        scheduled_posts: 0,
        total_contacts: 0,
    });
    const [geminiConfigured, setGeminiConfigured] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const [plansRes, postsRes, contactsRes, configRes] = await Promise.all([
                    insforge.database.from('monthly_plans').select('id', { count: 'exact', head: true }),
                    insforge.database.from('day_posts').select('id, status'),
                    insforge.database.from('contacts').select('id', { count: 'exact', head: true }),
                    insforge.database.from('app_configs').select('*').eq('key', 'GEMINI_API_KEY'),
                ]);

                const totalPosts = postsRes.data?.length || 0;
                const pendingPosts = postsRes.data?.filter(p => p.status === 'pending').length || 0;
                const generatedPosts = postsRes.data?.filter(p => p.status === 'generated').length || 0;
                const scheduledPosts = postsRes.data?.filter(p => p.status === 'scheduled').length || 0;

                setStats({
                    total_plans: plansRes.count || 0,
                    total_posts: totalPosts,
                    pending_posts: pendingPosts,
                    generated_posts: generatedPosts,
                    scheduled_posts: scheduledPosts,
                    total_contacts: contactsRes.count || 0,
                });

                setGeminiConfigured(configRes.data?.length > 0);
            } catch (err) {
                console.error('Error fetching stats:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    const statCards = [
        { label: 'Total Planes', value: stats.total_plans, color: 'bg-indigo-600' },
        { label: 'Total Posts', value: stats.total_posts, color: 'bg-blue-600' },
        { label: 'Pendientes', value: stats.pending_posts, color: 'bg-yellow-500' },
        { label: 'Generados', value: stats.generated_posts, color: 'bg-green-600' },
        { label: 'Programados', value: stats.scheduled_posts, color: 'bg-purple-600' },
        { label: 'Total Contactos', value: stats.total_contacts, color: 'bg-pink-600' },
    ];

    if (loading) {
        return (
            <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Dashboard</h2>}>
                <div className="py-12">
                    <div className="mx-auto max-w-7xl px-4 text-center text-gray-500">Cargando dashboard...</div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Dashboard</h2>}
        >
            <Head title="Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {statCards.map((card) => (
                            <div key={card.label} className="overflow-hidden rounded-lg bg-white shadow">
                                <div className="p-5">
                                    <div className="flex items-center">
                                        <div className={`flex-shrink-0 rounded-md ${card.color} p-3`}>
                                            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                                            </svg>
                                        </div>
                                        <div className="ml-5 w-0 flex-1">
                                            <dl>
                                                <dt className="truncate text-sm font-medium text-gray-500">{card.label}</dt>
                                                <dd className="text-3xl font-semibold text-gray-900">{card.value}</dd>
                                            </dl>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mb-6 flex items-center justify-end">
                        <span className="mr-2 text-sm text-gray-600">Gemini:</span>
                        {geminiConfigured ? (
                            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                                <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500"></span>
                                Conectado
                            </span>
                        ) : (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                                <span className="mr-1.5 h-2 w-2 rounded-full bg-red-500"></span>
                                Desconectado
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}