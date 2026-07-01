export interface PaginationParams {
  page: number;
  page_size: number;
  search?: string;
  ordering?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export const calculatePagination = (
  currentPage: number,
  pageSize: number,
  totalCount: number
): PaginationInfo => {
  const totalPages = Math.ceil(totalCount / pageSize);
  
  return {
    currentPage,
    totalPages,
    totalItems: totalCount,
    hasNext: currentPage < totalPages,
    hasPrevious: currentPage > 1,
  };
};