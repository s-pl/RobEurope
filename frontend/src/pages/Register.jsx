import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../hooks/useAuth';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-12 text-slate-900">
      <Card className="w-full max-w-3xl border-slate-200">
        <CardHeader className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-slate-500">Programa nuevos equipos</p>
          <CardTitle className="text-3xl">Crea tu cuenta</CardTitle>
          <CardDescription>
            Los datos se envían al endpoint /auth/register para emitir un token y almacenarte en la base de datos.
          </CardDescription>
        </CardHeader>

        <div className="space-y-4 px-6 pb-6">
          {error && <p className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

          <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="first_name">Nombre</Label>
              <Input id="first_name" name="first_name" required value={form.first_name} onChange={handleChange} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="last_name">Apellidos</Label>
              <Input id="last_name" name="last_name" required value={form.last_name} onChange={handleChange} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" required value={form.username} onChange={handleChange} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" value={form.phone} onChange={handleChange} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required value={form.email} onChange={handleChange} className="mt-2" />
            </div>
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                className="mt-2"
              />
            </div>
            <div className="md:col-span-2">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Creando…' : 'Crear cuenta'}
              </Button>
            </div>
          </form>

          <p className="text-center text-xs text-slate-500">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold text-slate-900">
              Inicia sesión
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Register;
