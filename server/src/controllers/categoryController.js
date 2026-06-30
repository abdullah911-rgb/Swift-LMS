const prisma = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const slugify = require('slugify');

const categoryController = {
  // GET /api/categories
  getAll: asyncHandler(async (req, res) => {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      include: { _count: { select: { courses: { where: { status: 'PUBLISHED' } } } } },
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, 'Categories fetched.', { categories });
  }),

  // GET /api/categories/:slug
  getOne: asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const category = await prisma.category.findUnique({
      where: { slug },
      include: { _count: { select: { courses: { where: { status: 'PUBLISHED' } } } } },
    });
    if (!category) return sendError(res, 'Category not found.', 404);
    sendSuccess(res, 'Category fetched.', { category });
  }),

  // POST /api/categories (Admin)
  create: asyncHandler(async (req, res) => {
    const { name, description, icon } = req.body;
    const slug = slugify(name, { lower: true, strict: true });
    const category = await prisma.category.create({
      data: { name, slug, description, icon },
    });
    sendSuccess(res, 'Category created.', { category }, 201);
  }),

  // PUT /api/categories/:id (Admin)
  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, icon, isActive } = req.body;
    const data = { description, icon, isActive };
    if (name) {
      data.name = name;
      data.slug = slugify(name, { lower: true, strict: true });
    }
    const category = await prisma.category.update({ where: { id }, data });
    sendSuccess(res, 'Category updated.', { category });
  }),

  // DELETE /api/categories/:id (Admin)
  delete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    await prisma.category.update({ where: { id }, data: { isActive: false } });
    sendSuccess(res, 'Category deactivated.');
  }),
};

module.exports = categoryController;
