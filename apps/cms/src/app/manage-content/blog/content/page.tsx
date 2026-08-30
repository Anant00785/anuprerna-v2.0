'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, Loader2, Search } from 'lucide-react';
import { ContentService } from '@/services/content-service';

export default function BlogContentListingPage() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchBlogs = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ContentService.getBlogs();
      setBlogs(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load blog posts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    try {
      await ContentService.deleteBlog(id);
      fetchBlogs();
    } catch (err: any) {
      alert(err.message || 'Failed to delete blog');
    }
  };

  const filtered = blogs.filter(b => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      (b.title || '').toLowerCase().includes(q) ||
      (b.slug || '').toLowerCase().includes(q) ||
      (b.blogContentCategory?.name || '').toLowerCase().includes(q) ||
      (b.blogContentCategory?.blogContentType?.name || '').toLowerCase().includes(q)
    );
  });

  const formatDate = (epoch?: number) => {
    if (!epoch || epoch <= 0) return '—';
    return new Date(epoch).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6 pt-2 pb-16">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">
            ✍️
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1f2438] tracking-tight">Blog Posts</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Editorial articles &amp; journal entries ✨
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-64">
            <input
              type="text"
              placeholder="Search by title or category..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#585c82]"
            />
          </div>

          <Link
            href="/manage-content/blog/create"
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#585c82] hover:bg-[#484c70] rounded-xl shadow-xs transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Post</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl">
          {error}
        </div>
      )}

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-[#585c82] animate-spin" />
            <p className="text-xs text-slate-500 font-light tracking-wide uppercase">
              Loading blog articles...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No blog posts found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-white text-slate-400 font-bold tracking-tight">
                  <th className="py-4 px-6">🖼️ POST</th>
                  <th className="py-4 px-6">🏷️ TYPE</th>
                  <th className="py-4 px-6">📁 CATEGORY</th>
                  <th className="py-4 px-6">⏱️ READ</th>
                  <th className="py-4 px-6">📅 CREATED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(blog => {
                  const imageUrl =
                    blog.bannerImageDesktop ||
                    blog.bannerImageMobile ||
                    blog.coverImageUrl ||
                    '';
                  const typeName =
                    blog.blogContentCategory?.blogContentType?.name || 'Blogs';
                  const catName =
                    blog.blogContentCategory?.name || 'General';
                  const slugPath = `/${blog.slug || ''}/${blog.id}`;
                  const readTime = blog.readingTime ? `${blog.readingTime} min` : '5 min';

                  return (
                    <tr key={blog.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* POST (THUMBNAIL + TITLE + SLUG) */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3 max-w-xl">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={blog.title || 'Blog thumbnail'}
                              className="w-14 h-10 rounded-lg object-cover bg-slate-100 border border-slate-200/60 shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-10 rounded-lg bg-slate-100 border border-slate-200/60 flex items-center justify-center text-slate-400 shrink-0 text-sm">
                              🖼️
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-slate-900 line-clamp-1">
                              {blog.title || 'Untitled Post'}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 line-clamp-1">
                              {slugPath}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* TYPE */}
                      <td className="py-3.5 px-6 whitespace-nowrap">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#ebeff8] text-[#585c82]">
                          {typeName}
                        </span>
                      </td>

                      {/* CATEGORY */}
                      <td className="py-3.5 px-6 whitespace-nowrap text-slate-600 font-medium">
                        {catName}
                      </td>

                      {/* READ */}
                      <td className="py-3.5 px-6 whitespace-nowrap text-slate-700 font-medium">
                        {readTime}
                      </td>

                      {/* CREATED */}
                      <td className="py-3.5 px-6 whitespace-nowrap text-slate-500">
                        {formatDate(blog.timeOfCreation)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
