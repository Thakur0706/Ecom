import { SERVICE_STATUS } from '../constants/enums.js';
import { Service } from '../models/Service.js';
import { AppError, sendResponse } from '../utils/http.js';
import { buildPagination, getPagination } from '../utils/pagination.js';

function getServiceSort(sort) {
  if (sort === 'price-asc') {
    return { price: 1, createdAt: -1 };
  }

  if (sort === 'price-desc') {
    return { price: -1, createdAt: -1 };
  }

  if (sort === 'rating') {
    return { averageRating: -1, reviewCount: -1, createdAt: -1 };
  }

  return { createdAt: -1 };
}

function serializeService(service) {
  if (!service) {
    return null;
  }

  return {
    id: service._id,
    title: service.title,
    description: service.description,
    category: service.category,
    price: service.price,
    imageUrl: service.imageUrl,
    availability: service.availability,
    duration: service.duration,
    status: service.status,
    isFeatured: service.isFeatured,
    averageRating: service.averageRating,
    reviewCount: service.reviewCount,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  };
}

export async function getServices(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {
    status: SERVICE_STATUS.ACTIVE,
  };

  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { description: { $regex: req.query.search, $options: 'i' } },
      { category: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  if (req.query.category) {
    filter.category = req.query.category;
  }

  const [services, total] = await Promise.all([
    Service.find(filter).sort(getServiceSort(req.query.sort)).skip(skip).limit(limit),
    Service.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Services fetched successfully.', {
    services: services.map(serializeService),
    pagination: buildPagination(page, limit, total),
  });
}

export async function getServiceById(req, res) {
  const service = await Service.findOne({
    _id: req.params.id,
    status: SERVICE_STATUS.ACTIVE,
  });

  if (!service) {
    throw new AppError('Service not found.', 404);
  }

  return sendResponse(res, 200, true, 'Service fetched successfully.', {
    service: serializeService(service),
  });
}

export async function createService(req, res) {
  const service = await Service.create(req.body);

  return sendResponse(res, 201, true, 'Service created successfully.', {
    service: serializeService(service),
  });
}

export async function updateService(req, res) {
  const service = await Service.findById(req.params.id);

  if (!service) {
    throw new AppError('Service not found.', 404);
  }

  Object.assign(service, req.body);
  await service.save();

  return sendResponse(res, 200, true, 'Service updated successfully.', {
    service: serializeService(service),
  });
}

export async function deleteService(req, res) {
  const service = await Service.findById(req.params.id);

  if (!service) {
    throw new AppError('Service not found.', 404);
  }

  await service.deleteOne();

  return sendResponse(res, 200, true, 'Service deleted successfully.', {});
}

export async function getAdminServices(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = {};

  if (req.query.status) {
    filter.status = req.query.status;
  }

  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { category: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [services, total] = await Promise.all([
    Service.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Service.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, 'Admin services fetched successfully.', {
    services: services.map(serializeService),
    pagination: buildPagination(page, limit, total),
  });
}
