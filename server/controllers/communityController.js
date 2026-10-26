const Community = require('../models/Community');
const CommunityPost = require('../models/CommunityPost');
const Report = require('../models/Report');
const User = require('../models/User');

// Helper: Safely extract ID whether subdocument is populated or raw ObjectId
const getUserId = (u) => {
  if (!u) return '';
  return (u._id || u).toString();
};

// Helper: Check membership within a community document
const getCommunityMember = (community, userId) => {
  if (!community || !userId) return null;
  const targetId = userId.toString();
  return community.members.find(
    (m) => m.user && getUserId(m.user) === targetId
  ) || null;
};

// Helper: Check if user is owner, moderator or platform admin
const isStaffOrAdmin = (community, user) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const member = getCommunityMember(community, user._id);
  return !!(member && (member.role === 'owner' || member.role === 'moderator'));
};

// Helper: Resolve community by ID or slug
const resolveCommunity = async (idOrSlug) => {
  if (!idOrSlug) return null;
  const str = String(idOrSlug).trim();
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(str);
  if (isObjectId) {
    const community = await Community.findById(str);
    if (community) return community;
  }
  return await Community.findOne({ slug: str.toLowerCase() });
};

// Helper: Slugify title
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

// @desc    List and search communities
// @route   GET /api/communities
// @access  Public (Optional Auth for membership status)
exports.getCommunities = async (req, res, next) => {
  try {
    const { search, category, filter, page = 1, limit = 12 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: regex }, { description: regex }];
    }

    // Filter by membership if user is authenticated
    if (req.user && filter) {
      if (filter === 'joined') {
        query['members.user'] = req.user._id;
      } else if (filter === 'my') {
        query.creator = req.user._id;
      }
    }

    const total = await Community.countDocuments(query);
    const communities = await Community.find(query)
      .populate('creator', 'name profileImage role mentorProfile')
      .sort({ memberCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Attach contextual membership flags without leaking private members list
    const sanitized = communities.map((c) => {
      let isMember = false;
      let userRole = null;
      let hasPendingRequest = false;

      if (req.user) {
        const userIdStr = req.user._id.toString();
        const member = (c.members || []).find(
          (m) => m.user && getUserId(m.user) === userIdStr
        );
        if (member) {
          isMember = true;
          userRole = member.role;
        } else if (c.isPrivate) {
          const reqItem = (c.joinRequests || []).find(
            (r) => r.user && getUserId(r.user) === userIdStr && r.status === 'pending'
          );
          if (reqItem) hasPendingRequest = true;
        }
      }

      const { joinRequests, members, ...cleanCommunity } = c;
      return {
        ...cleanCommunity,
        isMember,
        userRole: userRole || (req.user?.role === 'admin' ? 'admin' : null),
        hasPendingRequest
      };
    });

    res.status(200).json({
      success: true,
      communities: sanitized,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new community
// @route   POST /api/communities
// @access  Private
exports.createCommunity = async (req, res, next) => {
  try {
    const {
      name,
      description,
      category,
      isPrivate = false,
      rules = [],
      isMentorLed = false,
      avatar = '🌐',
      coverImage = ''
    } = req.body;

    if (!name || name.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Community name is required (minimum 3 characters)'
      });
    }

    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Community description is required'
      });
    }

    // Rule 6: Mentors must be approved by an administrator before creating official mentor-led communities
    if (isMentorLed) {
      if (req.user.role === 'student') {
        return res.status(403).json({
          success: false,
          message: 'Only approved mentors or administrators can create official mentor-led communities.'
        });
      }
      if (req.user.role === 'mentor' && !req.user.mentorProfile?.isApproved) {
        return res.status(403).json({
          success: false,
          message: 'Mentors must be approved by an administrator before creating or hosting official mentor-led communities.'
        });
      }
    } else if (req.user.role === 'mentor' && !req.user.mentorProfile?.isApproved) {
      return res.status(403).json({
        success: false,
        message: 'Mentors must be approved by an administrator before creating or hosting official mentor-led communities.'
      });
    }

    // Generate unique slug
    let baseSlug = slugify(name);
    if (!baseSlug) baseSlug = 'community';
    let slug = baseSlug;
    let counter = 1;
    while (await Community.findOne({ slug })) {
      slug = `${baseSlug}-${counter++}`;
    }

    // Creator is automatically owner
    const community = await Community.create({
      name: name.trim(),
      slug,
      description: description.trim(),
      category: category || 'General',
      isPrivate: !!isPrivate,
      rules: Array.isArray(rules) ? rules.map((r) => r.trim()).filter(Boolean) : [],
      isMentorLed: req.user.role === 'mentor' ? true : !!isMentorLed,
      avatar: avatar || '🌐',
      coverImage: coverImage || '',
      creator: req.user._id,
      memberCount: 1,
      postCount: 0,
      members: [
        {
          user: req.user._id,
          role: 'owner',
          joinedAt: new Date()
        }
      ],
      joinRequests: []
    });

    res.status(201).json({
      success: true,
      message: 'Community created successfully',
      community
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single community details & user membership status
// @route   GET /api/communities/:idOrSlug
// @access  Public (Optional Auth)
exports.getCommunity = async (req, res, next) => {
  try {
    const community = await resolveCommunity(req.params.idOrSlug);
    if (!community) {
      return res.status(404).json({
        success: false,
        message: 'Community not found'
      });
    }

    await community.populate('creator', 'name profileImage role');
    await community.populate('members.user', 'name profileImage role');

    let isMember = false;
    let userRole = null;
    let hasPendingRequest = false;
    let pendingRequestsCount = 0;

    if (req.user) {
      const userIdStr = req.user._id.toString();
      const member = community.members.find(
        (m) => m.user && getUserId(m.user) === userIdStr
      );

      if (member) {
        isMember = true;
        userRole = member.role;
      } else if (community.isPrivate) {
        const reqItem = community.joinRequests.find(
          (r) => r.user && getUserId(r.user) === userIdStr && r.status === 'pending'
        );
        if (reqItem) hasPendingRequest = true;
      }

      if (req.user.role === 'admin' && !userRole) {
        userRole = 'admin';
      }

      // If user is owner/mod/admin, calculate pending requests
      if (userRole === 'owner' || userRole === 'moderator' || req.user.role === 'admin') {
        pendingRequestsCount = (community.joinRequests || []).filter(
          (r) => r.status === 'pending'
        ).length;
      }
    }

    // Non-members of private communities only see basic profile info
    if (community.isPrivate && !isMember && req.user?.role !== 'admin') {
      return res.status(200).json({
        success: true,
        community: {
          _id: community._id,
          name: community.name,
          slug: community.slug,
          description: community.description,
          category: community.category,
          avatar: community.avatar,
          coverImage: community.coverImage,
          isPrivate: true,
          isMentorLed: community.isMentorLed,
          creator: community.creator,
          memberCount: community.memberCount,
          postCount: community.postCount,
          rules: community.rules,
          isMember: false,
          userRole: null,
          hasPendingRequest,
          createdAt: community.createdAt
        }
      });
    }

    const { joinRequests, ...cleanObj } = community.toObject();

    res.status(200).json({
      success: true,
      community: {
        ...cleanObj,
        isMember,
        userRole,
        hasPendingRequest,
        pendingRequestsCount
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update community settings (Owner or Platform Admin only)
// @route   PATCH /api/communities/:id
// @access  Private
exports.updateCommunity = async (req, res, next) => {
  try {
    const community = await resolveCommunity(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    const member = getCommunityMember(community, req.user._id);
    const isOwner = member && member.role === 'owner';
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the community owner or an administrator can update community settings'
      });
    }

    const { name, description, category, isPrivate, rules, avatar, coverImage } = req.body;

    if (name && name.trim()) community.name = name.trim();
    if (description && description.trim()) community.description = description.trim();
    if (category) community.category = category;
    if (typeof isPrivate === 'boolean') community.isPrivate = isPrivate;
    if (Array.isArray(rules)) community.rules = rules.map((r) => r.trim()).filter(Boolean);
    if (avatar) community.avatar = avatar;
    if (coverImage !== undefined) community.coverImage = coverImage;

    await community.save();

    res.status(200).json({
      success: true,
      message: 'Community settings updated successfully',
      community
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Join a public community directly
// @route   POST /api/communities/:id/join
// @access  Private
exports.joinPublicCommunity = async (req, res, next) => {
  try {
    const community = await resolveCommunity(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    if (community.isPrivate) {
      return res.status(400).json({
        success: false,
        message: 'This community is private. Please submit a join request instead.'
      });
    }

    const existingMember = getCommunityMember(community, req.user._id);
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this community'
      });
    }

    community.members.push({
      user: req.user._id,
      role: 'member',
      joinedAt: new Date()
    });
    community.memberCount = community.members.length;

    await community.save();

    res.status(200).json({
      success: true,
      message: `You have successfully joined ${community.name}!`,
      memberCount: community.memberCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request access to a private community
// @route   POST /api/communities/:id/request-join
// @access  Private
exports.requestJoinPrivateCommunity = async (req, res, next) => {
  try {
    const community = await resolveCommunity(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    // If community is public, automatically join
    if (!community.isPrivate) {
      const existingMember = getCommunityMember(community, req.user._id);
      if (existingMember) {
        return res.status(400).json({ success: false, message: 'Already a member' });
      }
      community.members.push({ user: req.user._id, role: 'member', joinedAt: new Date() });
      community.memberCount = community.members.length;
      await community.save();
      return res.status(200).json({ success: true, message: 'Joined public community successfully' });
    }

    const existingMember = getCommunityMember(community, req.user._id);
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'You are already an approved member of this community'
      });
    }

    const existingRequest = community.joinRequests.find(
      (r) => r.user && getUserId(r.user) === req.user._id.toString() && r.status === 'pending'
    );
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending join request for this community'
      });
    }

    community.joinRequests.push({
      user: req.user._id,
      status: 'pending',
      requestMessage: req.body.requestMessage || '',
      requestedAt: new Date()
    });

    await community.save();

    res.status(200).json({
      success: true,
      message: 'Join request submitted successfully. Awaiting moderator review.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List pending join requests (Owner, Moderator or Admin only)
// @route   GET /api/communities/:id/requests
// @access  Private
exports.getJoinRequests = async (req, res, next) => {
  try {
    const community = await resolveCommunity(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    if (!isStaffOrAdmin(community, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: moderator or owner privileges required'
      });
    }

    await community.populate('joinRequests.user', 'name email profileImage role studentProfile');

    const pendingRequests = community.joinRequests.filter((r) => r.status === 'pending');

    res.status(200).json({
      success: true,
      requests: pendingRequests
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject a join request
// @route   POST /api/communities/:id/requests/:requestId/review
// @access  Private
exports.reviewJoinRequest = async (req, res, next) => {
  try {
    const { action } = req.body; // 'approve' | 'reject'
    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be 'approve' or 'reject'"
      });
    }

    const community = await resolveCommunity(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    if (!isStaffOrAdmin(community, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: moderator or owner privileges required'
      });
    }

    const requestItem = community.joinRequests.id(req.params.requestId);
    if (!requestItem) {
      return res.status(404).json({ success: false, message: 'Join request not found' });
    }

    if (requestItem.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `This request has already been ${requestItem.status}`
      });
    }

    requestItem.status = action === 'approve' ? 'approved' : 'rejected';
    requestItem.reviewedBy = req.user._id;
    requestItem.reviewedAt = new Date();

    if (action === 'approve') {
      const targetUserId = requestItem.user?._id || requestItem.user;
      const alreadyMember = getCommunityMember(community, targetUserId);
      if (!alreadyMember) {
        community.members.push({
          user: targetUserId,
          role: 'member',
          joinedAt: new Date()
        });
        community.memberCount = community.members.length;
      }
    }

    await community.save();

    res.status(200).json({
      success: true,
      message: `Join request successfully ${requestItem.status}!`,
      memberCount: community.memberCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Leave a community
// @route   POST /api/communities/:id/leave
// @access  Private
exports.leaveCommunity = async (req, res, next) => {
  try {
    const community = await resolveCommunity(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    const member = getCommunityMember(community, req.user._id);
    if (!member) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this community'
      });
    }

    // Owner cannot abandon community if there are other members
    if (member.role === 'owner') {
      if (community.members.length > 1) {
        return res.status(400).json({
          success: false,
          message: 'Community owner cannot leave without transferring ownership first'
        });
      }
    }

    community.members = community.members.filter(
      (m) => m.user && getUserId(m.user) !== req.user._id.toString()
    );
    community.memberCount = community.members.length;

    await community.save();

    res.status(200).json({
      success: true,
      message: `You have left ${community.name}`,
      memberCount: community.memberCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a member's community-scoped role (Owner or Platform Admin only)
// @route   PATCH /api/communities/:id/members/:userId/role
// @access  Private
exports.updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role || !['moderator', 'member'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid role. Role can be promoted to 'moderator' or demoted to 'member'"
      });
    }

    const community = await resolveCommunity(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    const currentMember = getCommunityMember(community, req.user._id);
    const isOwner = currentMember && currentMember.role === 'owner';
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the community owner or an administrator can manage member roles'
      });
    }

    const targetMember = getCommunityMember(community, req.params.userId);
    if (!targetMember) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this community'
      });
    }

    if (targetMember.role === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify owner role through this endpoint'
      });
    }

    targetMember.role = role;
    await community.save();

    res.status(200).json({
      success: true,
      message: `Member role successfully updated to ${role}`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a member from community (Staff or Admin only)
// @route   DELETE /api/communities/:id/members/:userId
// @access  Private
exports.removeMember = async (req, res, next) => {
  try {
    const community = await resolveCommunity(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    const currentMember = getCommunityMember(community, req.user._id);
    const isOwner = currentMember && currentMember.role === 'owner';
    const isMod = currentMember && currentMember.role === 'moderator';
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isMod && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: moderator privileges required'
      });
    }

    const targetMember = getCommunityMember(community, req.params.userId);
    if (!targetMember) {
      return res.status(404).json({
        success: false,
        message: 'Target user is not a member of this community'
      });
    }

    // Moderators cannot remove owners or other moderators
    if (isMod && !isOwner && !isAdmin) {
      if (targetMember.role === 'owner' || targetMember.role === 'moderator') {
        return res.status(403).json({
          success: false,
          message: 'Moderators cannot remove community owners or other moderators'
        });
      }
    }

    if (targetMember.role === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the community owner'
      });
    }

    community.members = community.members.filter(
      (m) => m.user && getUserId(m.user) !== req.params.userId.toString()
    );
    community.memberCount = community.members.length;
    await community.save();

    res.status(200).json({
      success: true,
      message: 'Member removed from community',
      memberCount: community.memberCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get top-level posts for a community
// @route   GET /api/communities/:id/posts
// @access  Public for public communities, Private for private communities
exports.getPosts = async (req, res, next) => {
  try {
    const community = await resolveCommunity(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    // If private, restrict to approved members & admin
    if (community.isPrivate) {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      const isMember = getCommunityMember(community, req.user._id);
      if (!isMember && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'You must be a member of this private community to view posts'
        });
      }
    }

    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(30, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const query = {
      community: community._id,
      parentPost: null,
      isDeleted: false
    };

    const total = await CommunityPost.countDocuments(query);
    const posts = await CommunityPost.find(query)
      .populate('author', 'name profileImage role studentProfile mentorProfile')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const enriched = posts.map((p) => ({
      ...p,
      hasLiked: req.user ? (p.likes || []).some((uid) => uid.toString() === req.user._id.toString()) : false,
      likeCount: (p.likes || []).length
    }));

    res.status(200).json({
      success: true,
      posts: enriched,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a top-level post in a community
// @route   POST /api/communities/:id/posts
// @access  Private (Approved members only)
exports.createPost = async (req, res, next) => {
  try {
    const community = await resolveCommunity(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    const isMember = getCommunityMember(community, req.user._id);
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You must join this community before creating posts'
      });
    }

    const { title = '', content, attachments = [] } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Post content cannot be empty' });
    }

    const post = await CommunityPost.create({
      community: community._id,
      author: req.user._id,
      title: title.trim(),
      content: content.trim(),
      attachments: Array.isArray(attachments) ? attachments : [],
      parentPost: null
    });

    community.postCount = (community.postCount || 0) + 1;
    await community.save();

    await post.populate('author', 'name profileImage role');

    res.status(201).json({
      success: true,
      message: 'Post published successfully',
      post
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get threaded replies for a post
// @route   GET /api/communities/:id/posts/:postId/replies
// @access  Public / Private matching community
exports.getPostReplies = async (req, res, next) => {
  try {
    const community = await resolveCommunity(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    if (community.isPrivate) {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      const isMember = getCommunityMember(community, req.user._id);
      if (!isMember && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    // Verify parent post and IDOR cross-community isolation
    const parentPost = await CommunityPost.findById(req.params.postId);
    if (!parentPost) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (parentPost.community.toString() !== community._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Security validation error: post does not belong to specified community'
      });
    }

    const replies = await CommunityPost.find({
      community: community._id,
      parentPost: parentPost._id,
      isDeleted: false
    })
      .populate('author', 'name profileImage role')
      .sort({ createdAt: 1 })
      .lean();

    const enriched = replies.map((r) => ({
      ...r,
      hasLiked: req.user ? (r.likes || []).some((uid) => uid.toString() === req.user._id.toString()) : false,
      likeCount: (r.likes || []).length
    }));

    res.status(200).json({
      success: true,
      replies: enriched
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a nested threaded reply
// @route   POST /api/communities/:id/posts/:postId/replies
// @access  Private (Approved members only)
exports.createPostReply = async (req, res, next) => {
  try {
    const community = await resolveCommunity(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    const isMember = getCommunityMember(community, req.user._id);
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You must join this community before replying to discussions'
      });
    }

    // IDOR Check
    const parentPost = await CommunityPost.findById(req.params.postId);
    if (!parentPost) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (parentPost.community.toString() !== community._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Security validation error: cross-community reply rejected'
      });
    }

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Reply content cannot be empty' });
    }

    const reply = await CommunityPost.create({
      community: community._id,
      author: req.user._id,
      content: content.trim(),
      parentPost: parentPost._id
    });

    parentPost.replyCount = (parentPost.replyCount || 0) + 1;
    await parentPost.save();

    community.postCount = (community.postCount || 0) + 1;
    await community.save();

    await reply.populate('author', 'name profileImage role');

    res.status(201).json({
      success: true,
      message: 'Reply posted',
      reply
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Edit post (Author only)
// @route   PATCH /api/communities/:id/posts/:postId
// @access  Private
exports.updatePost = async (req, res, next) => {
  try {
    const community = await resolveCommunity(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    const post = await CommunityPost.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // IDOR Check
    if (post.community.toString() !== community._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cross-community post operation rejected' });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only edit your own posts' });
    }

    const { title, content } = req.body;
    if (content !== undefined) {
      if (!content.trim()) return res.status(400).json({ success: false, message: 'Content cannot be empty' });
      post.content = content.trim();
    }
    if (title !== undefined) post.title = title.trim();

    post.isEdited = true;
    post.editedAt = new Date();

    await post.save();

    res.status(200).json({
      success: true,
      message: 'Post updated successfully',
      post
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete post (Author or Community Staff or Platform Admin)
// @route   DELETE /api/communities/:id/posts/:postId
// @access  Private
exports.deletePost = async (req, res, next) => {
  try {
    const community = await resolveCommunity(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    const post = await CommunityPost.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    // IDOR Check
    if (post.community.toString() !== community._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cross-community post operation rejected' });
    }

    const isAuthor = post.author.toString() === req.user._id.toString();
    const isStaff = isStaffOrAdmin(community, req.user);

    if (!isAuthor && !isStaff) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this post'
      });
    }

    post.isDeleted = true;
    post.deletedAt = new Date();
    post.deletedBy = req.user._id;
    await post.save();

    if (post.parentPost) {
      const parent = await CommunityPost.findById(post.parentPost);
      if (parent) {
        parent.replyCount = Math.max(0, (parent.replyCount || 1) - 1);
        await parent.save();
      }
    }

    community.postCount = Math.max(0, (community.postCount || 1) - 1);
    await community.save();

    res.status(200).json({
      success: true,
      message: 'Post deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle post like
// @route   POST /api/communities/:id/posts/:postId/like
// @access  Private
exports.togglePostLike = async (req, res, next) => {
  try {
    const community = await resolveCommunity(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    if (community.isPrivate) {
      const isMember = getCommunityMember(community, req.user._id);
      if (!isMember && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
    }

    const post = await CommunityPost.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.community.toString() !== community._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cross-community post operation rejected' });
    }

    const userIdStr = req.user._id.toString();
    const existingIndex = post.likes.findIndex((uid) => uid.toString() === userIdStr);

    let hasLiked = false;
    if (existingIndex > -1) {
      post.likes.splice(existingIndex, 1);
      hasLiked = false;
    } else {
      post.likes.push(req.user._id);
      hasLiked = true;
    }

    await post.save();

    res.status(200).json({
      success: true,
      hasLiked,
      likeCount: post.likes.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit content / user moderation report
// @route   POST /api/communities/:id/report
// @access  Private
exports.reportItem = async (req, res, next) => {
  try {
    const community = await resolveCommunity(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    const { targetType, targetId, reason, description } = req.body;

    if (!targetType || !['Community', 'CommunityPost', 'User'].includes(targetType)) {
      return res.status(400).json({ success: false, message: 'Invalid target type' });
    }

    if (!targetId) {
      return res.status(400).json({ success: false, message: 'Target ID is required' });
    }

    if (!reason || !['spam', 'harassment', 'inappropriate_content', 'hate_speech', 'misinformation', 'other'].includes(reason)) {
      return res.status(400).json({ success: false, message: 'Valid report reason is required' });
    }

    // Verify target belongs to this community (cross-community report isolation)
    if (targetType === 'CommunityPost') {
      const targetPost = await CommunityPost.findById(targetId);
      if (!targetPost) {
        return res.status(404).json({ success: false, message: 'Reported post not found' });
      }
      if (targetPost.community.toString() !== community._id.toString()) {
        return res.status(400).json({ success: false, message: 'Reported post does not belong to this community' });
      }
    } else if (targetType === 'Community') {
      if (targetId.toString() !== community._id.toString()) {
        return res.status(400).json({ success: false, message: 'Report target community mismatch' });
      }
    }

    const report = await Report.create({
      reporter: req.user._id,
      targetType,
      targetId,
      community: community._id,
      reason,
      description: description ? description.trim() : ''
    });

    res.status(201).json({
      success: true,
      message: 'Report submitted for moderator review. Thank you for keeping CareerNest safe.',
      reportId: report._id
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List moderation reports for a community (Staff or Admin only)
// @route   GET /api/communities/:id/reports
// @access  Private
exports.getCommunityReports = async (req, res, next) => {
  try {
    const community = await resolveCommunity(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    if (!isStaffOrAdmin(community, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: moderator privileges required'
      });
    }

    const { status = 'pending' } = req.query;
    const query = { community: community._id };
    if (status && status !== 'all') {
      query.status = status;
    }

    const reports = await Report.find(query)
      .populate('reporter', 'name email profileImage')
      .populate('reviewedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      reports
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Review and resolve moderation report
// @route   PATCH /api/communities/:id/reports/:reportId
// @access  Private (Staff or Admin only)
exports.reviewReport = async (req, res, next) => {
  try {
    const community = await resolveCommunity(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    if (!isStaffOrAdmin(community, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: moderator privileges required'
      });
    }

    const report = await Report.findById(req.params.reportId);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (report.community && report.community.toString() !== community._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cross-community report review rejected' });
    }

    const { status, moderationAction, moderationNotes } = req.body;

    if (status && ['reviewed', 'resolved', 'dismissed'].includes(status)) {
      report.status = status;
    }
    if (moderationAction) {
      report.moderationAction = moderationAction;
    }
    if (moderationNotes) {
      report.moderationNotes = moderationNotes;
    }

    report.reviewedBy = req.user._id;
    report.reviewedAt = new Date();

    // If moderation action is to remove content and target is post:
    if (moderationAction === 'content_removed' && report.targetType === 'CommunityPost') {
      const post = await CommunityPost.findById(report.targetId);
      if (post) {
        post.isDeleted = true;
        post.deletedAt = new Date();
        post.deletedBy = req.user._id;
        await post.save();
        community.postCount = Math.max(0, (community.postCount || 1) - 1);
        await community.save();
      }
    }

    await report.save();

    res.status(200).json({
      success: true,
      message: `Report status updated to ${report.status}`,
      report
    });
  } catch (error) {
    next(error);
  }
};
