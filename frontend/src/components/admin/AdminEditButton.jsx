import { useAuth } from '../../hooks/useAuth';
import { useEditMode } from '../../context/EditModeContext';

const roleCanEdit = (role) => ['admin', 'super_admin'].includes(role);

export default function AdminEditButton({ resource }) {
  const { user } = useAuth();
  const { editMode, toggleEditMode } = useEditMode();
  if (!user || !roleCanEdit(user.role)) return null;

  return (
    <button
      type="button"
      onClick={toggleEditMode}
      title={editMode ? 'Exit edit mode' : `Edit ${resource || 'section'}`}
      style={{
        position: 'fixed',
        bottom: '1.25rem',
        right: '1.25rem',
        zIndex: 1000,
        background: editMode ? '#dc2626' : '#2563eb',
        color: '#fff',
        border: 'none',
        borderRadius: '9999px',
        padding: '0.75rem 1.1rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        fontSize: '0.875rem',
        cursor: 'pointer',
        display: 'flex',
        gap: '.5rem',
        alignItems: 'center'
      }}
    >
      {editMode ? 'Exit Edit' : 'Admin Edit'}
    </button>
  );
}
