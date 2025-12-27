'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Upload, Edit, Trash2, Move, Loader2, X, Linkedin, Twitter, Github, Globe, Mail, MapPin, Calendar, Eye, EyeOff } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TeamMemberSocial {
  linkedin?: string;
  twitter?: string;
  github?: string;
  website?: string;
  email?: string;
}

interface TeamMember {
  _id: string;
  name: string;
  role: string;
  department: string;
  bio: string;
  image: {
    url: string;
    public_id: string;
  };
  social: TeamMemberSocial;
  order: number;
  isActive: boolean;
  showOnAboutPage: boolean;
  joinedDate: string;
  location: string;
  skills: string[];
  achievements: string[];
  education: string;
  experience: string;
}

interface TeamMemberFormData {
  name: string;
  role: string;
  department: string;
  bio: string;
  image: {
    url: string;
    public_id: string;
  } | null;
  social: TeamMemberSocial;
  showOnAboutPage: boolean;
  joinedDate: string;
  location: string;
  skills: string[];
  achievements: string[];
  education: string;
  experience: string;
}

const ROLES = [
  'CEO', 'Co-Founder', 'CTO', 'COO', 'CFO',
  'VP Engineering', 'VP Marketing', 'VP Sales',
  'Head of Product', 'Head of Design', 'Head of Operations',
  'Senior Developer', 'Developer', 'Designer',
  'Marketing Manager', 'Sales Manager', 'Product Manager',
  'HR Manager', 'Finance Manager', 'Customer Success Manager',
  'Other'
];

const DEPARTMENTS = [
  'Executive', 'Engineering', 'Product', 'Design',
  'Marketing', 'Sales', 'Operations', 'Finance',
  'HR', 'Customer Success', 'Other'
];

