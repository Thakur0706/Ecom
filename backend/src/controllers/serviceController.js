import { Service } from "../models/Service.js";
import { LISTING_STATUS } from "../constants/enums.js";
import { sanitizeListingCoupon } from "../utils/couponHelpers.js";
import { AppError, sendResponse } from "../utils/http.js";
import { buildPagination, getPagination } from "../utils/pagination.js";

function getServiceSort(sort) {
  if (sort === "price-asc") {
    return { price: 1, createdAt: -1 };
  }

  if (sort === "price-desc") {
    return { price: -1, createdAt: -1 };
  }

  if (sort === "rating") {
    return { averageRating: -1, createdAt: -1 };
  }

  return { createdAt: -1 };
}

function buildPublicServiceFilter(query) {
  const filter = {
    status: LISTING_STATUS.APPROVED,
    isActive: true,
  };

  if (query.search) {
    filter.$or = [
      { title: { $regex: query.search, $options: "i" } },
      { description: { $regex: query.search, $options: "i" } },
      { category: { $regex: query.search, $options: "i" } },
    ];
  }

  if (query.category) {
    filter.category = query.category;
  }

  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) {
      filter.price.$gte = Number(query.minPrice);
    }
    if (query.maxPrice) {
      filter.price.$lte = Number(query.maxPrice);
    }
  }

  return filter;
}

async function ensureOwnService(serviceId, sellerId) {
  const service = await Service.findById(serviceId);

  if (!service) {
    throw new AppError("Service not found.", 404);
  }

  if (service.sellerId.toString() !== sellerId.toString()) {
    throw new AppError("You can only manage your own services.", 403);
  }

  return service;
}

export async function getServices(req, res) {
  const filter = buildPublicServiceFilter(req.query);
  const { page, limit, skip } = getPagination(req.query);
  const [services, total] = await Promise.all([
    Service.find(filter)
      .populate("sellerId", "name profilePictureUrl")
      .sort(getServiceSort(req.query.sort))
      .skip(skip)
      .limit(limit),
    Service.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, "Services fetched successfully.", {
    services,
    pagination: buildPagination(page, limit, total),
  });
}

export async function getOwnServices(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const filter = { sellerId: req.user._id };
  const [services, total] = await Promise.all([
    Service.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Service.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, "Your services fetched successfully.", {
    services,
    pagination: buildPagination(page, limit, total),
  });
}

export async function getServiceById(req, res) {
  const service = await Service.findOne({
    _id: req.params.id,
    status: LISTING_STATUS.APPROVED,
    isActive: true,
  }).populate("sellerId", "name profilePictureUrl");

  if (!service) {
    throw new AppError("Service not found.", 404);
  }

  return sendResponse(res, 200, true, "Service fetched successfully.", {
    service,
  });
}

export async function createService(req, res) {
  const service = await Service.create({
    ...req.body,
    coupon: sanitizeListingCoupon(req.body.coupon),
    sellerId: req.user._id,
    status: LISTING_STATUS.APPROVED,
  });

  return sendResponse(res, 201, true, "Service listed successfully.", {
    service,
  });
}

export async function updateService(req, res) {
  const service = await ensureOwnService(req.params.id, req.user._id);
  Object.assign(service, {
    ...req.body,
    coupon: sanitizeListingCoupon(req.body.coupon),
  });
  await service.save();

  return sendResponse(res, 200, true, "Service updated successfully.", {
    service,
  });
}

export async function deleteService(req, res) {
  const service = await ensureOwnService(req.params.id, req.user._id);
  await service.deleteOne();

  return sendResponse(res, 200, true, "Service deleted successfully.", {});
}

export async function toggleService(req, res) {
  const service = await ensureOwnService(req.params.id, req.user._id);
  service.isActive = !service.isActive;
  await service.save();

  return sendResponse(res, 200, true, "Service status toggled successfully.", {
    service,
  });
}
