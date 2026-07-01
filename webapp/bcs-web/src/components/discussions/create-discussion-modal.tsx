// components/discussions/create-discussion-modal.tsx
'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare } from 'lucide-react';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

interface CreateDiscussionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscussionCreated: () => void;
}

const CreateDiscussionModal: React.FC<CreateDiscussionModalProps> = ({
  isOpen,
  onClose,
  onDiscussionCreated
}) => {
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !comment.trim()) {
      toast.error('দয়া করে শিরোনাম এবং আলোচনা লিখুন');
      return;
    }

    try {
      setLoading(true);
      
      const formData = {
        title: title.trim(),
        comment: comment.trim()
      };

      console.log("Creating discussion with data:", formData);

      const response = await apiClient.post('/discussions/', formData);
      console.log("Discussion created:", response);

      toast.success('আলোচনা সফলভাবে তৈরি হয়েছে!');
      setTitle('');
      setComment('');
      onDiscussionCreated();
      onClose();
    } catch (error: any) {
      console.error('Error creating discussion:', error);
      
      if (error.response?.data) {
        const errorMessages = Object.values(error.response.data).flat();
        toast.error(`ত্রুটি: ${errorMessages.join(', ')}`);
      } else {
        toast.error('আলোচনা তৈরি করতে সমস্যা হয়েছে');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setComment('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 font-bengali">
                    নতুন আলোচনা শুরু করুন
                  </h2>
                  <p className="text-sm text-gray-600">যেকোনো বিষয়ে আলোচনা শুরু করুন</p>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Title Input */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 font-bengali">
                  শিরোনাম *
                </label>
                <input
                  type="text"
                  placeholder="আলোচনার শিরোনাম লিখুন (যেমন: গণিতের একটি সমস্যা, ইংরেজি ব্যাকরণ ইত্যাদি)"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bengali"
                  required
                />
                <p className="text-xs text-gray-500 font-bengali">
                  একটি স্পষ্ট এবং বর্ণনামূলক শিরোনাম দিন
                </p>
              </div>

              {/* Comment Input */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 font-bengali">
                  আপনার আলোচনা *
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="আপনার প্রশ্ন, মতামত, বা আলোচনা বিস্তারিত লিখুন..."
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none font-bengali"
                  required
                />
                <p className="text-xs text-gray-500 font-bengali">
                  বিস্তারিত লিখলে অন্যরা আপনাকে ভালোভাবে সাহায্য করতে পারবে
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-bengali"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || !comment.trim() || loading}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-green-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-green-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-bengali"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'পোস্ট হচ্ছে...' : 'আলোচনা শুরু করুন'}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateDiscussionModal;