import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { insforge } from '@/lib/insforge';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function PlansEdit({ planId }) {
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [flash, setFlash] = useState(null);
    const [formData, setFormData] = useState({
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
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

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

    useEffect(() => {
        async function fetchPlan() {
            try {
                const { data, error: fetchError } = await insforge.database
                    .from('monthly_plans')
                    .select('*')
                    .eq('id', planId)
                    .single();

                if (fetchError) {
                    setError(fetchError.message);
                } else {
                    setPlan(data);
                    setFormData({
                        topic_name: data.topic_name || '',
                        industry: data.industry || '',
                        keywords: data.keywords || '',
                        objectives: data.objectives || '',
                        target_audience: data.target_audience || '',
                        month: data.month || '',
                        year: data.year || currentYear,
                        total_posts: data.total_posts || 10,
                        schedule_hours: data.schedule_hours || [8, 9, 10, 11, 12, 14, 15, 16, 17, 18],
                    });
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchPlan();
    }, [planId]);

    const toggleHour = (hour) => {
        const current = formData.schedule_hours;
        const updated = current.includes(hour)
            ? current.filter((h) => h !== hour)
            : [...current, hour].sort((a, b) => a - b);
        setFormData(prev => ({ ...prev, schedule_hours: updated }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const { error: updateError } = await insforge.database
                .from('monthly_plans')
                .update({
                    topic_name: formData.topic_name,
                    industry: formData.industry || null,
                    keywords: formData.keywords || null,
                    objectives: formData.objectives || null,
                    target_audience: formData.target_audience || null,
                    month: parseInt(formData.month),
                    year: parseInt(formData.year),
                    total_posts: parseInt(formData.total_posts),
                    schedule_hours: formData.schedule_hours,
                })
                .eq('id', planId);

            if (updateError) {
                setErrors({ submit: updateError.message });
            } else {
                setFlash({ success: 'Plan actualizado exitosamente.' });
                window.location.href = route('plans.show', planId);
            }
        } catch (err) {
            setErrors({ submit: err.message });
        } finally {
            setProcessing(false);
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

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Editar Plan Mensual</h2>
                    <div className="flex gap-2">
                        <Link
                            href={route('plans.show', planId)}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                        >
                            Ver Plan
                        </Link>
                        <Link
                            href={route('plans.index')}
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
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
                                    value={formData.topic_name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, topic_name: e.target.value }))}
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
                                    value={formData.industry}
                                    onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                                    className="mt-1 block w-full"
                                    placeholder="Ej: Tecnología, Salud, Finanzas"
                                />
                                <InputError message={errors.industry} className="mt-2" />
                            </div>

                            <div className="mb-6">
                                <InputLabel htmlFor="keywords" value="Palabras Clave" />
                                <textarea
                                    id="keywords"
                                    value={formData.keywords}
                                    onChange={(e) => setFormData(prev => ({ ...prev, keywords: e.target.value }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows="2"
                                    placeholder="marketing, redes sociales, contenido digital"
                                />
                                <InputError message={errors.keywords} className="mt-2" />
                            </div>

                            <div className="mb-6">
                                <InputLabel htmlFor="objectives" value="Objetivos" />
                                <textarea
                                    id="objectives"
                                    value={formData.objectives}
                                    onChange={(e) => setFormData(prev => ({ ...prev, objectives: e.target.value }))}
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
                                    value={formData.target_audience}
                                    onChange={(e) => setFormData(prev => ({ ...prev, target_audience: e.target.value }))}
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
                                        value={formData.month}
                                        onChange={(e) => setFormData(prev => ({ ...prev, month: e.target.value }))}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    >
                                        <option value="">Seleccionar mes...</option>
                                        {months.map((m) => (
                                            <option key={m.value} value={m.value}>{m.label}</option>
                                        ))}
                                    </select>
                                    <InputError message={errors.month} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="year" value="Año" />
                                    <select
                                        id="year"
                                        value={formData.year}
                                        onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    >
                                        {years.map((y) => (
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
                                        value={formData.total_posts}
                                        onChange={(e) => setFormData(prev => ({ ...prev, total_posts: e.target.value }))}
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
                                    const selected = formData.schedule_hours.includes(i);
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
                            {formData.schedule_hours.length === 0 && (
                                <p className="mb-4 text-sm text-red-500">Selecciona al menos un horario.</p>
                            )}

                            <div className="flex items-center justify-end">
                                <PrimaryButton disabled={processing || formData.schedule_hours.length === 0}>
                                    {processing ? 'Actualizando...' : 'Actualizar Plan'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}