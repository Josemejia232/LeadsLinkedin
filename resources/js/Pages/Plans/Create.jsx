import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function PlansCreate() {
    const { months, years } = usePage().props;
    const { data, setData, post, processing, errors } = useForm({
        topic_name: '',
        industry: '',
        keywords: '',
        objectives: '',
        target_audience: '',
        month: '',
        year: new Date().getFullYear(),
        total_posts: 10,
        schedule_hours: [8, 9, 10, 11, 12, 14, 15, 16, 17, 18],
    });

    const toggleHour = (hour) => {
        const current = data.schedule_hours;
        const updated = current.includes(hour)
            ? current.filter((h) => h !== hour)
            : [...current, hour].sort((a, b) => a - b);
        setData('schedule_hours', updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (data.schedule_hours.length === 0) return;
        post(route('plans.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Crear Plan Mensual</h2>
                    <Link
                        href={route('plans.index')}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >
                        Volver
                    </Link>
                </div>
            }
        >
            <Head title="Crear Plan" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    {errors.submit && (
                        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">{errors.submit}</div>
                    )}

                    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
                        <form onSubmit={handleSubmit} className="p-6">
                            <h3 className="mb-4 text-lg font-medium text-gray-900">Tema del Plan</h3>

                            <div className="mb-6">
                                <InputLabel htmlFor="topic_name" value="Nombre del Tema" />
                                <TextInput
                                    id="topic_name"
                                    type="text"
                                    value={data.topic_name}
                                    onChange={(e) => setData('topic_name', e.target.value)}
                                    className="mt-1 block w-full"
                                    required
                                    placeholder="Ej: Marketing Digital 2024"
                                />
                                <InputError message={errors.topic_name} className="mt-2" />
                            </div>

                            <div className="mb-6">
                                <InputLabel htmlFor="industry" value="Industria" />
                                <TextInput
                                    id="industry"
                                    type="text"
                                    value={data.industry}
                                    onChange={(e) => setData('industry', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="Ej: Tecnología, Salud, Finanzas"
                                />
                                <InputError message={errors.industry} className="mt-2" />
                            </div>

                            <div className="mb-6">
                                <InputLabel htmlFor="keywords" value="Palabras Clave" />
                                <textarea
                                    id="keywords"
                                    value={data.keywords}
                                    onChange={(e) => setData('keywords', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows="2"
                                    placeholder="marketing, redes sociales, contenido digital"
                                />
                                <p className="mt-1 text-xs text-gray-500">Separa las palabras clave por comas.</p>
                                <InputError message={errors.keywords} className="mt-2" />
                            </div>

                            <div className="mb-6">
                                <InputLabel htmlFor="objectives" value="Objetivos" />
                                <textarea
                                    id="objectives"
                                    value={data.objectives}
                                    onChange={(e) => setData('objectives', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows="2"
                                    placeholder="Aumentar visibilidad, generar leads, educar al mercado"
                                />
                                <InputError message={errors.objectives} className="mt-2" />
                            </div>

                            <div className="mb-6">
                                <InputLabel htmlFor="target_audience" value="Audiencia Objetivo" />
                                <textarea
                                    id="target_audience"
                                    value={data.target_audience}
                                    onChange={(e) => setData('target_audience', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows="2"
                                    placeholder="Profesionales de marketing, dueños de pymes, emprendedores"
                                />
                                <InputError message={errors.target_audience} className="mt-2" />
                            </div>

                            <hr className="my-6 border-gray-200" />

                            <h3 className="mb-4 text-lg font-medium text-gray-900">Período y Configuración</h3>

                            <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
                                <div>
                                    <InputLabel htmlFor="month" value="Mes" />
                                    <select
                                        id="month"
                                        value={data.month}
                                        onChange={(e) => setData('month', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    >
                                        <option value="">Seleccionar mes...</option>
                                        {months && Object.entries(months).map(([val, label]) => (
                                            <option key={val} value={val}>{label}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.month} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="year" value="Año" />
                                    <select
                                        id="year"
                                        value={data.year}
                                        onChange={(e) => setData('year', e.target.value)}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    >
                                        {years?.map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.year} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="total_posts" value="Total de Posts" />
                                    <TextInput
                                        id="total_posts"
                                        type="number"
                                        value={data.total_posts}
                                        onChange={(e) => setData('total_posts', e.target.value)}
                                        className="mt-1 block w-full"
                                        min="1"
                                        max="31"
                                        required
                                    />
                                    <InputError message={errors.total_posts} className="mt-2" />
                                </div>
                            </div>

                            <hr className="my-6 border-gray-200" />

                            <h3 className="mb-4 text-lg font-medium text-gray-900">Horarios de Publicación</h3>

                            <p className="mb-3 text-sm text-gray-600">
                                Selecciona las horas en las que tu audiencia está más activa en LinkedIn.
                            </p>

                            <div className="mb-6 grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-12">
                                {Array.from({ length: 24 }, (_, i) => {
                                    const selected = data.schedule_hours.includes(i);
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
                            {data.schedule_hours.length === 0 && (
                                <p className="mb-4 text-sm text-red-500">Selecciona al menos un horario.</p>
                            )}

                            <div className="flex items-center justify-end">
                                <PrimaryButton disabled={processing || data.schedule_hours.length === 0}>
                                    {processing ? 'Creando...' : 'Crear Plan'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}