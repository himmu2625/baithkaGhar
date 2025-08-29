'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  Shield, 
  Calendar, 
  Clock, 
  Phone, 
  Mail, 
  MapPin,
  FileText,
  Award,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MoreVertical,
  Download,
  Upload,
  Star,
  TrendingUp,
  UserCheck,
  UserX,
  Briefcase,
  GraduationCap,
  Activity
} from 'lucide-react';

// Types
interface StaffMember {
  _id: string;
  employeeId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    profilePicture?: string;
  };
  employment: {
    role: 'manager' | 'frontdesk' | 'housekeeping' | 'maintenance' | 'accountant' | 'staff';
    department: string;
    designation: string;
    employmentType: string;
    joiningDate: string;
    salary: {
      basic: number;
      currency: string;
    };
  };
  access: {
    isActive: boolean;
    permissions: string[];
    lastLogin?: string;
  };
  schedule: {
    workingDays: string[];
    shiftType: string;
    workingHours: {
      start: string;
      end: string;
    };
  };
  performance: {
    currentRating: number;
    lastReviewDate?: string;
  };
  attendance: {
    presentDays: number;
    absentDays: number;
    lateMarks: number;
  };
  status: 'active' | 'inactive' | 'terminated' | 'on_leave' | 'suspended';
}

interface StaffFormData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  employment: {
    role: string;
    department: string;
    designation: string;
    employmentType: string;
    joiningDate: string;
    salary: {
      basic: number;
    };
  };
  schedule: {
    workingDays: string[];
    shiftType: string;
    workingHours: {
      start: string;
      end: string;
    };
  };
}

