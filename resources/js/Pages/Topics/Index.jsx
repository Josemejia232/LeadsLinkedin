import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';

export default function TopicsIndex() {
    const { topics, flash } = usePage().props;

    const handleDelete = (topic) => {
        if (confirm(`¿Eliminar el tema "${topic.name}"?`)) {
            router.delete(route('topics.destroy', topic.id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Temas</h2>
                    <Link
                        href={route('topics.create')}
                        className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        + Crear Tema
                    </Link>
                </div>
            }
        >
            <Head title="Temas" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-800">{flash.success}</div>
                    )}

                    {topics?.length > 0 ? (
                        <div className="overflow-hidden rounded-lg bg-white shadow">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nombre</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Industria</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Keywords</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {topics.map((topic) => (
                                        <tr key={topic.id} className="hover:bg-gray-50">
                                            <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{topic.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{topic.industry || '—'}</td>
                                            <td className="max-w-xs truncate px-6 py-4 text-sm text-gray-600">{topic.keywords || '—'}</td>
                                            <td className="whitespace-nowrap px-6 py-4 text-sm">
                                                <Link
                                                    href={route('topics.edit', topic.id)}
                                                    className="mr-3 text-indigo-600 hover:text-indigo-900"
                                                >
                                                    Editar
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(topic)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Eliminar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="rounded-lg bg-white p-12 text-center shadow">
                            <p className="text-gray-500">No hay temas registrados.</p>
                            <Link
                                href={route('topics.create')}
                                className="mt-4 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-900"
                            >
                                Crear el primer tema
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
