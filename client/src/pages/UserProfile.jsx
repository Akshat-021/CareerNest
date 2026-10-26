import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { FiUser, FiCamera, FiAlertCircle, FiCheckCircle, FiGithub, FiShield, FiExternalLink } from 'react-icons/fi';
import api from '../services/api';

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

  // GitHub & Passport States
  const [githubUsername, setGithubUsername] = useState('');
  const [githubSyncing, setGithubSyncing] = useState(false);
  const [githubResult, setGithubResult] = useState(null);
  const [customSlug, setCustomSlug] = useState('');
  const [customBio, setCustomBio] = useState('');
  const [isPassportPublic, setIsPassportPublic] = useState(true);

  // Mentor specific profile states
  const [expertise, setExpertise] = useState(user?.mentorProfile?.expertise?.join(', ') || '');
  const [bio, setBio] = useState(user?.mentorProfile?.bio || '');

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadCareerProfile = async () => {
      if (user?.role === 'student') {
        try {
          const res = await api.get('/api/ai/career-profile');
          if (res.data.success && res.data.profile) {
            const cp = res.data.profile;
            if (cp.githubData?.username) {
              setGithubUsername(cp.githubData.username);
              setGithubResult(cp.githubData);
            }
            if (cp.passportSettings) {
              setCustomSlug(cp.passportSettings.slug || '');
              setCustomBio(cp.passportSettings.customBio || '');
              setIsPassportPublic(cp.passportSettings.isPublic ?? true);
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
    };
    loadCareerProfile();
  }, [user]);

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfileImageFile(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleSyncGitHub = async () => {
    if (!githubUsername.trim()) return;
    setGithubSyncing(true);
    setErrorMsg('');
    try {
      const res = await api.post('/api/ai/github-sync', { username: githubUsername });
      if (res.data.success) {
        setGithubResult(res.data.githubData);
        setSuccessMsg('GitHub profile connected and repository intelligence synced!');
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      setErrorMsg('Failed to sync with GitHub. Check username.');
    } finally {
      setGithubSyncing(false);
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

        // Also update CareerProfile passport settings
        await api.put('/api/ai/career-profile', {
          targetRole: careerGoal,
          passportSettings: {
            slug: customSlug || undefined,
            customBio,
            isPublic: isPassportPublic
          }
        });
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
        setSuccessMsg('Profile and Career Intelligence settings saved!');
        setTimeout(() => setSuccessMsg(''), 2500);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile & Career Intelligence Settings</h1>
        <p className="text-xs text-gray-400">Configure your academic parameters, connect GitHub, and manage your public Career Passport.</p>
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

      <form onSubmit={handleSaveProfile} className="glass-panel p-6 sm:p-8 rounded-3xl flex flex-col gap-6 shadow-xl">
        
        {/* AVATAR PHOTO SELECTOR */}
        <div className="flex flex-col items-center sm:flex-row gap-4 border-b border-gray-200/50 dark:border-gray-800/50 pb-6">
          <div className="relative">
            <img
              src={profilePreview || 'https://via.placeholder.com/150'}
              alt="preview"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-indigo-500/20 shadow-md"
            />
            <label className="absolute bottom-0 right-0 p-1.5 bg-indigo-600 text-white rounded-xl cursor-pointer hover:bg-indigo-700 shadow-md">
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
          <div className="flex flex-col gap-6 border-t border-gray-200/50 dark:border-gray-800/50 pt-6">
            {/* GITHUB INTELLIGENCE SYNC */}
            <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/15 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FiGithub size={16} /> GitHub Profile Intelligence
                </h3>
                {githubResult?.projectComplexityScore && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500">
                    Complexity: {githubResult.projectComplexityScore}%
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Connect your GitHub username to verify repository code quality, commit history, and top languages.
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  placeholder="Enter GitHub username (e.g. torvalds)"
                  className="w-full glass-input text-xs"
                />
                <button
                  type="button"
                  onClick={handleSyncGitHub}
                  disabled={githubSyncing}
                  className="glass-button-primary text-xs whitespace-nowrap"
                >
                  {githubSyncing ? 'Syncing...' : 'Sync GitHub'}
                </button>
              </div>

              {githubResult && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs mt-1">
                  <div className="p-2 rounded-xl glass-panel">
                    <span className="text-gray-400 text-[10px]">Public Repos</span>
                    <p className="font-bold text-indigo-500">{githubResult.publicRepos}</p>
                  </div>
                  <div className="p-2 rounded-xl glass-panel">
                    <span className="text-gray-400 text-[10px]">Total Stars</span>
                    <p className="font-bold text-amber-500">{githubResult.totalStars}</p>
                  </div>
                  <div className="p-2 rounded-xl glass-panel">
                    <span className="text-gray-400 text-[10px]">Top Language</span>
                    <p className="font-bold text-emerald-500">{githubResult.topLanguages?.[0]?.language || 'Code'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* CAREER PASSPORT SETTINGS */}
            <div className="flex flex-col gap-3">
              <h3 className="font-bold text-xs text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">
                <FiShield size={16} /> Public Career Passport Settings
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400">Custom Passport URL Slug</label>
                  <input
                    type="text"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    placeholder="my-portfolio-slug"
                    className="glass-input text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400">Privacy Visibility</label>
                  <select
                    value={isPassportPublic ? 'public' : 'private'}
                    onChange={(e) => setIsPassportPublic(e.target.value === 'public')}
                    className="glass-input bg-transparent text-xs"
                  >
                    <option value="public" className="dark:bg-gray-900">Public (Recruiters & Peers Can View)</option>
                    <option value="private" className="dark:bg-gray-900">Private (Only You Can View)</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Custom Bio for Passport</label>
                <textarea
                  rows={2}
                  value={customBio}
                  onChange={(e) => setCustomBio(e.target.value)}
                  placeholder="Tell recruiters about your passions, preferred technologies, and engineering mindset..."
                  className="glass-input text-xs resize-none"
                />
              </div>
            </div>

            {/* ACADEMIC FIELDS */}
            <div className="flex flex-col gap-3 pt-2">
              <h3 className="font-bold text-xs text-indigo-500 uppercase tracking-wider">Academic & Career Goals</h3>
              
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
                <label className="text-xs font-semibold text-gray-400">Tracked Skills (Comma Separated)</label>
                <input
                  type="text"
                  placeholder="HTML, CSS, JavaScript, React, Node.js, Docker"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  className="glass-input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400">Career Goal Target</label>
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
            </div>
          </div>
        )}

        {/* MENTOR SPECIFIC PROFILE FORM */}
        {user?.role === 'mentor' && (
          <div className="flex flex-col gap-4 border-t border-gray-200/50 dark:border-gray-800/50 pt-6">
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
            'Save Profile & Passport'
          )}
        </button>

      </form>
    </div>
  );
};

export default UserProfile;
