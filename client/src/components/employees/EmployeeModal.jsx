import { useState } from 'react';
import { useMutation } from "@apollo/client/react";
import { CREATE_EMPLOYEE, UPDATE_EMPLOYEE } from '../../graphql/operations';
import { X, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const EmployeeModal = ({ employee, departments, onClose, onSuccess }) => {
  const { user } = useAuth();
  const isEdit = !!employee;
  const [form, setForm] = useState({
    firstName: employee?.userId?.firstName || '',
    lastName: employee?.userId?.lastName || '',
    email: employee?.userId?.email || '',
    password: '',
    designation: employee?.designation || '',
    department: employee?.department?.id || '',
    phone: employee?.userId?.phone || '',
    baseSalary: employee?.salary?.base || '',
    skills: employee?.skills?.join(', ') || '',
    workType: employee?.workType || 'office',
    bio: employee?.bio || '',
    role: employee?.userId?.role || 'employee',
    lat: employee?.assignedLocation?.lat || '',
    lng: employee?.assignedLocation?.lng || '',
    radius: employee?.assignedLocation?.radius || 100,
  });
  const [loading, setLoading] = useState(false);

  const [createEmployee] = useMutation(CREATE_EMPLOYEE);
  const [updateEmployee] = useMutation(UPDATE_EMPLOYEE);

  const parseCoordinate = (val) => {
    if (!val) return 0;
    const str = String(val).toUpperCase().trim();
    let num = parseFloat(str.replace(/[^0-9.-]/g, ''));
    if (str.includes('S') || str.includes('W')) {
      num = -Math.abs(num);
    }
    return isNaN(num) ? 0 : num;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const input = {
        designation: form.designation,
        department: form.department || undefined,
        salary: { base: parseFloat(form.baseSalary) || 0, bonus: 0, deductions: 0 },
        skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        workType: form.workType,
        bio: form.bio,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        role: form.role
      };
      
      // Add Assigned Location if lat/lng are provided
      if (form.lat && form.lng) {
        input.assignedLocation = {
          lat: parseCoordinate(form.lat),
          lng: parseCoordinate(form.lng),
          radius: parseFloat(form.radius) || 100
        };
      }

      if (!isEdit) input.password = form.password || 'password123';

      if (isEdit) {
        await updateEmployee({ variables: { id: employee.id, input } });
        toast.success('Employee updated');
      } else {
        await createEmployee({ variables: { input } });
        toast.success('Employee created');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-surface-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-surface-200 dark:border-surface-700">
          <h2 className="text-lg font-bold text-surface-900 dark:text-white">{isEdit ? 'Edit Employee' : 'New Employee'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">First Name</label>
              <input name="firstName" value={form.firstName} onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">Last Name</label>
              <input name="lastName" value={form.lastName} onChange={handleChange} className="input-field" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} className="input-field" required />
          </div>
          {!isEdit && (
            <div>
              <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange} className="input-field" placeholder="Default: password123" />
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">Designation</label>
              <input name="designation" value={form.designation} onChange={handleChange} className="input-field" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">Department</label>
              <select name="department" value={form.department} onChange={handleChange} className="input-field">
                <option value="">Select...</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">Base Salary</label>
              <input type="number" name="baseSalary" value={form.baseSalary} onChange={handleChange} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">Work Type</label>
              <select name="workType" value={form.workType} onChange={handleChange} className="input-field">
                <option value="office">Office</option>
                <option value="remote">Remote</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          {/* Admin Location Access Panel */}
          {user?.role === 'admin' && (
            <div className="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-800/30">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={18} className="text-primary-600" />
                <h3 className="font-semibold text-primary-900 dark:text-primary-100">Location Access (Geofencing)</h3>
              </div>
              <p className="text-xs text-primary-600 mb-4">Set the allowed GPS coordinates for mobile check-in.</p>
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-primary-700 dark:text-primary-300 mb-1">Latitude</label>
                  <input type="text" name="lat" value={form.lat} onChange={handleChange} className="input-field text-sm" placeholder="e.g. 11.0267° N" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-primary-700 dark:text-primary-300 mb-1">Longitude</label>
                  <input type="text" name="lng" value={form.lng} onChange={handleChange} className="input-field text-sm" placeholder="e.g. 77.1066° E" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-primary-700 dark:text-primary-300 mb-1">Radius (meters)</label>
                  <input type="number" name="radius" value={form.radius} onChange={handleChange} className="input-field text-sm" placeholder="100" />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">Skills (comma separated)</label>
            <input name="skills" value={form.skills} onChange={handleChange} className="input-field" placeholder="React, Node.js, Python" />
          </div>
          {/* Admin only: Role Selection */}
          {user?.role === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-surface-600 dark:text-surface-300 mb-1">System Access Role</label>
              <select name="role" value={form.role || 'employee'} onChange={handleChange} className="input-field border-primary-200 dark:border-primary-900/30">
                <option value="employee">Employee (Standard Access)</option>
                <option value="hr">HR Manager (Personnel & Leaves)</option>
                <option value="manager">Project Manager (Team & Tasks)</option>
                <option value="admin">Administrator (Full Control)</option>
              </select>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;

