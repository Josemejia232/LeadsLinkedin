import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage, Link } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';


export default function Settings() {
    const { gemini_key, gemini_configured, linkedin_client_id, linkedin_client_secret, linkedin_configured, linkedin_connected, linkedin_person_name, linkedin_oauth_url, flash } = usePage().props;

    const { data, setData, post, processing, errors } = useForm({
        gemini_key: gemini_key || '',
        linkedin_client_id: linkedin_client_id || '',
        linkedin_client_secret: linkedin_client_secret || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.update'));
    };

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
                    {flash?.error && (
                        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">{flash.error}</div>
                    )}
                    {errors.submit && (
                        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-800">{errors.submit}</div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="mb-8 overflow-hidden bg-white shadow sm:rounded-lg">
                            <div className="border-b border-gray-200 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-gray-900">OpenAI (Gemini)</h3>
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
                                    <InputLabel htmlFor="gemini_key" value="API Key (OpenAI / Gemini)" />
                                    <TextInput
                                        id="gemini_key"
                                        type="password"
                                        value={data.gemini_key}
                                        onChange={(e) => setData('gemini_key', e.target.value)}
                                        className="mt-1 block w-full"
                                        placeholder="Ingresa tu API key de OpenAI"
                                    />
                                    <InputError message={errors.gemini_key} className="mt-2" />
                                </div>
                            </div>
                        </div>

                        <div className="mb-8 overflow-hidden bg-white shadow sm:rounded-lg">
                            <div className="border-b border-gray-200 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-medium text-gray-900">LinkedIn</h3>
                                    <div className="flex items-center gap-3">
                                        {linkedin_connected ? (
                                            <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                                                <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500"></span>
                                                Conectado como {linkedin_person_name}
                                            </span>
                                        ) : linkedin_configured ? (
                                            <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-sm font-medium text-yellow-800">
                                                <span className="mr-1.5 h-2 w-2 rounded-full bg-yellow-500"></span>
                                                Configurado — conectar
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
                                        value={data.linkedin_client_id}
                                        onChange={(e) => setData('linkedin_client_id', e.target.value)}
                                        className="mt-1 block w-full"
                                        placeholder="Client ID de la app de LinkedIn"
                                    />
                                    <InputError message={errors.linkedin_client_id} className="mt-2" />
                                </div>

                                <div className="mb-4">
                                    <InputLabel htmlFor="linkedin_client_secret" value="LinkedIn Client Secret" />
                                    <TextInput
                                        id="linkedin_client_secret"
                                        type="password"
                                        value={data.linkedin_client_secret}
                                        onChange={(e) => setData('linkedin_client_secret', e.target.value)}
                                        className="mt-1 block w-full"
                                        placeholder="Client Secret de la app de LinkedIn"
                                    />
                                    <InputError message={errors.linkedin_client_secret} className="mt-2" />
                                </div>

                                {linkedin_configured && !linkedin_connected && (
                                    <div className="mt-4">
                                        <a
                                            href={linkedin_oauth_url || route('publisher.linkedin-login')}
                                            className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white transition hover:bg-blue-500"
                                        >
                                            Conectar LinkedIn
                                        </a>
                                    </div>
                                )}

                                {linkedin_connected && (
                                    <div className="mt-4">
                                        <Link
                                            href={route('publisher.linkedin-disconnect')}
                                            className="inline-flex items-center rounded-md border border-red-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-red-700 transition hover:bg-red-50"
                                        >
                                            Desconectar LinkedIn
                                        </Link>
                                    </div>
                                )}
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