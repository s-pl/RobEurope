import { useEffect, useMemo, useState } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select } from '../components/ui/select';
import { useAuth } from '../hooks/useAuth';
import { useApi } from '../hooks/useApi';
import { resolveMediaUrl } from '../lib/apiClient';

const Profile = () => {
  const { user, updateProfile, uploadProfilePhoto } = useAuth();
  const api = useApi();
  const [form, setForm] = useState({ first_name: '', last_name: '', phone: '', country_id: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [countries, setCountries] = useState([]);
  const [countriesStatus, setCountriesStatus] = useState({ loading: false, error: '' });

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        country_id: user.country_id?.toString() || ''
      });
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    const fetchCountries = async () => {
      setCountriesStatus({ loading: true, error: '' });
      try {
        const data = await api('/countries');
        if (active) {
          setCountries(Array.isArray(data) ? data : []);
          setCountriesStatus({ loading: false, error: '' });
        }
      } catch (err) {
        if (active) {
          console.error('No se pudieron cargar los países', err);
          setCountriesStatus({ loading: false, error: 'No se pudieron cargar los países. Comprueba la conexión con la API.' });
        }
        return;
      }
    };
    fetchCountries();
    return () => {
      active = false;
    };
  }, [api]);

  const profileInitials = useMemo(() => {
    const first = user?.first_name?.[0] || '';
    const last = user?.last_name?.[0] || '';
    return `${first}${last}`.toUpperCase() || 'RE';
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFeedback({ type: '', message: '' });
    try {
      const payload = {
        ...form,
        country_id: form.country_id ? Number(form.country_id) : undefined
      };
      if (payload.country_id === undefined) delete payload.country_id;
      await updateProfile(payload);
      setFeedback({ type: 'success', message: 'Perfil actualizado correctamente.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'Error al actualizar el perfil.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setFeedback({ type: '', message: '' });
    try {
      await uploadProfilePhoto(file);
      setFeedback({ type: 'success', message: 'Foto actualizada correctamente.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error.message || 'No se pudo subir la foto.' });
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  if (!user) {
    return <p className="text-sm text-slate-500">No se encontró información del usuario.</p>;
  }

  const photoUrl = resolveMediaUrl(user.profile_photo_url);

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white">
        <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center">
          <div className="relative">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt={user.first_name}
                className="h-24 w-24 rounded-3xl border border-white/20 object-cover shadow-xl"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-white/20 bg-white/10 text-2xl font-semibold">
                {profileInitials}
              </div>
            )}
            <label className="absolute -bottom-2 -right-2 inline-flex cursor-pointer items-center gap-1 rounded-2xl border border-white/30 bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
              <Camera className="h-3.5 w-3.5" />
              {uploading ? 'Subiendo…' : 'Cambiar'}
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          </div>
          <div className="space-y-1">
            <p className="text-[0.65rem] uppercase tracking-[0.6em] text-white/60">Cuenta vinculada</p>
            <h1 className="text-3xl font-semibold">
              {user.first_name} {user.last_name}
            </h1>
            <p className="text-sm text-white/80">{user.email}</p>
            <p className="text-xs text-white/60">Los cambios sincronizan con <code className="font-mono text-white">/users/me</code>.</p>
          </div>
        </div>
      </section>

      {feedback.message && (
        <Card
          className={`border ${
            feedback.type === 'error' ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {feedback.message}
        </Card>
      )}

      <Card className="border-slate-200 bg-white">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="first_name">Nombre</Label>
              <Input id="first_name" name="first_name" value={form.first_name} onChange={handleChange} required className="mt-2" />
            </div>
            <div>
              <Label htmlFor="last_name">Apellidos</Label>
              <Input id="last_name" name="last_name" value={form.last_name} onChange={handleChange} required className="mt-2" />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" value={form.phone} onChange={handleChange} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="country_id">País</Label>
              <Select
                id="country_id"
                name="country_id"
                value={form.country_id}
                onChange={handleChange}
                className="mt-2"
                disabled={countriesStatus.loading}
              >
                <option value="">{countriesStatus.loading ? 'Cargando países…' : 'Sin asignar'}</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.flag_emoji ? `${country.flag_emoji} ` : ''}
                    {country.name}
                  </option>
                ))}
              </Select>
              {countriesStatus.error && <p className="mt-2 text-xs text-red-500">{countriesStatus.error}</p>}
            </div>
          </div>

          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default Profile;
