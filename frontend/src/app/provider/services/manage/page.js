'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  DollarSign,
  Clock,
  Users,
  Star,
  Eye,
  EyeOff,
  ArrowLeft,
  Sparkles,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import Link from 'next/link';
import PremiumButton from '../../../../components/ui/PremiumButton';
import PremiumCard from '../../../../components/ui/PremiumCard';
import IDCardGenerator from '../../../../components/ui/IDCardGenerator';
import { api } from '../../../../lib/api';
import { useAuth } from '../../../../contexts/AuthContext';
import toast from 'react-hot-toast';

const ManageServicesPage = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState([
    {
      id: 1,
      name: 'Luxury Wedding Package',
      description: 'Complete wedding planning and coordination including venue selection, vendor management, and day-of coordination.',
      price: '250000',
      duration: '6 months',
      category: 'Wedding Planning',
      features: ['Venue Selection', 'Vendor Management', 'Day-of Coordination', 'Timeline Planning'],
      images: ['https://images.unsplash.com/photo-1519741497674-611481863552?w=400'],
      isActive: true,
      bookings: 45
    },
    {
      id: 2,
      name: 'Premium Photography',
      description: 'Professional wedding photography with editing and album creation.',
      price: '80000',
      duration: '2 days',
      category: 'Photography',
      features: ['Full Day Coverage', 'Edited Photos', 'Online Gallery', 'Print Album'],
      images: ['https://images.unsplash.com/photo-1505236858219-835d514036e2?w=400'],
      isActive: true,
      bookings: 32
    }
  ]);

  const [editingService, setEditingService] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showIDGenerator, setShowIDGenerator] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    category: '',
    features: [''],
    images: []
  });

  const categories = [
    'Wedding Planning',
    'Photography',
    'Videography',
    'Catering',
    'Transportation',
    'Entertainment',
    'Decor & Styling',
    'Venue Management',
    'Event Coordination',
    'Other'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData({
      ...formData,
      features: newFeatures
    });
  };

  const addFeature = () => {
    setFormData({
      ...formData,
      features: [...formData.features, '']
    });
  };

  const removeFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      features: newFeatures
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please log in to manage services');
      return;
    }

    setIsLoading(true);

    try {
      const serviceData = {
        ...formData,
        providerId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (editingService) {
        // Update existing service
        await api.updateService(editingService.id, serviceData);
        setServices(services.map(service =>
          service.id === editingService.id
            ? { ...serviceData, id: editingService.id, bookings: editingService.bookings, isActive: editingService.isActive }
            : service
        ));
        setEditingService(null);
        toast.success('Service updated successfully!');
      } else {
        // Add new service
        const response = await api.createService(serviceData);
        const newService = {
          ...serviceData,
          id: response.data.id,
          bookings: 0,
          isActive: true
        };
        setServices([...services, newService]);
        setShowAddForm(false);
        toast.success('Service added successfully!');
      }

      setFormData({
        name: '',
        description: '',
        price: '',
        duration: '',
        category: '',
        features: [''],
        images: []
      });

    } catch (error) {
      console.error('Error saving service:', error);
      toast.error('Failed to save service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      price: service.price,
      duration: service.duration,
      category: service.category,
      features: service.features,
      images: service.images
    });
    setShowAddForm(true);
  };

  const handleDelete = async (serviceId) => {
    if (confirm('Are you sure you want to delete this service?')) {
      try {
        await api.deleteService(serviceId);
        setServices(services.filter(service => service.id !== serviceId));
        toast.success('Service deleted successfully!');
      } catch (error) {
        console.error('Error deleting service:', error);
        toast.error('Failed to delete service. Please try again.');
      }
    }
  };

  const toggleServiceStatus = (serviceId) => {
    setServices(services.map(service =>
      service.id === serviceId
        ? { ...service, isActive: !service.isActive }
        : service
    ));
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link href="/provider/dashboard" className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-6">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Manage Your Services</h1>
              <p className="text-gray-600">Add, edit, and manage your service offerings</p>
            </div>
            <PremiumButton
              variant="primary"
              size="lg"
              onClick={() => {
                setEditingService(null);
                setShowAddForm(true);
                setFormData({
                  name: '',
                  description: '',
                  price: '',
                  duration: '',
                  category: '',
                  features: [''],
                  images: []
                });
              }}
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Service
            </PremiumButton>
          </div>
        </motion.div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {services.map((service) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <PremiumCard className="p-6" hoverEffect="lift">
                <div className="relative">
                  {service.images.length > 0 && (
                    <img
                      src={service.images[0]}
                      alt={service.name}
                      className="w-full h-48 object-cover rounded-xl mb-4"
                    />
                  )}
                  <div className="absolute top-4 right-4 flex space-x-2">
                    <button
                      onClick={() => toggleServiceStatus(service.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${service.isActive
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                      {service.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{service.name}</h3>
                    <p className="text-gray-600 text-sm mb-3">{service.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        {formatPrice(service.price)}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {service.duration}
                      </span>
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {service.bookings} bookings
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Features:</h4>
                    <ul className="space-y-1">
                      {service.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <Star className="w-3 h-3 text-yellow-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                      {service.features.length > 3 && (
                        <li className="text-sm text-gray-500">+{service.features.length - 3} more</li>
                      )}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2">
                      <PremiumButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(service)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </PremiumButton>
                      <PremiumButton
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(service.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </PremiumButton>
                    </div>
                    <PremiumButton variant="ghost" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View
                    </PremiumButton>
                  </div>
                </div>
              </PremiumCard>
            </motion.div>
          ))}
        </div>

        {/* Add/Edit Service Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          >
            <PremiumCard className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingService ? 'Edit Service' : 'Add New Service'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingService(null);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Service Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="e.g., Luxury Wedding Package"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        required
                      >
                        <option value="">Select category</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="4"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Describe your service in detail..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="250000"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Duration
                      </label>
                      <input
                        type="text"
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                        placeholder="e.g., 6 months, 2 days"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Service Features
                      </label>
                      <button type="button" onClick={() => setShowIDGenerator(true)} className="text-sm px-3 py-1 bg-indigo-50 text-indigo-700 rounded-md">ID Card</button>
                    </div>
                    <div className="space-y-3">
                      {formData.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <input
                            type="text"
                            value={feature}
                            onChange={(e) => handleFeatureChange(index, e.target.value)}
                            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            placeholder="Enter a feature"
                          />
                          {formData.features.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeFeature(index)}
                              className="p-2 text-red-500 hover:text-red-700 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <PremiumButton
                        type="button"
                        variant="ghost"
                        onClick={addFeature}
                        className="w-full border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Feature
                      </PremiumButton>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Service Images
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-500 hover:bg-indigo-50 transition-all cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-2">Upload service images</p>
                      <p className="text-sm text-gray-500">Drag and drop images or click to browse</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                    <PremiumButton
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingService(null);
                      }}
                    >
                      Cancel
                    </PremiumButton>
                    <PremiumButton type="submit" variant="primary" disabled={isLoading}>
                      <Save className="w-5 h-5 mr-2" />
                      {isLoading ? 'Saving...' : (editingService ? 'Update Service' : 'Add Service')}
                    </PremiumButton>
                  </div>
                </form>

                {/* ID Card Generator Modal (opened from Service Features) */}
                {showIDGenerator && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <PremiumCard className="w-full max-w-3xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900">ID Card Generator</h3>
                        <button onClick={() => setShowIDGenerator(false)} className="text-gray-500 hover:text-gray-700">Close</button>
                      </div>
                      <IDCardGenerator />
                    </PremiumCard>
                  </div>
                )}
              </div>
            </PremiumCard>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ManageServicesPage;
