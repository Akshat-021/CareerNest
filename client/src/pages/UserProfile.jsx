import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiCamera, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';

const UserProfile = () => {
  const { user, updateProfile } = useAuth();

  // Basic info states
  const [name, setName] = useState(user?.name || '');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profilePreview, setProfilePreview] = useState(user?.profileImage || '');

  // Student specific profile states
  const [cgpa, setCgpa] = useState(user?.studentProfile?.cgpa || 7.0);
  const [branch, setBranch] = useState(user?.studentProfile?.branch || 'Computer Science');
  const [semester, setSemester] = useState(user?.studentProfile?.semester || 1);
  const [skills, setSkills] = useState(user?.studentProfile?.skills?.join(', ') || '');
  const [careerGoal, setCareerGoal] = useState(user?.studentProfile?.careerGoal || 'Full Stack Developer');
  const [prefTech, setPrefTech] = useState(user?.studentProfile?.preferredTechnology || 'React');
  const [studyHours, setStudyHours] = useState(user?.studentProfile?.studyHours || 2);
  const [placementTarget, setPlacementTarget] = useState(user?.studentProfile?.placementTarget || 'Product-based');

  // Mentor specific profile states
  const [expertise, setExpertise] = useState(user?.mentorProfile?.expertise?.join(', ') || '');
  const [bio, setBio] = useState(user?.mentorProfile?.bio || '');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImageFile(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('name', name);
      if (profileImageFile) {
        formData.append('profileImage', profileImageFile);
      }

      if (user.role === 'student') {
        const studentProfile = {
          cgpa: parseFloat(cgpa),
          branch,
          semester: parseInt(semester),
          skills: skills.split(',').map((s) => s.trim()).filter((s) => s !== ''),
          careerGoal,
          preferredTechnology: prefTech,
          studyHours: parseInt(studyHours),
          placementTarget
        };
        formData.append('studentProfile', JSON.stringify(studentProfile));
      }

      if (user.role === 'mentor') {
        const mentorProfile = {
          expertise: expertise.split(',').map((s) => s.trim()).filter((s) => s !== ''),
          bio
        };
        formData.append('mentorProfile', JSON.stringify(mentorProfile));
      }

      const res = await updateProfile(formData);
      if (res.success) {
        setSuccessMsg('Profile settings successfully saved!');
        setTimeout(() => setSuccessMsg(''), 2000);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-xs text-gray-400">Configure your personal and academic parameters to sync with our AI recommendation engine.</p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs flex items-center gap-2">
          <FiCheckCircle size={16} /> <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs flex items-center gap-2">
          <FiAlertCircle size={16} /> <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="glass-panel p-6 rounded-2xl flex flex-col gap-6">
        
        {/* AVATAR PHOTO SELECTOR */}
        <div className="flex flex-col items-center sm:flex-row gap-4 border-b border-gray-250/20 dark:border-gray-800/25 pb-6">
          <div className="relative">
            <img
              src={profilePreview || 'https://via.placeholder.com/150'}
              alt="preview"
              className="w-20 h-20 rounded-full object-cover border-2 border-indigo-500/20"
            />
            <label className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 text-white rounded-full cursor-pointer hover:bg-indigo-700 shadow-md">
              <FiCamera size={14} />
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>
          <div className="text-center sm:text-left text-xs">
            <h4 className="font-bold">Profile Avatar</h4>
            <p className="text-gray-400 mt-0.5">JPEG, PNG formats up to 4MB.</p>
          </div>
        </div>

        {/* BASIC FIELDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="glass-input"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400">Email Address (Read-only)</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="glass-input opacity-60 cursor-not-allowed"
            />
          </div>
        </div>

        {/* STUDENT SPECIFIC PROFILE FORM */}
        {user?.role === 'student' && (
          <div className="flex flex-col gap-4 border-t border-gray-250/20 dark:border-gray-800/25 pt-6">
            <h3 className="font-bold text-sm text-indigo-500 uppercase tracking-wider">Academic Profile</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">CGPA</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={cgpa}
                  onChange={(e) => setCgpa(e.target.value)}
                  className="glass-input"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Branch</label>
                <input
                  type="text"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="glass-input"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Semester</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="glass-input"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400">Current Skills (Comma Separated)</label>
              <input
                type="text"
                placeholder="HTML, CSS, JavaScript, React"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                className="glass-input"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Career Goal</label>
                <input
                  type="text"
                  value={careerGoal}
                  onChange={(e) => setCareerGoal(e.target.value)}
                  className="glass-input"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Preferred Technology</label>
                <input
                  type="text"
                  value={prefTech}
                  onChange={(e) => setPrefTech(e.target.value)}
                  className="glass-input"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Daily Study Hours</label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={studyHours}
                  onChange={(e) => setStudyHours(e.target.value)}
                  className="glass-input"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Placement Target Segment</label>
                <select
                  value={placementTarget}
                  onChange={(e) => setPlacementTarget(e.target.value)}
                  className="glass-input bg-transparent"
                >
                  <option value="Product-based" className="dark:bg-gray-900">Product-Based Companies</option>
                  <option value="Service-based" className="dark:bg-gray-900">Service-Based Companies</option>
                  <option value="Startup" className="dark:bg-gray-900">Startups / Early Stage</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* MENTOR SPECIFIC PROFILE FORM */}
        {user?.role === 'mentor' && (
          <div className="flex flex-col gap-4 border-t border-gray-250/20 dark:border-gray-800/25 pt-6">
            <h3 className="font-bold text-sm text-indigo-500 uppercase tracking-wider">Expert Settings</h3>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400">Expertise Tags (Comma Separated)</label>
              <input
                type="text"
                placeholder="React, NodeJS, System Design"
                value={expertise}
                onChange={(e) => setExpertise(e.target.value)}
                className="glass-input"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400">Expert Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write about your engineering background and mentorship approach..."
                className="w-full h-24 glass-input resize-none"
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="glass-button-primary w-fit self-end flex items-center justify-center gap-2 mt-4"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Save Profile Settings'
          )}
        </button>

      </form>
    </div>
  );
};

export default UserProfile;
