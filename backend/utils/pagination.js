/**
 * Parses pagination query params and returns Sequelize-compatible options.
 * @param {Object} query - Express req.query
 * @param {Object} options - { defaultLimit, maxLimit }
 * @returns {{ limit: number, offset: number, page: number, pageSize: number }}
 */
export const parsePagination = (query, { defaultLimit = 20, maxLimit = 100 } = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const pageSize = Math.min(maxLimit, Math.max(1, parseInt(query.limit || query.pageSize, 10) || defaultLimit));
  const offset = (page - 1) * pageSize;

  return { limit: pageSize, offset, page, pageSize };
};

/**
 * Wraps Sequelize findAndCountAll result into a standard paginated response.
 */
export const paginatedResponse = (result, { page, pageSize }) => ({
  data: result.rows,
  pagination: {
    total: result.count,
    page,
    pageSize,
    totalPages: Math.ceil(result.count / pageSize)
  }
});
