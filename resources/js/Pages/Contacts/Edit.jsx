import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { insforge } from '@/lib/insforge';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';

export default function ContactsEdit({ contactId }) {
    const [contact, setContact] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [flash, setFlash] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        company: '',
        phone: '',
        email: '',
        notes: '',
    });
    const [errors, setErrors] = useState({});
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        async function fetchContact() {
            try {
                const { data, error: fetchError } = await insforge.database
                    .from('contacts')
                    .select('*')
                    .eq('id', contactId)
                    .single();

                if (fetchError) {
                    setError(fetchError.message);
                } else {
                    setContact(data);
                    setFormData({
                        name: data.name || '',
                        company: data.company || '',
                        phone: data.phone || '',
                        email: data.email || '',
                        notes: data.notes || '',
                    });
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchContact();
    }, [contactId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        try {
            const { error: updateError } = await insforge.database
                .from('contacts')
                .update({
                    name: formData.name,
                    company: formData.company || null,
                    phone: formData.phone || null,
                    email: formData.email || null,
                    notes: formData.notes || null,
                })
                .eq('id', contactId);

            if (updateError) {
                setErrors({ submit: updateError.message });
            } else {
                setFlash({ success: 'Contacto actualizado exitosamente.' });
                window.location.href = route('contacts.index');
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
                    <div className="mx-auto max-w-7xl px-4 text-center text-gray-500">Cargando contacto...</div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Editar Contacto</h2>
                    <Link
                        href={route('contacts.index')}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-widest text-gray-700 shadow-sm transition hover:bg-gray-50"
                    >
                        Volver
                    </Link>
                </div>
            }
        >
            <Head title="Editar Contacto" />

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
                            <div className="mb-6">
                                <InputLabel htmlFor="name" value="Nombre" />
                                <TextInput
                                    id="name"
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="mt-1 block w-full"
                                    required
                                />
                                <InputError message={errors.name} className="mt-2" />
                            </div>

                            <div className="mb-6">
                                <InputLabel htmlFor="company" value="Empresa" />
                                <TextInput
                                    id="company"
                                    type="text"
                                    value={formData.company}
                                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                                    className="mt-1 block w-full"
                                />
                                <InputError message={errors.company} className="mt-2" />
                            </div>

                            <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <div>
                                    <InputLabel htmlFor="phone" value="Teléfono" />
                                    <TextInput
                                        id="phone"
                                        type="text"
                                        value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="mt-1 block w-full"
                                    />
                                    <InputError message={errors.phone} className="mt-2" />
                                </div>

                                <div>
                                    <InputLabel htmlFor="email" value="Email" />
                                    <TextInput
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="mt-1 block w-full"
                                    />
                                    <InputError message={errors.email} className="mt-2" />
                                </div>
                            </div>

                            <div className="mb-6">
                                <InputLabel htmlFor="notes" value="Notas" />
                                <textarea
                                    id="notes"
                                    value={formData.notes}
                                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    rows="3"
                                />
                                <InputError message={errors.notes} className="mt-2" />
                            </div>

                            <div className="flex items-center justify-end">
                                <PrimaryButton disabled={processing}>
                                    {processing ? 'Actualizando...' : 'Actualizar Contacto'}
                                </PrimaryButton>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}