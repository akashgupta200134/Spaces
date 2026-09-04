'use client';

import React, { useEffect, useState } from 'react';
import API from '../../../lib/api';
import { Building2, Plus, MapPin, Clock, Users, Loader2, X, PlusCircle } from 'lucide-react';

interface Location {
  id: string;
  city: string;
  state: string;
}

interface Space {
  id: string;
  name: string;
  description?: string;
  address: string;
  pincode: string;
  capacity: number;
  openingTime: string;
  closingTime: string;
  status: string;
  location: Location;
  images?: string[] | string;
}

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showSpaceModal, setShowSpaceModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Form state for creating a new Space
  const [formData, setFormData] = useState({
    locationId: '',
    name: '',
    description: '',
    address: '',
    pincode: '',
    latitude: '',
    longitude: '',
    phone: '',
    email: '',
    openingTime: '08:00 AM',
    closingTime: '08:00 PM',
    capacity: '50',
    imageUrl: '',
  });

  // Form state for creating a new Location
  const [locationFormData, setLocationFormData] = useState({
    city: '',
    state: '',
  });

  // Fetch spaces and locations
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [spacesRes, locationsRes] = await Promise.all([
        API.get('/admin/spaces/all'),
        API.get('/admin/locations'),
      ]);
      setSpaces(spacesRes.data);
      setLocations(locationsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Space creation submit
  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await API.post('/admin/spaces', {
        ...formData,
        images: formData.imageUrl ? [formData.imageUrl] : [],
      });
      setShowSpaceModal(false);
      setFormData({
        locationId: '',
        name: '',
        description: '',
        address: '',
        pincode: '',
        latitude: '',
        longitude: '',
        phone: '',
        email: '',
        openingTime: '08:00 AM',
        closingTime: '08:00 PM',
        capacity: '50',
        imageUrl: '',
      });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create space');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Location creation submit
  const handleCreateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await API.post('/admin/locations', locationFormData);
      setShowLocationModal(false);
      setLocationFormData({ city: '', state: '' });
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create location');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-indigo-400" /> Space Management
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage physical workspace hubs, operational timings, and geographic locations.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLocationModal(true)}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-sm font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 transition"
          >
            <PlusCircle className="w-4 h-4 text-slate-400" /> Add Location
          </button>
          <button
            onClick={() => setShowSpaceModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg flex items-center gap-2 transition shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" /> Add New Space
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800/60 rounded-lg text-red-300 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Spaces List / Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" /> Loading workspace hubs...
        </div>
      ) : spaces.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/50 border border-slate-800 rounded-xl">
          <Building2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">No spaces found</p>
          <p className="text-slate-500 text-sm mt-1">Get started by creating your first workspace center.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {spaces.map((space) => (
            <div
              key={space.id}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-lg text-white">{space.name}</h3>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-medium">
                    {space.status}
                  </span>
                </div>
                <div className="text-xs text-indigo-400 font-medium mb-3 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {space.location?.city}, {space.location?.state}
                </div>
                <p className="text-slate-400 text-xs line-clamp-2 mb-4">{space.address}</p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-400 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-500" /> Timings
                  </span>
                  <span className="text-slate-200">
                    {space.openingTime} - {space.closingTime}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-400">
                    <Users className="w-3.5 h-3.5 text-slate-500" /> Total Capacity
                  </span>
                  <span className="text-slate-200 font-medium">{space.capacity} seats</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Add City Location</h2>
              <button
                onClick={() => setShowLocationModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLocation} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">City *</label>
                <input
                  type="text"
                  required
                  placeholder="Mumbai"
                  value={locationFormData.city}
                  onChange={(e) => setLocationFormData({ ...locationFormData, city: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">State *</label>
                <input
                  type="text"
                  required
                  placeholder="Maharashtra"
                  value={locationFormData.state}
                  onChange={(e) => setLocationFormData({ ...locationFormData, state: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowLocationModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                >
                  {submitting ? 'Saving...' : 'Create Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Space Modal */}
      {showSpaceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Create Workspace Center</h2>
              <button
                onClick={() => setShowSpaceModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSpace} className="space-y-4">
              {/* City & Space Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">City Location *</label>
                  <select
                    required
                    value={formData.locationId}
                    onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="" disabled>Select City</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.city}, {loc.state}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Space Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Mulund Space Center"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="A quiet workspace equipped with high-speed internet, ergonomic seating..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Address & Pincode */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="J.N Road, Near Geeta Collection, Mulund West"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Pincode *</label>
                  <input
                    type="text"
                    required
                    placeholder="400080"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Phone & Contact Email */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Contact Email</label>
                  <input
                    type="email"
                    placeholder="mulund@workspace.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Geocoordinates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Latitude *</label>
                  <input
                    type="text"
                    required
                    placeholder="19.1726"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Longitude *</label>
                  <input
                    type="text"
                    required
                    placeholder="72.9565"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Timings & Capacity */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Opening Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="08:00 AM"
                    value={formData.openingTime}
                    onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Closing Time *</label>
                  <input
                    type="text"
                    required
                    placeholder="08:00 PM"
                    value={formData.closingTime}
                    onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Capacity *</label>
                  <input
                    type="number"
                    required
                    placeholder="105"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              {/* Image Cover URL */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSpaceModal(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Saving...' : 'Create Space'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}