import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';

export default function PlansIndex() {
    const { plans, filters } = usePage().props;
    const flash = usePage().props.flash;

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    const months = [
        { value: 1, label: 'Enero' },
        { value: 2, label: 'Febrero' },
        { value: 3, label: 'Marzo' },
        { value: 4, label: 'Abril' },
        { value: 5, label: 'Mayo' },
        { value: 6, label: 'Junio' },
        { value: 7, label: 'Julio' },
        { value: 8, label: 'Agosto' },
        { value: 9, label: 'Septiembre' },
        { value: 10, label: 'Octubre' },
        { value: 11, label: 'Noviembre' },
        { value: 12, label: 'Diciembre' },
    ];

    const statusBadge = (status) => {
        const styles = {
            active: 'bg-green-100 text-green-800',
            completed: 'bg-blue-100 text-blue-800',
            paused: 'bg-yellow-100 text-yellow-800',
            cancelled: 'bg-red-100 text-red-800',
        };
        const labels = {
            active: 'Activo',
            completed: 'Completado',
            paused: 'Pausado',
            cancelled: 'Cancelado',
        };
        return (
            <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
                {labels[status] || status}
            </span>
        );
    };

    const handleFilterChange = (field, value) => {
        router.get(route('plans.index'), { ...filters, [field]: value }, { preserveState: true, replace: true });
    };

    const handleDelete = (plan) => {
        if (confirm(`¿Eliminar el plan "${plan.topic_name}" de ${plan.month}/${plan.year}?`)) {
            router.delete(route('plans.destroy', plan.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Planes Mensuales</h2>
                    <Link
                        href={route('plans.create')}
                        className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        + Crear Plan
                    </Link>
                </div>
            }
        >
            <Head title="Planes Mensuales" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-800">{flash.success}</div>
                    )}

                    {/* Filters */}
                    <div className="mb-6 flex flex-wrap gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Año</label>
                            <select
                                value={filters?.year || ''}
                                onChange={(e) => handleFilterChange('year', e.target.value)}
                                className="mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">Todos</option>
                                {years.map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Mes</label>
                            <select
                                value={filters?.month || ''}
                                onChange={(e) => handleFilterChange('month', e.target.value)}
                                className="mt-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                <option value="">Todos</option>
                                {months.map((m) => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Plans Table */}
                    <div className="overflow-hidden rounded-lg bg-white shadow">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tema</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Período</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Posts</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Estado</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {plans?.length > 0 ? (
                                    plans.map((plan) => (
                                        <tr key={plan.id} className="hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-6 py-4">
                                                <Link href={route('plans.show', plan.id)} className="text-sm font-medium text-indigo-600 hover:text-indigo-900">
                                                    {plan.topic_name}
                                                </Link>
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                                                {months.find((m) => m.value === plan.month)?.label} {plan.year}
                                            </td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">{plan.total_posts}</td>
                                            <td className="whitespace-nowrap px-6 py-4">{statusBadge(plan.status)}</td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                <Link
                                                    href={route('plans.show', plan.id)}
                                                    className="mr-2 text-indigo-600 hover:text-indigo-900"
                                                >
                                                    Ver
                                                </Link>
                                                <Link
                                                    href={route('plans.edit', plan.id)}
                                                    className="mr-2 text-yellow-600 hover:text-yellow-900"
                                                >
                                                    Editar
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(plan)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-sm text-gray-500">
                                            No hay planes registrados.
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
