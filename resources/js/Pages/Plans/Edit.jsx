import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function PlansEdit() {
    const { plan, flash } = usePage().props;

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

    const defaultHours = [8, 9, 10, 11, 12, 14, 15, 16, 17, 18];

    const form = useForm({
        topic_name: plan?.topic_name || '',
        industry: plan?.industry || '',
        keywords: plan?.keywords || '',
        objectives: plan?.objectives || '',
        target_audience: plan?.target_audience || '',
        month: plan?.month || '',
        year: plan?.year || currentYear,
        total_posts: plan?.total_posts || 10,
        schedule_hours: plan?.schedule_hours || defaultHours,
    });

    const toggleHour = (hour) => {
        const current = form.data.schedule_hours;
        const updated = current.includes(hour)
            ? current.filter((h) => h !== hour)
            : [...current, hour].sort((a, b) => a - b);
        form.setData('schedule_hours', updated);
    };

    const submit = (e) => {
        e.preventDefault();
        form.put(route('plans.update', plan.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Editar Plan Mensual</h2>
                    <div className="flex gap-2">
                        <Link
                            href={route('plans.show', plan.id)}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Ver Plan
                        </Link>
                        <Link
                            href={route('plans.index')}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Volver
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Editar Plan" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-800">{flash.success}</div>
                    )}

                    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
                        <form onSubmit={submit} className="p-6">
                            <h3 className="mb-4 text-lg font-medium text-gray-900">Tema del Plan</h3>

                            <div className="mb-6">
                                <InputLabel htmlFor="topic_name" value="Nombre del Tema" />
                                <TextInput
                                    id="topic_name"
                                    type="text"
                                    value={form.data.topic_name}
                                    onChange={(e) => form.setData('topic_name', e.target.value)}
                                    className="mt-1 block w-full"
                                    required
                                    placeholder="Ej: Marketing Digital 2024"
                                />
                                <InputError message={form.errors.topic_name} className="mt-2" />
                            </div>

                            <div className="mb-6">
                                <InputLabel htmlFor="industry" value="Industria" />
                                <TextInput
                                    id="industry"
                                    type="text"
                                    value={form.data.industry}
                                    onChange={(e) => form.setData('industry', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="Ej: Tecnología, Salud, Finanzas"
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
                                    rows="2"
                                    placeholder="marketing, redes sociales, contenido digital"
                                />
                                <InputError message={form.errors.keywords} className="mt-2" />
                            </div>

                            <div className="mb-6">
                                <InputLabel htmlFor="objectives" value="Objetivos" />
                                <textarea
                                    id="objectives"
                                    value={form.data.objectives}
                                    onChange={(e) => form.setData('objectives', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows="2"
                                    placeholder="Aumentar visibilidad, generar leads, educar al mercado"
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
                                    rows="2"
                                    placeholder="Profesionales de marketing, dueños de pymes, emprendedores"
                                />
                                <InputError message={form.errors.target_audience} className="mt-2" />
                            </div>

                            <hr className="my-6 border-gray-200" />

                            <h3 className="mb-4 text-lg font-medium text-gray-900">Período y Configuración</h3>

                            <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
                                <div>
                                    <InputLabel htmlFor="month" value="Mes" />
                                    <select
                                        id="month"
                                        value={form.data.month}
                                        onChange={(e) => form.setData('month', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    >
                                        <option value="">Seleccionar mes...</option>
                                        {months.map((m) => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </select>
                                    <InputError message={form.errors.month} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="year" value="Año" />
                                    <select
                                        id="year"
                                        value={form.data.year}
                                        onChange={(e) => form.setData('year', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    >
                                        {years.map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                    <InputError message={form.errors.year} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="total_posts" value="Total de Posts" />
                                    <TextInput
                                        id="total_posts"
                                        type="number"
                                        value={form.data.total_posts}
                                        onChange={(e) => form.setData('total_posts', e.target.value)}
                                        className="mt-1 block w-full"
                                        min="1"
                                        max="31"
                                        required
                                    />
                                    <InputError message={form.errors.total_posts} className="mt-2" />
                                </div>
                            </div>

                            <hr className="my-6 border-gray-200" />

                            <h3 className="mb-4 text-lg font-medium text-gray-900">Horarios de Publicación</h3>

                            <p className="mb-3 text-sm text-gray-600">
                                Selecciona las horas en las que tu audiencia está más activa en LinkedIn.
                            </p>

                            <div className="mb-6 grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-12">
                                {Array.from({ length: 24 }, (_, i) => {
                                    const selected = form.data.schedule_hours.includes(i);
                                    return (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => toggleHour(i)}
                                            className={`rounded-md border px-2 py-1.5 text-xs font-medium transition ${
                                                selected
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                    : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                                            }`}
                                        >
                                            {i.toString().padStart(2, '0') + ':00'}
                                        </button>
                                    );
                                })}
                            </div>
                            {form.data.schedule_hours.length === 0 && (
                                <p className="mb-4 text-sm text-red-500">Selecciona al menos un horario.</p>
                            )}

                            <div className="flex items-center justify-end">
                                <PrimaryButton disabled={form.processing || form.data.schedule_hours.length === 0}>
                                    Actualizar Plan
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