export function EnhancedTeamManagement() {
  const { toast } = useToast();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentSkill, setCurrentSkill] = useState('');
  const [currentAchievement, setCurrentAchievement] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterVisibility, setFilterVisibility] = useState<string>('all');

  const [formData, setFormData] = useState<TeamMemberFormData>({
    name: '',
    role: '',
    department: '',
    bio: '',
    image: null,
    social: {},
    showOnAboutPage: false,
    joinedDate: new Date().toISOString().split('T')[0],
    location: '',
    skills: [],
    achievements: [],
    education: '',
    experience: '',
  });

  // Fetch team members
  const fetchTeamMembers = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/team');
      const data = await response.json();
      
      if (data.success) {
        setTeamMembers(data.data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch team members',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch team members',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  // Handle photo upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image size must be less than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('upload_preset', 'baithaka_hotels');
      formDataUpload.append('folder', 'team_photos');

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dkfrxlezi/image/upload',
        {
          method: 'POST',
          body: formDataUpload,
        }
      );

      const data = await response.json();
      
      if (data.secure_url) {
        setFormData(prev => ({
          ...prev,
          image: {
            url: data.secure_url,
            public_id: data.public_id,
          },
        }));
        
        toast({
          title: 'Success',
          description: 'Photo uploaded successfully',
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload photo',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.role || !formData.department || !formData.bio || !formData.image) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields and upload a photo',
        variant: 'destructive',
      });
      return;
    }

    try {
      const url = editingMember 
        ? `/api/admin/team/${editingMember._id}`
        : '/api/admin/team';
      
      const method = editingMember ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          order: editingMember?.order || teamMembers.length,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: `Team member ${editingMember ? 'updated' : 'added'} successfully`,
        });
        
        setIsDialogOpen(false);
        resetForm();
        fetchTeamMembers();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save team member',
        variant: 'destructive',
      });
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) return;

    try {
      const response = await fetch(`/api/admin/team/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Team member deleted successfully',
        });
        fetchTeamMembers();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete team member',
        variant: 'destructive',
      });
    }
  };

  // Handle drag and drop reordering
  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(filteredMembers);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setTeamMembers(prev => {
      const updated = [...prev];
      const updatedWithOrder = items.map((member, index) => ({
        ...member,
        order: index,
      }));
      
      // Replace the filtered items in the original array
      updatedWithOrder.forEach(updatedMember => {
        const originalIndex = updated.findIndex(m => m._id === updatedMember._id);
        if (originalIndex !== -1) {
          updated[originalIndex] = updatedMember;
        }
      });
      
      return updated;
    });

    try {
      const teamMembersWithNewOrder = items.map((member, index) => ({
        id: member._id,
        order: index,
      }));

      const response = await fetch('/api/admin/team', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamMembers: teamMembersWithNewOrder }),
      });

      const data = await response.json();

      if (!data.success) {
        fetchTeamMembers();
        throw new Error(data.message);
      }

      toast({
        title: 'Success',
        description: 'Team member order updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update team member order',
        variant: 'destructive',
      });
    }
  };

  // Add skill
  const addSkill = () => {
    if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, currentSkill.trim()]
      }));
      setCurrentSkill('');
    }
  };

  // Remove skill
  const removeSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  // Add achievement
  const addAchievement = () => {
    if (currentAchievement.trim() && !formData.achievements.includes(currentAchievement.trim())) {
      setFormData(prev => ({
        ...prev,
        achievements: [...prev.achievements, currentAchievement.trim()]
      }));
      setCurrentAchievement('');
    }
  };

  // Remove achievement
  const removeAchievement = (achievementToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      achievements: prev.achievements.filter(achievement => achievement !== achievementToRemove)
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      role: '',
      department: '',
      bio: '',
      image: null,
      social: {},
      showOnAboutPage: false,
      joinedDate: new Date().toISOString().split('T')[0],
      location: '',
      skills: [],
      achievements: [],
      education: '',
      experience: '',
    });
    setEditingMember(null);
  };

  // Open edit dialog
  const openEditDialog = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      role: member.role,
      department: member.department,
      bio: member.bio,
      image: member.image,
      social: member.social || {},
      showOnAboutPage: member.showOnAboutPage,
      joinedDate: member.joinedDate ? member.joinedDate.split('T')[0] : new Date().toISOString().split('T')[0],
      location: member.location || '',
      skills: member.skills || [],
      achievements: member.achievements || [],
      education: member.education || '',
      experience: member.experience || '',
    });
    setIsDialogOpen(true);
  };

  // Toggle about page visibility
  const toggleAboutPageVisibility = async (id: string, currentValue: boolean) => {
    try {
      const response = await fetch(`/api/admin/team/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          showOnAboutPage: !currentValue,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setTeamMembers(prev => 
          prev.map(member => 
            member._id === id 
              ? { ...member, showOnAboutPage: !currentValue }
              : member
          )
        );
        
        toast({
          title: 'Success',
          description: `Team member ${!currentValue ? 'will now' : 'will no longer'} appear on About page`,
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update visibility',
        variant: 'destructive',
      });
    }
  };

  // Filter team members
  const filteredMembers = teamMembers.filter(member => {
    const departmentMatch = filterDepartment === 'all' || member.department === filterDepartment;
    const visibilityMatch = filterVisibility === 'all' || 
      (filterVisibility === 'visible' && member.showOnAboutPage) ||
      (filterVisibility === 'hidden' && !member.showOnAboutPage);
    
    return departmentMatch && visibilityMatch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-darkGreen">Team Management</h2>
          <p className="text-mediumGreen">Manage team members, control About page visibility, and organize by departments</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  resetForm();
                  setIsDialogOpen(true);
                }}
                className="bg-brownTan hover:bg-brownTan/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMember ? 'Edit Team Member' : 'Add New Team Member'}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="basic" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="social">Social & Links</TabsTrigger>
                  <TabsTrigger value="skills">Skills & Achievements</TabsTrigger>
                </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="role">Role *</Label>
                      <Select
                        value={formData.role}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map(role => (
                            <SelectItem key={role} value={role}>{role}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="department">Department *</Label>
                      <Select
                        value={formData.department}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTMENTS.map(dept => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="e.g., New York, NY"
                      />
                    </div>

                    <div>
                      <Label htmlFor="joinedDate">Joined Date</Label>
                      <Input
                        id="joinedDate"
                        type="date"
                        value={formData.joinedDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, joinedDate: e.target.value }))}
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="showOnAboutPage"
                        checked={formData.showOnAboutPage}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, showOnAboutPage: checked }))}
                      />
                      <Label htmlFor="showOnAboutPage">Show on About Page</Label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio *</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      rows={4}
                      maxLength={500}
                      required
                      placeholder="Tell us about this team member..."
                    />
                    <p className="text-xs text-gray-500 mt-1">{formData.bio.length}/500 characters</p>
                  </div>

                  <div>
                    <Label>Profile Photo *</Label>
                    <div className="space-y-2">
                      {formData.image ? (
                        <div className="relative w-24 h-24 rounded-full overflow-hidden">
                          <Image
                            src={formData.image.url}
                            alt="Team member"
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, image: null }))}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-lightGreen rounded-lg p-4 text-center">
                          <Upload className="h-8 w-8 mx-auto mb-2 text-mediumGreen" />
                          <p className="text-sm text-darkGreen mb-2">
                            {uploading ? 'Uploading...' : 'Click to upload photo'}
                          </p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            disabled={uploading}
                            className="hidden"
                            id="photo-upload"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('photo-upload')?.click()}
                            disabled={uploading}
                            className="border-lightGreen text-darkGreen"
                          >
                            {uploading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              'Upload Photo'
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-4">
                  <div>
                    <Label htmlFor="education">Education</Label>
                    <Textarea
                      id="education"
                      value={formData.education}
                      onChange={(e) => setFormData(prev => ({ ...prev, education: e.target.value }))}
                      rows={2}
                      placeholder="Educational background..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="experience">Experience</Label>
                    <Textarea
                      id="experience"
                      value={formData.experience}
                      onChange={(e) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                      rows={3}
                      placeholder="Professional experience and background..."
                    />
                  </div>
                </TabsContent>

                <TabsContent value="social" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="linkedin">LinkedIn Profile</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          <Linkedin className="h-4 w-4" />
                        </span>
                        <Input
                          id="linkedin"
                          className="rounded-l-none"
                          value={formData.social.linkedin || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            social: { ...prev.social, linkedin: e.target.value }
                          }))}
                          placeholder="https://linkedin.com/in/username"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="twitter">Twitter Profile</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          <Twitter className="h-4 w-4" />
                        </span>
                        <Input
                          id="twitter"
                          className="rounded-l-none"
                          value={formData.social.twitter || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            social: { ...prev.social, twitter: e.target.value }
                          }))}
                          placeholder="https://twitter.com/username"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="github">GitHub Profile</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          <Github className="h-4 w-4" />
                        </span>
                        <Input
                          id="github"
                          className="rounded-l-none"
                          value={formData.social.github || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            social: { ...prev.social, github: e.target.value }
                          }))}
                          placeholder="https://github.com/username"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="website">Personal Website</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          <Globe className="h-4 w-4" />
                        </span>
                        <Input
                          id="website"
                          className="rounded-l-none"
                          value={formData.social.website || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            social: { ...prev.social, website: e.target.value }
                          }))}
                          placeholder="https://website.com"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="email">Professional Email</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          <Mail className="h-4 w-4" />
                        </span>
                        <Input
                          id="email"
                          type="email"
                          className="rounded-l-none"
                          value={formData.social.email || ''}
                          onChange={(e) => setFormData(prev => ({ 
                            ...prev, 
                            social: { ...prev.social, email: e.target.value }
                          }))}
                          placeholder="email@company.com"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="skills" className="space-y-4">
                  <div>
                    <Label htmlFor="skills">Skills</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={currentSkill}
                        onChange={(e) => setCurrentSkill(e.target.value)}
                        placeholder="Add a skill..."
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      />
                      <Button type="button" onClick={addSkill} variant="outline">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="bg-lightGreen/10 text-darkGreen">
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="ml-2 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="achievements">Achievements</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        value={currentAchievement}
                        onChange={(e) => setCurrentAchievement(e.target.value)}
                        placeholder="Add an achievement..."
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAchievement())}
                      />
                      <Button type="button" onClick={addAchievement} variant="outline">Add</Button>
                    </div>
                    <div className="space-y-2">
                      {formData.achievements.map((achievement, index) => (
                        <div key={index} className="flex items-center justify-between bg-lightGreen/5 p-2 rounded">
                          <span className="text-sm">{achievement}</span>
                          <button
                            type="button"
                            onClick={() => removeAchievement(achievement)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-brownTan hover:bg-brownTan/90"
                  disabled={uploading}
                >
                  {editingMember ? 'Update' : 'Add'} Team Member
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <Label htmlFor="filterDepartment">Filter by Department</Label>
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {DEPARTMENTS.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="filterVisibility">Filter by Visibility</Label>
          <Select value={filterVisibility} onValueChange={setFilterVisibility}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Members</SelectItem>
              <SelectItem value="visible">Visible on About Page</SelectItem>
              <SelectItem value="hidden">Hidden from About Page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-darkGreen">{teamMembers.length}</div>
            <div className="text-sm text-mediumGreen">Total Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-darkGreen">
              {teamMembers.filter(m => m.showOnAboutPage).length}
            </div>
            <div className="text-sm text-mediumGreen">On About Page</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-darkGreen">
              {new Set(teamMembers.map(m => m.department)).size}
            </div>
            <div className="text-sm text-mediumGreen">Departments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-darkGreen">
              {teamMembers.filter(m => ['CEO', 'Co-Founder', 'CTO'].includes(m.role)).length}
            </div>
            <div className="text-sm text-mediumGreen">Leadership</div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members List */}
      {filteredMembers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-mediumGreen">
              {teamMembers.length === 0 
                ? "No team members found. Add your first team member!" 
                : "No team members match the current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="team-members">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {filteredMembers.map((member, index) => (
                  <Draggable key={member._id} draggableId={member._id} index={index}>
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`${snapshot.isDragging ? 'shadow-lg' : ''}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div
                              {...provided.dragHandleProps}
                              className="flex items-center justify-center w-8 h-8 text-mediumGreen hover:text-darkGreen cursor-grab"
                            >
                              <Move className="h-4 w-4" />
                            </div>
                            
                            <div className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                              <Image
                                src={member.image.url}
                                alt={member.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-darkGreen truncate">{member.name}</h3>
                                {member.showOnAboutPage && (
                                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                                    About Page
                                  </Badge>
                                )}
                              </div>
                              <p className="text-brownTan text-sm">{member.role} • {member.department}</p>
                              {member.location && (
                                <p className="text-xs text-mediumGreen flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {member.location}
                                </p>
                              )}
                              <p className="text-sm text-mediumGreen mt-1 line-clamp-2">{member.bio}</p>
                              
                              {/* Skills */}
                              {member.skills && member.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {member.skills.slice(0, 3).map((skill, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {member.skills.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{member.skills.length - 3} more
                                    </Badge>
                                  )}
                                </div>
                              )}

                              {/* Social Links */}
                              {member.social && Object.values(member.social).some(link => link) && (
                                <div className="flex gap-2 mt-2">
                                  {member.social.linkedin && (
                                    <a href={member.social.linkedin} target="_blank" rel="noopener noreferrer">
                                      <Linkedin className="h-4 w-4 text-blue-600 hover:text-blue-800" />
                                    </a>
                                  )}
                                  {member.social.twitter && (
                                    <a href={member.social.twitter} target="_blank" rel="noopener noreferrer">
                                      <Twitter className="h-4 w-4 text-blue-400 hover:text-blue-600" />
                                    </a>
                                  )}
                                  {member.social.github && (
                                    <a href={member.social.github} target="_blank" rel="noopener noreferrer">
                                      <Github className="h-4 w-4 text-gray-700 hover:text-gray-900" />
                                    </a>
                                  )}
                                  {member.social.website && (
                                    <a href={member.social.website} target="_blank" rel="noopener noreferrer">
                                      <Globe className="h-4 w-4 text-gray-600 hover:text-gray-800" />
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleAboutPageVisibility(member._id, member.showOnAboutPage)}
                                className={`border-lightGreen ${member.showOnAboutPage ? 'text-green-600' : 'text-gray-600'}`}
                              >
                                {member.showOnAboutPage ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDialog(member)}
                                className="border-lightGreen text-darkGreen"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDelete(member._id)}
                                className="border-red-200 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
} 