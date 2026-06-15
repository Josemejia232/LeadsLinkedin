import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function TopicsEdit() {
    const { topic, flash } = usePage().props;

    const form = useForm({
        name: topic?.name || '',
        industry: topic?.industry || '',
        keywords: topic?.keywords || '',
        objectives: topic?.objectives || '',
        target_audience: topic?.target_audience || '',
    });

    const submit = (e) => {
        e.preventDefault();
        form.put(route('topics.update', topic.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Editar Tema</h2>
                    <Link
                        href={route('topics.index')}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Volver
                    </Link>
                </div>
            }
        >
            <Head title="Editar Tema" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-800">{flash.success}</div>
                    )}

                    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
                        <form onSubmit={submit} className="p-6">
                            <div className="mb-6">
                                <InputLabel htmlFor="name" value="Nombre del Tema" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    className="mt-1 block w-full"
                                    required
                                />
                                <InputError message={form.errors.name} className="mt-2" />
                            </div>

                            <div className="mb-6">
                                <InputLabel htmlFor="industry" value="Industria" />
                                <TextInput
                                    id="industry"
                                    type="text"
                                    value={form.data.industry}
                                    onChange={(e) => form.setData('industry', e.target.value)}
                                    className="mt-1 block w-full"
                                    required
                                />
                                <InputError message={form.errors.industry} className="mt-2" />
                            </div>

                            <div className="mb-6">
                                <InputLabel htmlFor="keywords" value="Palabras Clave" />
                                <textarea
                                    id="keywords"
                                    value={form.data.keywords}
                                    onChange={(e) => form.setData('keywords', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows="3"
                                />
                                <p className="mt-1 text-xs text-gray-500">Separa las palabras clave por comas.</p>
                                <InputError message={form.errors.keywords} className="mt-2" />
                            </div>

                            <div className="mb-6">
                                <InputLabel htmlFor="objectives" value="Objetivos" />
                                <textarea
                                    id="objectives"
                                    value={form.data.objectives}
                                    onChange={(e) => form.setData('objectives', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows="3"
                                />
                                <InputError message={form.errors.objectives} className="mt-2" />
                            </div>

                            <div className="mb-6">
                                <InputLabel htmlFor="target_audience" value="Audiencia Objetivo" />
                                <textarea
                                    id="target_audience"
                                    value={form.data.target_audience}
                                    onChange={(e) => form.setData('target_audience', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows="3"
                                />
                                <InputError message={form.errors.target_audience} className="mt-2" />
                            </div>

                            <div className="flex items-center justify-end">
                                <PrimaryButton disabled={form.processing}>
                                    Actualizar Tema
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
