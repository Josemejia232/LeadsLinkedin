import { insforge } from '@/lib/insforge';
import { useState, useEffect } from 'react';

export default function InsForgeTest() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const { data, error } = await insforge.database
          .from('monthly_plans')
          .select('*')
          .limit(5);

        if (error) {
          setError(error.message);
        } else {
          setPlans(data || []);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchPlans();
  }, []);

  if (loading) return <div className="p-4">Cargando...</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">InsForge Connection Test</h2>
      <p className="text-sm text-gray-600 mb-4">
        Conectado a: {import.meta.env.VITE_INSFORGE_URL}
      </p>
      <h3 className="font-semibold mb-2">Monthly Plans ({plans.length}):</h3>
      <ul className="list-disc list-inside">
        {plans.map((plan) => (
          <li key={plan.id} className="text-sm">
            {plan.topic_name} - {plan.month}/{plan.year}
          </li>
        ))}
      </ul>
    </div>
  );
}