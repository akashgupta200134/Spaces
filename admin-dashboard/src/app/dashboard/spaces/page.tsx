'use client';

import React, { useEffect, useState, useMemo } from 'react';
import API from '../../../lib/api';
import { 
  Building2, Plus, MapPin, Clock, Users, Loader2, X, PlusCircle, 
  Edit3, Trash2, Search, Filter, ShieldAlert, CheckCircle2, Wrench, PowerOff,
  Phone, Mail, Sparkles, Image as ImageIcon, Layers
} from 'lucide-react';
import Image from 'next/image';
interface Location {
  id: string;
  city: string;
  state: string;
}

type SpaceStatus = 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';

interface Space {
  id: string;
  name: string;
  description?: string;
  address: string;
  pincode: string;
  capacity: number;
  openingTime: string;
  closingTime: string;
  status: SpaceStatus;
  location: Location;
  locationId: string;
  phone?: string;
  email?: string;
  latitude?: string;
  longitude?: string;
  amenities?: string[];
  images?: string[] | string;
}

const AVAILABLE_AMENITIES = [
  'High-Speed Wi-Fi',
  'Air Conditioning',
  'Projector / Display',
  'Power Backup',
  'Coffee & Tea Bar',
  'Parking',
  'Conference Room',
  'Printer / Scanner'
];

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Modals
  const [showSpaceModal, setShowSpaceModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);

  // Form state for creating/updating Space
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
    status: 'ACTIVE' as SpaceStatus,
    imageUrl: '',
    amenities: [] as string[],
  });

  // Form state for creating Location
  const [locationFormData, setLocationFormData] = useState({
    city: '',
    state: '',
  });

  const fetchData = async () => {
    try {
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
    let ignore = false;

    const loadInitialData = async () => {
      try {
        const [spacesRes, locationsRes] = await Promise.all([
          API.get('/admin/spaces/all'),
          API.get('/admin/locations'),
        ]);
        if (!ignore) {
          setSpaces(spacesRes.data);
          setLocations(locationsRes.data);
        }
      } catch (err: any) {
        if (!ignore) {
          setError(err.response?.data?.message || 'Failed to load data');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      ignore = true;
    };
  }, []);

  const resetSpaceForm = () => {
    setEditingSpaceId(null);
    setFormData({
      locationId: locations[0]?.id || '',
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
      status: 'ACTIVE',
      imageUrl: '',
      amenities: [],
    });
  };

  const handleOpenCreateModal = () => {
    resetSpaceForm();
    setShowSpaceModal(true);
  };

  const handleOpenEditModal = (space: Space) => {
    setEditingSpaceId(space.id);
    setFormData({
      locationId: space.locationId || space.location?.id || '',
      name: space.name,
      description: space.description || '',
      address: space.address,
      pincode: space.pincode,
      latitude: space.latitude || '',
      longitude: space.longitude || '',
      phone: space.phone || '',
      email: space.email || '',
      openingTime: space.openingTime,
      closingTime: space.closingTime,
      capacity: String(space.capacity),
      status: space.status || 'ACTIVE',
      imageUrl: Array.isArray(space.images) ? space.images[0] || '' : space.images || '',
      amenities: space.amenities || [],
    });
    setShowSpaceModal(true);
  };

  const handleSaveSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      ...formData,
      capacity: Number(formData.capacity),
      images: formData.imageUrl ? [formData.imageUrl] : [],
    };

    try {
      if (editingSpaceId) {
        await API.put(`/admin/spaces/${editingSpaceId}`, payload);
      } else {
        await API.post('/admin/spaces', payload);
      }
      setShowSpaceModal(false);
      resetSpaceForm();
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save space details');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickStatusChange = async (spaceId: string, status: SpaceStatus) => {
    try {
      await API.patch(`/admin/spaces/${spaceId}/status`, { status });
      setSpaces((prev) =>
        prev.map((s) => (s.id === spaceId ? { ...s, status } : s))
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDeleteSpace = async (spaceId: string) => {
    if (!window.confirm('Are you sure you want to remove this space? This action cannot be undone.')) return;
    try {
      await API.delete(`/admin/spaces/${spaceId}`);
      setSpaces((prev) => prev.filter((s) => s.id !== spaceId));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete space');
    }
  };

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

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const filteredSpaces = useMemo(() => {
    return spaces.filter((space) => {
      const matchesSearch =
        space.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        space.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        space.location?.city?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus =
        selectedStatusFilter === 'ALL' || space.status === selectedStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [spaces, searchQuery, selectedStatusFilter]);

  const stats = useMemo(() => {
    return {
      total: spaces.length,
      active: spaces.filter((s) => s.status === 'ACTIVE').length,
      maintenance: spaces.filter((s) => s.status === 'MAINTENANCE').length,
      locations: locations.length,
    };
  }, [spaces, locations]);

  const getStatusBadge = (status: SpaceStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm backdrop-blur-md">
            <CheckCircle2 className="w-3.5 h-3.5" /> Active
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm backdrop-blur-md">
            <Wrench className="w-3.5 h-3.5" /> Maintenance
          </span>
        );
      case 'INACTIVE':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm backdrop-blur-md">
            <PowerOff className="w-3.5 h-3.5" /> Closed
          </span>
        );
    }
  };

const formatDriveUrl = (url: string) => {
  if (!url) return '';
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
  return match ? `https://lh3.googleusercontent.com/d/${match[1]}` : url;
};



  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans selection:bg-indigo-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Space Management
                </h1>
                <p className="text-slate-400 text-sm mt-0.5">
                  Organize workspace hubs, control operational statuses, and configure local amenities.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
  {/* Secondary Button - Add Location */}
  <button
    type="button"
    onClick={() => setShowLocationModal(true)}
    className="group relative inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700/80 rounded-xl transition-all duration-200 shadow-sm backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-indigo-500/40 active:scale-[0.98]"
  >
    <PlusCircle className="w-4 h-4 text-indigo-400 group-hover:text-indigo-300 transition-colors duration-200" /> 
    <span>Add Location</span>
  </button>

  {/* Primary Button - Add New Space */}
  <button
    type="button"
    onClick={handleOpenCreateModal}
    className="group relative inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/35 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 active:scale-[0.98]"
  >
    <Plus className="w-4 h-4 stroke-[2.5] group-hover:rotate-90 transition-transform duration-300 ease-in-out" /> 
    <span>Add New Space</span>
  </button>
</div>       
 </div>

        {/* Quick Stats Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400">Total Spaces</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="p-3 bg-slate-800/60 rounded-xl text-slate-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-emerald-400/80">Active Centers</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{stats.active}</p>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-amber-400/80">Maintenance</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{stats.maintenance}</p>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-indigo-400/80">Cities Covered</p>
              <p className="text-2xl font-bold text-indigo-400 mt-1">{stats.locations}</p>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <MapPin className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-slate-900/70 border border-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-xl">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search spaces by name, address, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition duration-150"
              />
            </div>

            <div className="flex items-center gap-2 min-w-[200px]">
              <div className="flex items-center justify-center p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 shrink-0">
                <Filter className="w-4 h-4" />
              </div>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/60 focus:ring-2 focus:ring-indigo-500/20 transition duration-150"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="MAINTENANCE">In Maintenance</option>
                <option value="INACTIVE">Closed / Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-sm flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button 
              onClick={() => setError(null)} 
              className="p-1 text-rose-400 hover:text-white rounded-lg hover:bg-rose-500/20 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content Display */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-24 text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-sm font-medium">Loading workspace centers...</p>
          </div>
        ) : filteredSpaces.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
            <div className="w-16 h-16 bg-slate-800/60 border border-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-500">
              <Building2 className="w-8 h-8 stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-semibold text-white">No spaces found</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
              We couldn't find any workspace centers matching your current search criteria or status filter.
            </p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedStatusFilter('ALL'); }}
              className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-lg transition"
            >
              Clear Filters
            </button>
          </div>
        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSpaces.map((space) => {
              const coverImg = Array.isArray(space.images) ? space.images[0] : space.images;

              return (
                <div
                  key={space.id}
                  className="group bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-700/80 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Cover Header */}
<div className="relative aspect-[1/1] w-full bg-slate-950 overflow-hidden border-b border-slate-800/80">
  {coverImg ? (
    <>
      {/* Blurred background image to fill side gaps */}
      <Image 
        src={formatDriveUrl(coverImg)} 
        alt="" 
        fill
        aria-hidden="true"
        className=" object-top blur-xl opacity-35 scale-100 pointer-events-none"
        unoptimized
      />
      {/* Main image with clean fit and hover zoom */}
      <Image 
        src={formatDriveUrl(coverImg)} 
        alt={space.name} 
        fill
        sizes="(max-width: 800px) 100vw, (max-width: 1000px) 80vw, 53vw"
        className="object-fit relative z-10 group-hover:scale-105 transition-transform duration-500 ease-out"
        unoptimized
      />
    </>
  ) : (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950/30 text-slate-500 select-none">
      <ImageIcon className="w-8 h-8 stroke-[1.5] mb-1.5 text-slate-600" />
      <span className="text-[11px] font-medium text-slate-400">No Image Uploaded</span>
    </div>
  )}
  
  {/* Gradient Overlay */}
  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/10 to-black/30 pointer-events-none z-10" />

  {/* Status Tag Overlay */}
  <div className="absolute top-3 right-3 z-20">
    {getStatusBadge(space.status)}
  </div>

  {/* City Badge Overlay */}
  <div className="absolute bottom-3 left-3 z-20">
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-950/80 border border-slate-800 text-indigo-300 shadow-lg backdrop-blur-md">
      <MapPin className="w-3.5 h-3.5 text-indigo-400" />
      {space.location?.city ? `${space.location.city}, ${space.location.state}` : 'Location Unassigned'}
    </span>
  </div>
</div>

                    {/* Card Content */}
                    <div className="p-5 space-y-3">
                      <div>
                        <h3 className="font-bold text-lg text-white group-hover:text-indigo-300 transition-colors duration-200 truncate">
                          {space.name}
                        </h3>
                        <p className="text-slate-400 text-xs mt-1 line-clamp-2 leading-relaxed">
                          {space.address}
                        </p>
                      </div>

                      {space.description && (
                        <p className="text-slate-400 text-xs italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/50 line-clamp-2">
                          {space.description}
                        </p>
                      )}

                      {/* Amenities Pills */}
                      {space.amenities && space.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {space.amenities.slice(0, 3).map((item, idx) => (
                            <span 
                              key={idx} 
                              className="text-[11px] bg-slate-950 text-slate-300 px-2.5 py-0.5 rounded-md border border-slate-800 font-medium"
                            >
                              {item}
                            </span>
                          ))}
                          {space.amenities.length > 3 && (
                            <span className="text-[11px] bg-slate-950 text-indigo-400 px-2 py-0.5 rounded-md border border-slate-800 font-medium">
                              +{space.amenities.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer Details */}
                  <div className="p-5 pt-0 space-y-4">
                    <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-indigo-400" /> Operating Hours
                        </span>
                        <span className="text-slate-200 font-medium">{space.openingTime} - {space.closingTime}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-slate-400">
                        <span className="flex items-center gap-1.5 text-slate-400">
                          <Users className="w-3.5 h-3.5 text-indigo-400" /> Seating Capacity
                        </span>
                        <span className="text-slate-200 font-medium">{space.capacity} Seats</span>
                      </div>

                      {(space.phone || space.email) && (
                        <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                          {space.phone && (
                            <span className="flex items-center gap-1 truncate">
                              <Phone className="w-3 h-3 text-slate-500" /> {space.phone}
                            </span>
                          )}
                          {space.email && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 text-slate-500" /> {space.email}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions Bar */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="relative flex-1">
                        <select
                          value={space.status}
                          onChange={(e) => handleQuickStatusChange(space.id, e.target.value as SpaceStatus)}
                          className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs rounded-xl px-2.5 py-2 outline-none focus:ring-1 focus:ring-indigo-500 transition cursor-pointer"
                        >
                          <option value="ACTIVE">Status: Active</option>
                          <option value="MAINTENANCE">Status: Maintenance</option>
                          <option value="INACTIVE">Status: Closed</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(space)}
                          className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-indigo-300 border border-transparent hover:border-slate-700 transition"
                          title="Edit Workspace"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSpace(space.id)}
                          className="p-2 hover:bg-rose-500/10 rounded-xl text-slate-400 hover:text-rose-400 border border-transparent hover:border-rose-500/20 transition"
                          title="Delete Workspace"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Location Modal */}
        {showLocationModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Add City Location</h2>
                </div>
                <button 
                  onClick={() => setShowLocationModal(false)} 
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateLocation} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">City Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai"
                    value={locationFormData.city}
                    onChange={(e) => setLocationFormData({ ...locationFormData, city: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maharashtra"
                    value={locationFormData.state}
                    onChange={(e) => setLocationFormData({ ...locationFormData, state: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 transition"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowLocationModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitting ? 'Saving...' : 'Create Location'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create / Edit Space Modal */}
        {showSpaceModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150 scrollbar-thin scrollbar-thumb-slate-800">
              
              <div className="flex justify-between items-center pb-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {editingSpaceId ? 'Edit Workspace Center' : 'Create Workspace Center'}
                    </h2>
                    <p className="text-xs text-slate-400">Configure space capabilities, timing, and address details.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSpaceModal(false)} 
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSpace} className="space-y-5">
                {/* City & Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">City Location *</label>
                    <select
                      required
                      value={formData.locationId}
                      onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 transition"
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
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Space Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mulund Space Center"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 transition"
                    />
                  </div>
                </div>

                {/* Status Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Operational Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as SpaceStatus })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 transition"
                  >
                    <option value="ACTIVE">Active (Available for booking)</option>
                    <option value="MAINTENANCE">Under Maintenance (Temporarily unavailable)</option>
                    <option value="INACTIVE">Inactive / Closed</option>
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Description</label>
                  <textarea
                    rows={2}
                    placeholder="A quiet workspace equipped with high-speed internet..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 transition resize-none"
                  />
                </div>

                {/* Address & Pincode */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Address *</label>
                    <input
                      type="text"
                      required
                      placeholder="J.N Road, Near Geeta Collection, Mulund West"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Pincode *</label>
                    <input
                      type="text"
                      required
                      placeholder="400080"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 transition"
                    />
                  </div>
                </div>

                {/* Phone & Contact Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="+91 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Contact Email</label>
                    <input
                      type="email"
                      placeholder="mulund@workspace.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 transition"
                    />
                  </div>
                </div>

                {/* Amenities Multi-select */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">Available Amenities</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {AVAILABLE_AMENITIES.map((amenity) => {
                      const selected = formData.amenities.includes(amenity);
                      return (
                        <button
                          type="button"
                          key={amenity}
                          onClick={() => toggleAmenity(amenity)}
                          className={`text-xs p-2.5 rounded-xl border text-left flex items-center justify-between transition ${
                            selected
                              ? 'bg-indigo-600/15 border-indigo-500/50 text-indigo-300 font-medium'
                              : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                          }`}
                        >
                          <span className="truncate">{amenity}</span>
                          <Sparkles className={`w-3.5 h-3.5 shrink-0 ml-1 ${selected ? 'text-indigo-400' : 'text-slate-600'}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Geocoordinates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Latitude</label>
                    <input
                      type="text"
                      placeholder="19.1726"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Longitude</label>
                    <input
                      type="text"
                      placeholder="72.9565"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 transition"
                    />
                  </div>
                </div>

                {/* Timings & Capacity */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Opening Time *</label>
                    <input
                      type="text"
                      required
                      placeholder="08:00 AM"
                      value={formData.openingTime}
                      onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Closing Time *</label>
                    <input
                      type="text"
                      required
                      placeholder="08:00 PM"
                      value={formData.closingTime}
                      onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">Capacity (Seats) *</label>
                    <input
                      type="number"
                      required
                      placeholder="50"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 transition"
                    />
                  </div>
                </div>

                {/* Cover Image URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Cover Image URL</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500/60 transition"
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800 sticky bottom-0 bg-slate-900 pb-1">
                  <button
                    type="button"
                    onClick={() => setShowSpaceModal(false)}
                    className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-5 py-2.5 rounded-xl transition flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    {submitting ? 'Saving Changes...' : editingSpaceId ? 'Update Space' : 'Create Space'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}