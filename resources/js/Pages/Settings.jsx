import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Settings() {
    const { gemini_key, gemini_configured, linkedin_client_id, linkedin_client_secret, linkedin_configured, linkedin_connected, linkedin_oauth_url, flash } = usePage().props;

    const form = useForm({
        gemini_key: gemini_key || '',
        linkedin_client_id: linkedin_client_id || '',
        linkedin_client_secret: linkedin_client_secret || '',
    });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('settings.update'));
    };

    const handleConnectLinkedIn = () => {
        if (linkedin_oauth_url) {
            window.location.href = linkedin_oauth_url;
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">Configuración</h2>
            }
        >
            <Head title="Configuración" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-800">{flash.success}</div>
                    )}
                    {flash?.error && (
                        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">{flash.error}</div>
                    )}

                    <form onSubmit={submit}>
                        {/* Gemini Settings */}
                        <div className="mb-8 overflow-hidden bg-white shadow sm:rounded-lg">
                            <div className="border-b border-gray-200 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-gray-900">Gemini AI</h3>
                                    {gemini_configured ? (
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
                                        value={form.data.gemini_key}
                                        onChange={(e) => form.setData('gemini_key', e.target.value)}
                                        className="mt-1 block w-full"
                                        placeholder="Ingresa tu API key de Gemini"
                                    />
                                    <InputError message={form.errors.gemini_key} className="mt-2" />
                                </div>
                            </div>
                        </div>

                        {/* LinkedIn Settings */}
                        <div className="mb-8 overflow-hidden bg-white shadow sm:rounded-lg">
                            <div className="border-b border-gray-200 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-gray-900">LinkedIn</h3>
                                    <div className="flex items-center gap-3">
                                        {linkedin_connected ? (
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
                                        {linkedin_oauth_url && (
                                            <button
                                                type="button"
                                                onClick={handleConnectLinkedIn}
                                                className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                            >
                                                Conectar LinkedIn
                                            </button>
                                        )}
                                        {linkedin_connected && (
                                            <button
                                                type="button"
                                                onClick={() => router.post(route('publisher.linkedin-disconnect'))}
                                                className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                            >
                                                Desconectar
                                            </button>
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
                                        value={form.data.linkedin_client_id}
                                        onChange={(e) => form.setData('linkedin_client_id', e.target.value)}
                                        className="mt-1 block w-full"
                                        placeholder="Client ID de la app de LinkedIn"
                                    />
                                    <InputError message={form.errors.linkedin_client_id} className="mt-2" />
                                </div>

                                <div className="mb-4">
                                    <InputLabel htmlFor="linkedin_client_secret" value="LinkedIn Client Secret" />
                                    <TextInput
                                        id="linkedin_client_secret"
                                        type="password"
                                        value={form.data.linkedin_client_secret}
                                        onChange={(e) => form.setData('linkedin_client_secret', e.target.value)}
                                        className="mt-1 block w-full"
                                        placeholder="Client Secret de la app de LinkedIn"
                                    />
                                    <InputError message={form.errors.linkedin_client_secret} className="mt-2" />
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex items-center justify-end">
                            <PrimaryButton disabled={form.processing}>
                                Guardar Configuración
                            </PrimaryButton>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
