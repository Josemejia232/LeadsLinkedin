import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { insforge } from '@/lib/insforge';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Settings() {
    const [configs, setConfigs] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [flash, setFlash] = useState(null);
    const [processing, setProcessing] = useState(false);

    const [formData, setFormData] = useState({
        gemini_key: '',
        linkedin_client_id: '',
        linkedin_client_secret: '',
    });

    useEffect(() => {
        async function fetchConfigs() {
            try {
                const { data, error: fetchError } = await insforge.database
                    .from('app_configs')
                    .select('*');

                if (fetchError) {
                    setError(fetchError.message);
                } else {
                    const configMap = {};
                    data?.forEach(c => { configMap[c.key] = c.value; });
                    setConfigs(configMap);
                    setFormData({
                        gemini_key: configMap.GEMINI_API_KEY || '',
                        linkedin_client_id: configMap.LINKEDIN_CLIENT_ID || '',
                        linkedin_client_secret: configMap.LINKEDIN_CLIENT_SECRET || '',
                    });
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchConfigs();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setError(null);

        try {
            const updates = [
                { key: 'GEMINI_API_KEY', value: formData.gemini_key },
                { key: 'LINKEDIN_CLIENT_ID', value: formData.linkedin_client_id },
                { key: 'LINKEDIN_CLIENT_SECRET', value: formData.linkedin_client_secret },
            ];

            for (const update of updates) {
                const { error: upsertError } = await insforge.database
                    .from('app_configs')
                    .upsert([update], { onConflict: 'key' });

                if (upsertError) {
                    setError(upsertError.message);
                    return;
                }
            }

            setFlash({ success: 'Configuración guardada exitosamente.' });
        } catch (err) {
            setError(err.message);
        } finally {
            setProcessing(false);
        }
    };

    const geminiConfigured = !!configs.GEMINI_API_KEY;
    const linkedinConfigured = !!configs.LINKEDIN_CLIENT_ID && !!configs.LINKEDIN_CLIENT_SECRET;

    if (loading) {
        return (
            <AuthenticatedLayout header={<h2 className="text-xl font-semibold">Cargando...</h2>}>
                <div className="py-12">
                    <div className="mx-auto max-w-7xl px-4 text-center text-gray-500">Cargando configuración...</div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Configuración</h2>}
        >
            <Head title="Configuración" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-800">{flash.success}</div>
                    )}
                    {error && (
                        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">{error}</div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-8 overflow-hidden bg-white shadow sm:rounded-lg">
                            <div className="border-b border-gray-200 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-gray-900">Gemini AI</h3>
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
                            <div className="p-6">
                                <div className="mb-4">
                                    <InputLabel htmlFor="gemini_key" value="Gemini API Key" />
                                    <TextInput
                                        id="gemini_key"
                                        type="password"
                                        value={formData.gemini_key}
                                        onChange={(e) => setFormData(prev => ({ ...prev, gemini_key: e.target.value }))}
                                        className="mt-1 block w-full"
                                        placeholder="Ingresa tu API key de Gemini"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mb-8 overflow-hidden bg-white shadow sm:rounded-lg">
                            <div className="border-b border-gray-200 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-gray-900">LinkedIn</h3>
                                    <div className="flex items-center gap-3">
                                        {linkedinConfigured ? (
                                            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                                                <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500"></span>
                                                Configurado
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                                                <span className="mr-1.5 h-2 w-2 rounded-full bg-red-500"></span>
                                                No configurado
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="mb-4">
                                    <InputLabel htmlFor="linkedin_client_id" value="LinkedIn Client ID" />
                                    <TextInput
                                        id="linkedin_client_id"
                                        type="text"
                                        value={formData.linkedin_client_id}
                                        onChange={(e) => setFormData(prev => ({ ...prev, linkedin_client_id: e.target.value }))}
                                        className="mt-1 block w-full"
                                        placeholder="Client ID de la app de LinkedIn"
                                    />
                                </div>

                                <div className="mb-4">
                                    <InputLabel htmlFor="linkedin_client_secret" value="LinkedIn Client Secret" />
                                    <TextInput
                                        id="linkedin_client_secret"
                                        type="password"
                                        value={formData.linkedin_client_secret}
                                        onChange={(e) => setFormData(prev => ({ ...prev, linkedin_client_secret: e.target.value }))}
                                        className="mt-1 block w-full"
                                        placeholder="Client Secret de la app de LinkedIn"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end">
                            <PrimaryButton disabled={processing}>
                                {processing ? 'Guardando...' : 'Guardar Configuración'}
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}