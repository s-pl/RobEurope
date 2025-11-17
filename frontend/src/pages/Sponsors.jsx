import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSponsors } from '../hooks/useSponsors';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { Plus, Edit, Trash2, ExternalLink } from 'lucide-react';

const Sponsors = () => {
  const { t } = useTranslation();
  const { list, create, update, remove } = useSponsors();
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    website_url: ''
  });

  useEffect(() => {
    loadSponsors();
  }, []);

  const loadSponsors = async () => {
    try {
      setLoading(true);
      const data = await list();
      setSponsors(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Error loading sponsors');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSponsor) {
        await update(editingSponsor.id, formData);
      } else {
        await create(formData);
      }
      await loadSponsors();
      setDialogOpen(false);
      resetForm();
    } catch (err) {
      setError(err.message || 'Error saving sponsor');
    }
  };

  const handleEdit = (sponsor) => {
    setEditingSponsor(sponsor);
    setFormData({
      name: sponsor.name || '',
      logo_url: sponsor.logo_url || '',
      website_url: sponsor.website_url || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este sponsor?')) {
      try {
        await remove(id);
        await loadSponsors();
      } catch (err) {
        setError(err.message || 'Error deleting sponsor');
      }
    }
  };

  const resetForm = () => {
    setFormData({ name: '', logo_url: '', website_url: '' });
    setEditingSponsor(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Sponsors</h1>
          <p className="text-blue-600 mt-1">Gestiona los sponsors del evento</p>
        </div>
        <Button onClick={openCreateDialog} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Sponsor
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sponsors.map((sponsor) => (
          <Card key={sponsor.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg text-blue-900">{sponsor.name}</CardTitle>
                  <CardDescription className="text-blue-600">
                    ID: {sponsor.id}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(sponsor)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(sponsor.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {sponsor.logo_url && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-700">Logo:</span>
                  <img
                    src={sponsor.logo_url}
                    alt={`${sponsor.name} logo`}
                    className="h-8 w-8 object-contain rounded"
                  />
                </div>
              )}

              {sponsor.website_url && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-700">Website:</span>
                  <a
                    href={sponsor.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {sponsor.website_url}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-700">Creado:</span>
                <Badge variant="outline">
                  {new Date(sponsor.created_at).toLocaleDateString()}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sponsors.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-blue-400 mb-4">
            <Plus className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-blue-900 mb-2">No hay sponsors</h3>
          <p className="text-blue-600 mb-4">Comienza añadiendo tu primer sponsor</p>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir Sponsor
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-blue-900">
              {editingSponsor ? 'Editar Sponsor' : 'Nuevo Sponsor'}
            </DialogTitle>
            <DialogDescription className="text-blue-600">
              {editingSponsor
                ? 'Modifica los datos del sponsor'
                : 'Añade un nuevo sponsor al evento'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-blue-900">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre del sponsor"
                required
                className="border-blue-200 focus:border-blue-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url" className="text-blue-900">URL del Logo</Label>
              <Input
                id="logo_url"
                type="url"
                value={formData.logo_url}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                placeholder="https://ejemplo.com/logo.png"
                className="border-blue-200 focus:border-blue-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website_url" className="text-blue-900">Sitio Web</Label>
              <Input
                id="website_url"
                type="url"
                value={formData.website_url}
                onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                placeholder="https://ejemplo.com"
                className="border-blue-200 focus:border-blue-400"
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingSponsor ? 'Actualizar' : 'Crear'} Sponsor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sponsors;