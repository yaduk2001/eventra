'use client';

import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share, MoreHorizontal, Bookmark, Send } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const SocialFeed = () => {
  const { user, userProfile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [commentingOn, setCommentingOn] = useState(null);

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/social/feed', {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPosts(data.data);
      }
    } catch (error) {
      console.error('Error loading feed:', error);
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const likePost = async (postId) => {
    try {
      const response = await fetch(`/api/social/post/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, isLiked: data.data.isLiked, likeCount: data.data.likeCount }
            : post
        ));
      }
    } catch (error) {
      console.error('Error liking post:', error);
      toast.error('Failed to like post');
    }
  };

  const addComment = async (postId) => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`/api/social/post/${postId}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await user.getIdToken()}`
        },
        body: JSON.stringify({ content: newComment.trim() })
      });
      const data = await response.json();
      if (data.success) {
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, comments: [...post.comments, data.data.comment], commentCount: data.data.commentCount }
            : post
        ));
        setNewComment('');
        setCommentingOn(null);
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  const sharePost = async (postId) => {
    try {
      const response = await fetch(`/api/social/post/${postId}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, shares: data.data.shareCount }
            : post
        ));
        toast.success('Post shared!');
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      toast.error('Failed to share post');
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInHours = Math.floor((now - postTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - postTime) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {posts.map((post) => (
        <div key={post.id} className="bg-white rounded-lg shadow-sm border">
          {/* Post Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {post.userName?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{post.userName}</h3>
                <p className="text-sm text-gray-500">{formatTime(post.createdAt)}</p>
              </div>
            </div>
            <button className="p-2 text-gray-600 hover:text-gray-800 rounded-full transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Post Content */}
          {post.content && (
            <div className="px-4 pb-3">
              <p className="text-gray-900">{post.content}</p>
            </div>
          )}

          {/* Post Media */}
          {post.media && post.media.length > 0 && (
            <div className="relative">
              {post.type === 'image' && (
                <img
                  src={post.media[0].url}
                  alt="Post content"
                  className="w-full h-auto max-h-96 object-cover"
                />
              )}
              {post.type === 'video' && (
                <video
                  src={post.media[0].url}
                  controls
                  className="w-full h-auto max-h-96"
                />
              )}
              {post.type === 'carousel' && post.media.length > 1 && (
                <div className="relative">
                  <img
                    src={post.media[0].url}
                    alt="Post content"
                    className="w-full h-auto max-h-96 object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                    1/{post.media.length}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Post Actions */}
          <div className="px-4 py-3 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => likePost(post.id)}
                  className={`flex items-center space-x-2 transition-colors ${
                    post.isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${post.isLiked ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">{post.likeCount}</span>
                </button>
                <button
                  onClick={() => setCommentingOn(commentingOn === post.id ? null : post.id)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors"
                >
                  <MessageCircle className="w-6 h-6" />
                  <span className="text-sm font-medium">{post.commentCount}</span>
                </button>
                <button
                  onClick={() => sharePost(post.id)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-green-500 transition-colors"
                >
                  <Share className="w-6 h-6" />
                  <span className="text-sm font-medium">{post.shares || 0}</span>
                </button>
              </div>
              <button className="text-gray-600 hover:text-gray-800 transition-colors">
                <Bookmark className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Comments Section */}
          {commentingOn === post.id && (
            <div className="px-4 py-3 border-t bg-gray-50">
              {/* Existing Comments */}
              {post.comments && post.comments.length > 0 && (
                <div className="space-y-2 mb-3">
                  {post.comments.slice(0, 3).map((comment, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-xs font-semibold">
                        {comment.userName?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-semibold text-gray-900">{comment.userName}</span>
                          <span className="text-gray-900 ml-2">{comment.content}</span>
                        </p>
                        <p className="text-xs text-gray-500">{formatTime(comment.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                  {post.comments.length > 3 && (
                    <button className="text-sm text-gray-500 hover:text-gray-700">
                      View all {post.comments.length} comments
                    </button>
                  )}
                </div>
              )}

              {/* Add Comment */}
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  {userProfile?.name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1 flex items-center space-x-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        addComment(post.id);
                      }
                    }}
                  />
                  <button
                    onClick={() => addComment(post.id)}
                    disabled={!newComment.trim()}
                    className="p-2 text-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}

      {posts.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Heart className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
          <p className="text-gray-500">Be the first to share something amazing!</p>
        </div>
      )}
    </div>
  );
};

export default SocialFeed;
