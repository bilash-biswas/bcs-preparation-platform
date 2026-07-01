'use client'
import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import {
  fetchStudyGroups,
  createStudyGroup,
  joinStudyGroup,
  fetchGroupActivities,
  setCurrentStudyGroup,
  clearError,
} from '@/store/slices/studyGroupSlice';
import { fetchAllSubjects } from '@/store/slices/subjectSlice';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

// Types
interface CreateFormData {
  name: string;
  description: string;
  selectedSubjects: number[];
  max_members: number;
  is_public: boolean;
}

interface FormErrors {
  name?: string;
  subjects?: string;
  max_members?: string;
}

interface GroupActivity {
  id: number;
  user: {
    username: string;
    first_name?: string;
    last_name?: string;
  };
  activity_type: string;
  details: Record<string, any>;
  created_at: string;
}

const StudyGroupsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { studyGroups, currentStudyGroup, groupActivities, loading, error } = useAppSelector(
    (state) => state.studyGroups
  );
  const { subjects } = useAppSelector((state) => state.subjects);
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'detail'>('list');
  const [joiningGroup, setJoiningGroup] = useState<number | null>(null);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [subjectSearch, setSubjectSearch] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  const [createForm, setCreateForm] = useState<CreateFormData>({
    name: '',
    description: '',
    selectedSubjects: [],
    max_members: 10,
    is_public: true,
  });

  useEffect(() => {
    dispatch(fetchStudyGroups());
    // Fix: Pass the required argument to fetchAllSubjects
    dispatch(fetchAllSubjects({ 
      is_active: true,
      page_size: 100 // Get all subjects for selection
    }));
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        dispatch(clearError());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};
    
    if (!createForm.name.trim()) {
      errors.name = 'Group name is required';
    } else if (createForm.name.length < 3) {
      errors.name = 'Group name must be at least 3 characters';
    }
    
    if (createForm.selectedSubjects.length === 0) {
      errors.subjects = 'Select at least one subject';
    }
    
    if (createForm.max_members < 2 || createForm.max_members > 50) {
      errors.max_members = 'Group size must be between 2 and 50 members';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setCreatingGroup(true);
    try {
      await dispatch(createStudyGroup({
        name: createForm.name,
        description: createForm.description,
        subjects: createForm.selectedSubjects,
        max_members: createForm.max_members,
        is_public: createForm.is_public,
      })).unwrap();
      
      setSuccessMessage('Study group created successfully!');
      setShowCreateForm(false);
      setCreateForm({
        name: '',
        description: '',
        selectedSubjects: [],
        max_members: 10,
        is_public: true,
      });
      setFormErrors({});
    } catch (error) {
      // Error handled by Redux slice
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleJoinGroup = async (groupId: number) => {
    setJoiningGroup(groupId);
    try {
      await dispatch(joinStudyGroup(groupId)).unwrap();
      setSuccessMessage('Successfully joined the study group!');
      // Refresh groups list to update member status
      dispatch(fetchStudyGroups());
    } catch (error) {
      // Error handled by Redux slice
    } finally {
      setJoiningGroup(null);
    }
  };

  const handleViewGroup = (group: any) => {
    dispatch(setCurrentStudyGroup(group));
    dispatch(fetchGroupActivities(group.id));
    setActiveTab('detail');
  };

  const handleBackToList = () => {
    setActiveTab('list');
    dispatch(setCurrentStudyGroup(null));
  };

  const toggleSubject = (subjectId: number) => {
    setCreateForm(prev => ({
      ...prev,
      selectedSubjects: prev.selectedSubjects.includes(subjectId)
        ? prev.selectedSubjects.filter(id => id !== subjectId)
        : [...prev.selectedSubjects, subjectId]
    }));
    
    // Clear subject error when user selects one
    if (formErrors.subjects) {
      setFormErrors(prev => ({ ...prev, subjects: undefined }));
    }
  };

  const getActivityDescription = (activity: GroupActivity) => {
    switch (activity.activity_type) {
      case 'quiz_completed':
        return `Completed a quiz with score ${activity.details?.score || 'N/A'}`;
      case 'achievement_unlocked':
        return `Unlocked achievement: ${activity.details?.achievement_name || 'New Achievement'}`;
      case 'discussion_created':
        return 'Started a new discussion';
      case 'milestone_reached':
        return `Reached milestone: ${activity.details?.milestone || 'New Milestone'}`;
      case 'group_joined':
        return 'Joined the study group';
      default:
        return activity.details?.message || 'Performed an activity';
    }
  };

  const getUserDisplayName = (activity: GroupActivity) => {
    const user = activity.user;
    if (user.first_name && user.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user.username;
  };

  const getUserInitials = (activity: GroupActivity) => {
    const user = activity.user;
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    return user.username.charAt(0).toUpperCase();
  };

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(subjectSearch.toLowerCase())
  );

  if (loading && studyGroups.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'list' ? (
        <>
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Study Groups</h1>
                <p className="text-gray-600 mt-2">
                  Collaborate and learn together with other students
                </p>
              </div>
              <Button
                onClick={() => setShowCreateForm(true)}
                variant="default"
                disabled={creatingGroup}
              >
                {creatingGroup ? 'Creating...' : 'Create Group'}
              </Button>
            </div>
          </div>

          {/* Create Group Form */}
          {showCreateForm && (
            <Card className="mb-6 p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Create Study Group</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCreateForm(false);
                    setFormErrors({});
                  }}
                >
                  ✕
                </Button>
              </div>
              
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="group-name" className="mb-2">
                      Group Name *
                    </Label>
                    <Input
                      id="group-name"
                      type="text"
                      value={createForm.name}
                      onChange={(e) => {
                        setCreateForm(prev => ({ ...prev, name: e.target.value }));
                        if (formErrors.name) {
                          setFormErrors(prev => ({ ...prev, name: undefined }));
                        }
                      }}
                      placeholder="Enter group name"
                      className={formErrors.name ? 'border-red-500' : ''}
                      required
                    />
                    {formErrors.name && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="max-members" className="mb-2">
                      Max Members *
                    </Label>
                    <Input
                      id="max-members"
                      type="number"
                      value={createForm.max_members}
                      onChange={(e) => {
                        setCreateForm(prev => ({ ...prev, max_members: parseInt(e.target.value) || 2 }));
                        if (formErrors.max_members) {
                          setFormErrors(prev => ({ ...prev, max_members: undefined }));
                        }
                      }}
                      min="2"
                      max="50"
                      className={formErrors.max_members ? 'border-red-500' : ''}
                      required
                    />
                    {formErrors.max_members && (
                      <p className="mt-1 text-sm text-red-600">{formErrors.max_members}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="mb-2">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={createForm.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCreateForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe your study group's purpose and goals..."
                    rows={3}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="subject-search">
                      Subjects *
                    </Label>
                    {formErrors.subjects && (
                      <p className="text-sm text-red-600">{formErrors.subjects}</p>
                    )}
                  </div>
                  
                  <Input
                    id="subject-search"
                    type="text"
                    placeholder="Search subjects..."
                    value={subjectSearch}
                    onChange={(e) => setSubjectSearch(e.target.value)}
                    className="mb-3"
                  />
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-md">
                    {filteredSubjects.length === 0 ? (
                      <div className="col-span-full text-center py-4 text-gray-500">
                        No subjects found
                      </div>
                    ) : (
                      filteredSubjects.map((subject) => (
                        <label
                          key={subject.id}
                          className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                            createForm.selectedSubjects.includes(subject.id)
                              ? 'bg-blue-50 border-blue-500 shadow-sm'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <Checkbox
                            checked={createForm.selectedSubjects.includes(subject.id)}
                            onCheckedChange={() => toggleSubject(subject.id)}
                            className="mr-3"
                          />
                          <span className="text-sm font-medium">{subject.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-500">
                    {createForm.selectedSubjects.length} subject(s) selected
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is-public"
                    checked={createForm.is_public}
                    onCheckedChange={(checked: boolean) => setCreateForm(prev => ({ ...prev, is_public: checked }))}
                  />
                  <Label htmlFor="is-public" className="text-sm text-gray-700 cursor-pointer">
                    Public group (anyone can join)
                  </Label>
                </div>

                <div className="flex space-x-3 pt-4">
                  <Button 
                    type="submit" 
                    variant="default" 
                    disabled={creatingGroup}
                    className="flex-1"
                  >
                    {creatingGroup ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creating...
                      </>
                    ) : (
                      'Create Group'
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormErrors({});
                    }}
                    disabled={creatingGroup}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Study Groups List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studyGroups.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">👥</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  No Study Groups Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first study group to start collaborating with others.
                </p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  variant="default"
                >
                  Create Group
                </Button>
              </div>
            ) : (
              studyGroups.map((group) => (
                <Card key={group.id} className="p-6 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">
                        {group.name}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-2">
                        {group.description || 'No description provided.'}
                      </p>
                    </div>
                    <Badge
                      variant={group.is_public ? 'success' : 'secondary'}
                      className="flex-shrink-0 ml-2"
                    >
                      {group.is_public ? 'Public' : 'Private'}
                    </Badge>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Members:</span>
                      <span className="font-medium">
                        {group.member_count || 0}/{group.max_members}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Subjects:</span>
                      <span className="font-medium">{group.subjects?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Creator:</span>
                      <span className="font-medium truncate ml-2">
                        {group.creator?.username || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {group.subjects?.slice(0, 3).map((subject) => (
                      <Badge key={subject.id} variant="outline" className="text-xs">
                        {subject.name}
                      </Badge>
                    ))}
                    {group.subjects && group.subjects.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{group.subjects.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleViewGroup(group)}
                      variant="outline"
                      className="flex-1"
                    >
                      View Details
                    </Button>
                    {!group.is_member ? (
                      <Button
                        onClick={() => handleJoinGroup(group.id)}
                        variant="default"
                        className="flex-1"
                        disabled={
                          (group.member_count || 0) >= group.max_members || 
                          joiningGroup === group.id
                        }
                      >
                        {joiningGroup === group.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            Joining...
                          </>
                        ) : (group.member_count || 0) >= group.max_members ? (
                          'Full'
                        ) : (
                          'Join'
                        )}
                      </Button>
                    ) : (
                      <Button variant="outline" className="flex-1" disabled>
                        ✓ Joined
                      </Button>
                    )}
                  </div>
                </Card>
              ))
            )}
          </div>
        </>
      ) : (
        // Group Detail View
        <div>
          <div className="mb-6">
            <Button
              onClick={handleBackToList}
              variant="outline"
              className="mb-4"
            >
              ← Back to Groups
            </Button>
            
            {currentStudyGroup && (
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {currentStudyGroup.name}
                  </h1>
                  <p className="text-gray-600 mt-2 max-w-2xl">
                    {currentStudyGroup.description || 'No description provided.'}
                  </p>
                </div>
                <Badge
                  variant={currentStudyGroup.is_public ? 'success' : 'secondary'}
                  className="text-sm"
                >
                  {currentStudyGroup.is_public ? 'Public Group' : 'Private Group'}
                </Badge>
              </div>
            )}
          </div>

          {currentStudyGroup && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Group Info */}
              <Card className="p-6 lg:col-span-1">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Group Information</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Creator</div>
                    <div className="font-medium text-gray-900">
                      {currentStudyGroup.creator?.username || 'Unknown'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Members</div>
                    <div className="font-medium text-gray-900">
                      {currentStudyGroup.member_count || 1}/{currentStudyGroup.max_members}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ 
                          width: `${((currentStudyGroup.member_count || 1) / currentStudyGroup.max_members) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Invite Code</div>
                    <div className="font-mono font-medium bg-gray-100 px-3 py-2 rounded-lg text-gray-800 border">
                      {currentStudyGroup.invite_code || 'N/A'}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Share this code to invite others
                    </p>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Created</div>
                    <div className="text-sm text-gray-900">
                      {new Date(currentStudyGroup.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Subjects */}
              <Card className="p-6 lg:col-span-1">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">Subjects</h2>
                <div className="space-y-3">
                  {currentStudyGroup.subjects?.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      No subjects added
                    </div>
                  ) : (
                    currentStudyGroup.subjects?.map((subject) => (
                      <div
                        key={subject.id}
                        className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100"
                      >
                        <div>
                          <span className="font-medium text-blue-900">{subject.name}</span>
                          <div className="text-xs text-blue-700 mt-1">
                            {subject.total_questions || 0} questions
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {subject.category?.name || 'General'}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Recent Activities */}
              <Card className="p-6 lg:col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => dispatch(fetchGroupActivities(currentStudyGroup.id))}
                  >
                    Refresh
                  </Button>
                </div>
                
                {groupActivities.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-3">📝</div>
                    <p className="text-gray-500 mb-2">No recent activities</p>
                    <p className="text-sm text-gray-400">
                      Group activities will appear here when members start learning together
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {groupActivities.map((activity: any) => (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg border border-gray-100"
                      >
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                          {getUserInitials(activity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="font-medium text-gray-900">
                              {getUserDisplayName(activity)}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {activity.activity_type?.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mb-1">
                            {getActivityDescription(activity)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(activity.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudyGroupsPage;