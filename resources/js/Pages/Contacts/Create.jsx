import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function ContactsCreate() {
    const { flash } = usePage().props;

    const form = useForm({
        name: '',
        company_name: '',
        phone: '',
        email: '',
        city: '',
        notes: '',
    });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('contacts.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Crear Contacto</h2>
                    <Link
                        href={route('contacts.index')}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                    >
                        Volver
                    </Link>
                </div>
            }
        >
            <Head title="Crear Contacto" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="mb-4 rounded-md bg-green-50 p-4 text-sm text-green-800">{flash.success}</div>
                    )}

                    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
                        <form onSubmit={submit} className="p-6">
                            <div className="mb-6">
                                <InputLabel htmlFor="name" value="Nombre" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    value={form.data.name}
                                    onChange={(e) => form.setData('name', e.target.value)}
                                    className="mt-1 block w-full"
                                    required
                                    placeholder="Nombre completo"
                                />
                                <InputError message={form.errors.name} className="mt-2" />
                            </div>

                            <div className="mb-6">
                                <InputLabel htmlFor="company_name" value="Empresa" />
                                <TextInput
                                    id="company_name"
                                    type="text"
                                    value={form.data.company_name}
                                    onChange={(e) => form.setData('company_name', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="Nombre de la empresa"
                                />
                                <InputError message={form.errors.company_name} className="mt-2" />
                            </div>

                            <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <InputLabel htmlFor="phone" value="Teléfono" />
                                    <TextInput
                                        id="phone"
                                        type="text"
                                        value={form.data.phone}
                                        onChange={(e) => form.setData('phone', e.target.value)}
                                        className="mt-1 block w-full"
                                        placeholder="+52 555 123 4567"
                                    />
                                    <InputError message={form.errors.phone} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="email" value="Email" />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        value={form.data.email}
                                        onChange={(e) => form.setData('email', e.target.value)}
                                        className="mt-1 block w-full"
                                        placeholder="contacto@ejemplo.com"
                                    />
                                    <InputError message={form.errors.email} className="mt-2" />
                                </div>
                            </div>

                            <div className="mb-6">
                                <InputLabel htmlFor="city" value="Ciudad" />
                                <TextInput
                                    id="city"
                                    type="text"
                                    value={form.data.city}
                                    onChange={(e) => form.setData('city', e.target.value)}
                                    className="mt-1 block w-full"
                                    placeholder="Ciudad"
                                />
                                <InputError message={form.errors.city} className="mt-2" />
                            </div>

                            <div className="mb-6">
                                <InputLabel htmlFor="notes" value="Notas" />
                                <textarea
                                    id="notes"
                                    value={form.data.notes}
                                    onChange={(e) => form.setData('notes', e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows="3"
                                    placeholder="Notas adicionales..."
                                />
                                <InputError message={form.errors.notes} className="mt-2" />
                            </div>

                            <div className="flex items-center justify-end">
                                <PrimaryButton disabled={form.processing}>
                                    Crear Contacto
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
