import * as React from "react";
import { api } from "../api";

export interface PageResult<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

interface UsePagedListOptions<TFilter> {
  path: string; // 예: "/api/estimates/search"
  buildParams: (page: number, size: number, filter: TFilter) => Record<string, any>;
  defaultSize?: number;
  initialFilter: TFilter;
}

export function usePagedList<TItem, TFilter>({
  path,
  buildParams,
  defaultSize = 10,
  initialFilter,
}: UsePagedListOptions<TFilter>) {
  const [items, setItems] = React.useState<TItem[]>([]);
  const [page, setPage] = React.useState(0);
  const [size] = React.useState(defaultSize);
  const [totalPages, setTotalPages] = React.useState(0);
  const [totalElements, setTotalElements] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [filter, setFilter] = React.useState<TFilter>(initialFilter);

  const loadPage = React.useCallback(
    (targetPage: number) => {
      setLoading(true);
      setError(null);
      api
        .get<PageResult<TItem>>(path, {
          params: buildParams(targetPage, size, filter),
        })
        .then((res) => {
          const data = res.data;
          setItems(data.content);
          setPage(data.page);
          setTotalPages(data.totalPages);
          setTotalElements(data.totalElements);
        })
        .catch((e) => {
          console.error("usePagedList error:", e);
          setError("목록을 불러오지 못했습니다.");
        })
        .finally(() => setLoading(false));
    },
    [path, size, filter]
  );

  // 필터 변경 후 0페이지부터 다시
  const applyFilter = (next: TFilter) => {
    setFilter(next);
    // 필터가 바뀌는 순간 0페이지 로드
    setTimeout(() => loadPage(0), 0);
  };

  return {
    items,
    page,
    size,
    totalPages,
    totalElements,
    loading,
    error,
    filter,
    setFilter: applyFilter,
    reload: () => loadPage(page),
    loadPage,
  };
}
