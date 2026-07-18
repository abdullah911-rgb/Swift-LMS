import { getImageUrl } from '../../constants/index';
import React, { useEffect, useState } from 'react';
import Card from '../../components/ui/Card';
import { adminService } from '../../services/portalService';
import toast from 'react-hot-toast';
import {
  IoBookOutline,
  IoLayersOutline,
  IoPersonOutline,
  IoSearchOutline,
  IoRefreshOutline,
  IoTrashOutline,
  IoCheckmarkCircleOutline,
  IoTimeOutline,
  IoArchiveOutline,
  IoEyeOffOutline,
} from 'react-icons/io5';

const statusBadge = {
  PUBLISHED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  DRAFT: 'bg-slate-50 text-slate-500 border-slate-200',
  ARCHIVED: 'bg-red-50 text-red-600 border-red-100',
};

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [actionId, setActionId] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });

  const fetchCourses = async (page = 1) => {
    setLoading(true);
    try {
      const res = await adminService.getAllCourses({ search, status: statusFilter, page, limit: 12 });
      if (res.data?.data) {
        setCourses(res.data.data.courses);
        setPagination(res.data.data.pagination);
      }
    } catch (err) {
      toast.error('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, [search, statusFilter]);

  const handleTogglePublish = async (courseId, currentStatus) => {
    setActionId(courseId);
    try {
      await adminService.togglePublish(courseId);
      toast.success(currentStatus === 'PUBLISHED' ? 'Course unpublished.' : 'Course published!');
      setCourses((prev) =>
        prev.map((c) =>
          c.id === courseId
            ? { ...c, status: currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' }
            : c
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-primary-900">Course Management</h1>
          <p className="text-sm text-slate-500 mt-1">{pagination.total} total courses on the platform.</p>
        </div>
        <button
          onClick={() => fetchCourses()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-all cursor-pointer"
        >
          <IoRefreshOutline size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <IoSearchOutline size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses or instructors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-100 bg-white focus:outline-none focus:border-primary-300"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-100 bg-white text-sm focus:outline-none focus:border-primary-300"
        >
          <option value="">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-white border border-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card hover={false} className="bg-white border border-slate-100 p-16 text-center">
          <IoBookOutline size={40} className="mx-auto mb-2 text-slate-200" />
          <p className="text-sm text-slate-400">No courses found.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <Card key={course.id} hover={false} className="bg-white border border-slate-100 rounded-2xl overflow-hidden flex flex-col">
              {/* Thumbnail */}
              <div className="relative h-36 bg-slate-50">
                {course.thumbnail ? (
                  <img
                    src={getImageUrl(course.thumbnail)}
                    alt={course.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <IoBookOutline size={36} className="text-slate-200" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${statusBadge[course.status] || statusBadge.DRAFT}`}>
                    {course.status}
                  </span>
                  {course.pendingApproval && (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <IoTimeOutline size={9} /> Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="text-sm font-heading font-bold text-slate-900 line-clamp-2 leading-snug">{course.title}</h3>
                  <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
                    <IoPersonOutline size={12} />
                    <span>{course.instructor?.name}</span>
                    <span className="text-slate-300">·</span>
                    <IoLayersOutline size={12} />
                    <span>{course._count?.modules} modules</span>
                    <span className="text-slate-300">·</span>
                    <span>{course._count?.enrollments} enrolled</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-50 border border-primary-100 text-primary-700">
                      {course.category?.name}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-slate-600">
                      {course.level}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-50">
                  <button
                    onClick={() => handleTogglePublish(course.id, course.status)}
                    disabled={actionId === course.id}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer disabled:opacity-50 ${
                      course.status === 'PUBLISHED'
                        ? 'border-amber-100 text-amber-700 bg-amber-50 hover:bg-amber-100'
                        : 'border-emerald-100 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    {course.status === 'PUBLISHED' ? (
                      <><IoEyeOffOutline size={13} /> Unpublish</>
                    ) : (
                      <><IoCheckmarkCircleOutline size={13} /> Publish</>
                    )}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Page {pagination.page} of {pagination.totalPages}</span>
          <div className="flex gap-2">
            <button disabled={pagination.page <= 1} onClick={() => fetchCourses(pagination.page - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 disabled:opacity-40 cursor-pointer">
              ← Prev
            </button>
            <button disabled={pagination.page >= pagination.totalPages} onClick={() => fetchCourses(pagination.page + 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-100 hover:bg-slate-50 disabled:opacity-40 cursor-pointer">
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourses;
