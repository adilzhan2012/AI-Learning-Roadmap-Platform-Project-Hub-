import React, { useState, useEffect } from 'react';
import AdminHeader from '../../components/admin/AdminHeader.jsx';
import { FileText, Save, Loader2, CheckCircle2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db, functions } from '../../firebase.js';
import { httpsCallable } from 'firebase/functions';

export default function PoliciesAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [policies, setPolicies] = useState({
    terms_ru: '',
    terms_en: '',
    privacy_ru: '',
    privacy_en: ''
  });

  useEffect(() => {
    async function fetchPolicies() {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'legal'));
        if (docSnap.exists()) {
          setPolicies({
            ...policies,
            ...docSnap.data()
          });
        }
      } catch (e) {
        console.error("Error fetching policies:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchPolicies();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPolicies(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const adminSetPoliciesFn = httpsCallable(functions, 'adminSetPolicies');
      await adminSetPoliciesFn(policies);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      console.error("Error saving policies:", e);
      alert(e.message || "Не удалось сохранить изменения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pb-24 max-w-4xl mx-auto">
      <AdminHeader title="Изменение политик" description="Редактирование Terms of Service и Privacy Policy." />

      {loading ? (
        <div className="flex items-center justify-center h-64 text-zinc-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
        </div>
      ) : (
        <div className="space-y-8 mt-6">
          
          <div className="bg-[#18181B] border border-white/5 rounded-2xl p-6">
            <h2 className="text-lg font-medium text-white flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-indigo-500" />
              Terms of Service
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">На русском</label>
                <textarea 
                  name="terms_ru"
                  value={policies.terms_ru || ''}
                  onChange={handleChange}
                  className="w-full h-48 bg-[#0A0A0B] border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-y"
                  placeholder="Введите текст Условий использования на русском..."
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">На английском</label>
                <textarea 
                  name="terms_en"
                  value={policies.terms_en || ''}
                  onChange={handleChange}
                  className="w-full h-48 bg-[#0A0A0B] border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-y"
                  placeholder="Enter Terms of Service in English..."
                />
              </div>
            </div>
          </div>

          <div className="bg-[#18181B] border border-white/5 rounded-2xl p-6">
            <h2 className="text-lg font-medium text-white flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-indigo-500" />
              Privacy Policy
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">На русском</label>
                <textarea 
                  name="privacy_ru"
                  value={policies.privacy_ru || ''}
                  onChange={handleChange}
                  className="w-full h-48 bg-[#0A0A0B] border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-y"
                  placeholder="Введите текст Политики конфиденциальности на русском..."
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-2">На английском</label>
                <textarea 
                  name="privacy_en"
                  value={policies.privacy_en || ''}
                  onChange={handleChange}
                  className="w-full h-48 bg-[#0A0A0B] border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-y"
                  placeholder="Enter Privacy Policy in English..."
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            {success && (
              <span className="text-emerald-500 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Сохранено успешно
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