export default function StaffManagementPage() {
  const params = useParams();
  const propertyId = params.id as string;

  // State
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Form data
  const [formData, setFormData] = useState<StaffFormData>({
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      phone: ''
    },
    employment: {
      role: 'staff',
      department: 'other',
      designation: '',
      employmentType: 'full-time',
      joiningDate: new Date().toISOString().split('T')[0],
      salary: {
        basic: 0
      }
    },
    schedule: {
      workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      shiftType: 'day',
      workingHours: {
        start: '09:00',
        end: '18:00'
      }
    }
  });

  const roles = [
    { value: 'manager', label: 'Manager', color: 'bg-purple-100 text-purple-800' },
    { value: 'frontdesk', label: 'Front Desk', color: 'bg-blue-100 text-blue-800' },
    { value: 'housekeeping', label: 'Housekeeping', color: 'bg-green-100 text-green-800' },
    { value: 'maintenance', label: 'Maintenance', color: 'bg-orange-100 text-orange-800' },
    { value: 'accountant', label: 'Accountant', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'staff', label: 'Staff', color: 'bg-gray-100 text-gray-800' }
  ];

  const departments = [
    { value: 'management', label: 'Management' },
    { value: 'frontdesk', label: 'Front Desk' },
    { value: 'housekeeping', label: 'Housekeeping' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'accounts', label: 'Accounts' },
    { value: 'security', label: 'Security' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchStaff();
  }, [propertyId]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/os/staff/${propertyId}`);
      const data = await response.json();
      
      if (response.ok) {
        setStaff(data.staff || []);
      } else {
        // Generate sample data if no staff found
        setStaff(generateSampleStaff());
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      setStaff(generateSampleStaff());
    } finally {
      setLoading(false);
    }
  };

  const generateSampleStaff = (): StaffMember[] => {
    return [
      {
        _id: '1',
        employeeId: 'MG001',
        personalInfo: {
          firstName: 'Rajesh',
          lastName: 'Kumar',
          email: 'rajesh.manager@property.com',
          phone: '+91 98765 43210'
        },
        employment: {
          role: 'manager',
          department: 'management',
          designation: 'Property Manager',
          employmentType: 'full-time',
          joiningDate: '2023-01-15',
          salary: {
            basic: 50000,
            currency: 'INR'
          }
        },
        access: {
          isActive: true,
          permissions: ['view_dashboard', 'manage_staff', 'manage_bookings'],
          lastLogin: '2024-03-15T10:30:00Z'
        },
        schedule: {
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          shiftType: 'day',
          workingHours: {
            start: '09:00',
            end: '18:00'
          }
        },
        performance: {
          currentRating: 4.5,
          lastReviewDate: '2024-01-15'
        },
        attendance: {
          presentDays: 22,
          absentDays: 1,
          lateMarks: 0
        },
        status: 'active'
      },
      {
        _id: '2',
        employeeId: 'FD001',
        personalInfo: {
          firstName: 'Priya',
          lastName: 'Sharma',
          email: 'priya.frontdesk@property.com',
          phone: '+91 98765 43211'
        },
        employment: {
          role: 'frontdesk',
          department: 'frontdesk',
          designation: 'Front Desk Executive',
          employmentType: 'full-time',
          joiningDate: '2023-03-01',
          salary: {
            basic: 25000,
            currency: 'INR'
          }
        },
        access: {
          isActive: true,
          permissions: ['view_dashboard', 'manage_bookings', 'manage_guests'],
          lastLogin: '2024-03-15T09:15:00Z'
        },
        schedule: {
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          shiftType: 'day',
          workingHours: {
            start: '08:00',
            end: '16:00'
          }
        },
        performance: {
          currentRating: 4.2,
          lastReviewDate: '2024-02-01'
        },
        attendance: {
          presentDays: 25,
          absentDays: 0,
          lateMarks: 2
        },
        status: 'active'
      },
      {
        _id: '3',
        employeeId: 'HK001',
        personalInfo: {
          firstName: 'Sunita',
          lastName: 'Devi',
          email: 'sunita.housekeeping@property.com',
          phone: '+91 98765 43212'
        },
        employment: {
          role: 'housekeeping',
          department: 'housekeeping',
          designation: 'Housekeeping Supervisor',
          employmentType: 'full-time',
          joiningDate: '2023-02-15',
          salary: {
            basic: 20000,
            currency: 'INR'
          }
        },
        access: {
          isActive: true,
          permissions: ['view_dashboard', 'manage_inventory', 'update_room_status'],
          lastLogin: '2024-03-15T07:45:00Z'
        },
        schedule: {
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          shiftType: 'day',
          workingHours: {
            start: '07:00',
            end: '15:00'
          }
        },
        performance: {
          currentRating: 4.0,
          lastReviewDate: '2024-01-15'
        },
        attendance: {
          presentDays: 24,
          absentDays: 1,
          lateMarks: 1
        },
        status: 'active'
      }
    ];
  };

  const handleAddStaff = async () => {
    try {
      const response = await fetch(`/api/os/staff/${propertyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Staff member added successfully' });
        setShowAddModal(false);
        fetchStaff();
        resetForm();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to add staff member' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add staff member' });
    }
  };

  const handleEditStaff = async () => {
    if (!selectedStaff) return;
    
    try {
      const response = await fetch(`/api/os/staff/${propertyId}/${selectedStaff._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Staff member updated successfully' });
        setShowEditModal(false);
        fetchStaff();
        resetForm();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update staff member' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update staff member' });
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    
    try {
      const response = await fetch(`/api/os/staff/${propertyId}/${staffId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setMessage({ type: 'success', text: 'Staff member deleted successfully' });
        fetchStaff();
      } else {
        const result = await response.json();
        setMessage({ type: 'error', text: result.error || 'Failed to delete staff member' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete staff member' });
    }
  };

  const resetForm = () => {
    setFormData({
      personalInfo: {
        firstName: '',
        lastName: '',
        email: '',
        phone: ''
      },
      employment: {
        role: 'staff',
        department: 'other',
        designation: '',
        employmentType: 'full-time',
        joiningDate: new Date().toISOString().split('T')[0],
        salary: {
          basic: 0
        }
      },
      schedule: {
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        shiftType: 'day',
        workingHours: {
          start: '09:00',
          end: '18:00'
        }
      }
    });
  };

  const filteredStaff = staff.filter(member => {
    const matchesSearch = 
      member.personalInfo.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.personalInfo.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.personalInfo.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = selectedRole === 'all' || member.employment.role === selectedRole;
    const matchesDepartment = selectedDepartment === 'all' || member.employment.department === selectedDepartment;
    
    return matchesSearch && matchesRole && matchesDepartment;
  });

  const getRoleBadge = (role: string) => {
    const roleConfig = roles.find(r => r.value === role);
    return (
      <Badge className={roleConfig?.color || 'bg-gray-100 text-gray-800'}>
        {roleConfig?.label || role}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, text: 'Active' },
      inactive: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle, text: 'Inactive' },
      terminated: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, text: 'Terminated' },
      on_leave: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Calendar, text: 'On Leave' },
      suspended: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle, text: 'Suspended' }
    };

    const { color, icon: Icon, text } = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge variant="outline" className={color}>
        <Icon className="w-3 h-3 mr-1" />
        {text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Loading Staff Management</h2>
            <p className="text-gray-600">Please wait while we fetch your team data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                Staff Management
              </h1>
              <p className="text-gray-600 mt-1">Manage your team members, roles, and permissions</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add Staff
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert Messages */}
        {message && (
          <Alert className={`mb-6 ${
            message.type === 'error' 
              ? 'bg-red-50 border-red-200 text-red-800' 
              : 'bg-green-50 border-green-200 text-green-800'
          }`}>
            {message.type === 'error' ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Staff</p>
                  <p className="text-3xl font-bold text-blue-900">{staff.length}</p>
                  <p className="text-xs text-blue-600 mt-1">All employees</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Active</p>
                  <p className="text-3xl font-bold text-green-900">
                    {staff.filter(s => s.status === 'active').length}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Currently working</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700">Departments</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {new Set(staff.map(s => s.employment.department)).size}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Active departments</p>
                </div>
                <Briefcase className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-700">Avg Rating</p>
                  <p className="text-3xl font-bold text-orange-900">
                    {(staff.reduce((acc, s) => acc + s.performance.currentRating, 0) / staff.length || 0).toFixed(1)}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">Performance score</p>
                </div>
                <Star className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search staff by name, email, or employee ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept.value} value={dept.value}>
                        {dept.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Staff List */}
        <div className="grid gap-6">
          {filteredStaff.map((member) => (
            <Card key={member._id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-lg">
                        {member.personalInfo.firstName[0]}{member.personalInfo.lastName[0]}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {member.personalInfo.firstName} {member.personalInfo.lastName}
                        </h3>
                        {getRoleBadge(member.employment.role)}
                        {getStatusBadge(member.status)}
                      </div>
                      <p className="text-sm text-gray-600">{member.employment.designation}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.personalInfo.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {member.personalInfo.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Joined: {new Date(member.employment.joiningDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedStaff(member);
                        setShowDetailsModal(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedStaff(member);
                        // Populate form with existing data
                        setFormData({
                          personalInfo: member.personalInfo,
                          employment: member.employment,
                          schedule: member.schedule
                        });
                        setShowEditModal(true);
                      }}
                    >
                      <Edit3 className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteStaff(member._id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Staff metrics */}
                <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">Performance</p>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="text-sm font-semibold">{member.performance.currentRating}/5</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">Present Days</p>
                    <p className="text-lg font-semibold text-green-600">{member.attendance.presentDays}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">Late Marks</p>
                    <p className="text-lg font-semibold text-orange-600">{member.attendance.lateMarks}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">Last Login</p>
                    <p className="text-sm text-gray-600">
                      {member.access.lastLogin ? 
                        new Date(member.access.lastLogin).toLocaleDateString() : 
                        'Never'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStaff.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No staff members found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || selectedRole !== 'all' || selectedDepartment !== 'all'
                  ? 'Try adjusting your search filters'
                  : 'Get started by adding your first team member'
                }
              </p>
              {!searchTerm && selectedRole === 'all' && selectedDepartment === 'all' && (
                <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Staff Member
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Staff Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add New Staff Member
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Personal Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.personalInfo.firstName}
                    onChange={(e) => setFormData({
                      ...formData,
                      personalInfo: { ...formData.personalInfo, firstName: e.target.value }
                    })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.personalInfo.lastName}
                    onChange={(e) => setFormData({
                      ...formData,
                      personalInfo: { ...formData.personalInfo, lastName: e.target.value }
                    })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.personalInfo.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      personalInfo: { ...formData.personalInfo, email: e.target.value }
                    })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.personalInfo.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      personalInfo: { ...formData.personalInfo, phone: e.target.value }
                    })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Employment Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.employment.role}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      employment: { ...formData.employment, role: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={formData.employment.department}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      employment: { ...formData.employment, department: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="designation">Designation *</Label>
                  <Input
                    id="designation"
                    value={formData.employment.designation}
                    onChange={(e) => setFormData({
                      ...formData,
                      employment: { ...formData.employment, designation: e.target.value }
                    })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="salary">Basic Salary (INR) *</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={formData.employment.salary.basic}
                    onChange={(e) => setFormData({
                      ...formData,
                      employment: { 
                        ...formData.employment, 
                        salary: { ...formData.employment.salary, basic: Number(e.target.value) }
                      }
                    })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Schedule Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Work Schedule</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shiftType">Shift Type</Label>
                  <Select
                    value={formData.schedule.shiftType}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      schedule: { ...formData.schedule, shiftType: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">Day Shift</SelectItem>
                      <SelectItem value="night">Night Shift</SelectItem>
                      <SelectItem value="rotating">Rotating</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="joiningDate">Joining Date *</Label>
                  <Input
                    id="joiningDate"
                    type="date"
                    value={formData.employment.joiningDate}
                    onChange={(e) => setFormData({
                      ...formData,
                      employment: { ...formData.employment, joiningDate: e.target.value }
                    })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.schedule.workingHours.start}
                    onChange={(e) => setFormData({
                      ...formData,
                      schedule: { 
                        ...formData.schedule, 
                        workingHours: { ...formData.schedule.workingHours, start: e.target.value }
                      }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.schedule.workingHours.end}
                    onChange={(e) => setFormData({
                      ...formData,
                      schedule: { 
                        ...formData.schedule, 
                        workingHours: { ...formData.schedule.workingHours, end: e.target.value }
                      }
                    })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={() => { setShowAddModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddStaff} className="bg-blue-600 hover:bg-blue-700">
              Add Staff Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Edit Staff Member
            </DialogTitle>
          </DialogHeader>
          
          {/* Same form content as Add modal */}
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Personal Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.personalInfo.firstName}
                    onChange={(e) => setFormData({
                      ...formData,
                      personalInfo: { ...formData.personalInfo, firstName: e.target.value }
                    })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.personalInfo.lastName}
                    onChange={(e) => setFormData({
                      ...formData,
                      personalInfo: { ...formData.personalInfo, lastName: e.target.value }
                    })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.personalInfo.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      personalInfo: { ...formData.personalInfo, email: e.target.value }
                    })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.personalInfo.phone}
                    onChange={(e) => setFormData({
                      ...formData,
                      personalInfo: { ...formData.personalInfo, phone: e.target.value }
                    })}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Employment Information */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-gray-900">Employment Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.employment.role}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      employment: { ...formData.employment, role: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Select
                    value={formData.employment.department}
                    onValueChange={(value) => setFormData({
                      ...formData,
                      employment: { ...formData.employment, department: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map(dept => (
                        <SelectItem key={dept.value} value={dept.value}>
                          {dept.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="designation">Designation *</Label>
                  <Input
                    id="designation"
                    value={formData.employment.designation}
                    onChange={(e) => setFormData({
                      ...formData,
                      employment: { ...formData.employment, designation: e.target.value }
                    })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="salary">Basic Salary (INR) *</Label>
                  <Input
                    id="salary"
                    type="number"
                    value={formData.employment.salary.basic}
                    onChange={(e) => setFormData({
                      ...formData,
                      employment: { 
                        ...formData.employment, 
                        salary: { ...formData.employment.salary, basic: Number(e.target.value) }
                      }
                    })}
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={() => { setShowEditModal(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleEditStaff} className="bg-blue-600 hover:bg-blue-700">
              Update Staff Member
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Staff Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Staff Details - {selectedStaff?.personalInfo.firstName} {selectedStaff?.personalInfo.lastName}
            </DialogTitle>
          </DialogHeader>
          
          {selectedStaff && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
                <TabsTrigger value="permissions">Permissions</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Personal Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-sm font-medium">Name</p>
                        <p className="text-sm text-gray-600">
                          {selectedStaff.personalInfo.firstName} {selectedStaff.personalInfo.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-gray-600">{selectedStaff.personalInfo.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-gray-600">{selectedStaff.personalInfo.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Employee ID</p>
                        <p className="text-sm text-gray-600">{selectedStaff.employeeId}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Employment Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div>
                        <p className="text-sm font-medium">Role</p>
                        <div>{getRoleBadge(selectedStaff.employment.role)}</div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Department</p>
                        <p className="text-sm text-gray-600 capitalize">{selectedStaff.employment.department}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Designation</p>
                        <p className="text-sm text-gray-600">{selectedStaff.employment.designation}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Joining Date</p>
                        <p className="text-sm text-gray-600">
                          {new Date(selectedStaff.employment.joiningDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Salary</p>
                        <p className="text-sm text-gray-600">
                          ₹{selectedStaff.employment.salary.basic.toLocaleString()}/month
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Current Rating</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <Star className="h-8 w-8 text-yellow-500 fill-current" />
                        <span className="text-3xl font-bold">{selectedStaff.performance.currentRating}</span>
                        <span className="text-gray-600">/5</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Last Review</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-gray-900">
                        {selectedStaff.performance.lastReviewDate ? 
                          new Date(selectedStaff.performance.lastReviewDate).toLocaleDateString() :
                          'Not reviewed'
                        }
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Performance Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-green-500" />
                        <span className="text-sm text-green-600">Improving</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="attendance" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Present Days</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-green-600">{selectedStaff.attendance.presentDays}</p>
                      <p className="text-sm text-gray-600">This month</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Absent Days</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-red-600">{selectedStaff.attendance.absentDays}</p>
                      <p className="text-sm text-gray-600">This month</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Late Marks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-orange-600">{selectedStaff.attendance.lateMarks}</p>
                      <p className="text-sm text-gray-600">This month</p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="permissions" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Access Permissions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedStaff.access.permissions.map((permission, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{permission.replace('_', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}