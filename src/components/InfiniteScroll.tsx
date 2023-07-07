import { ReactNode, useCallback, useState, useEffect } from "react";
import InfiniteScrollComponent from "react-infinite-scroll-component";

import { LoaderFill } from "./Loader";

const DEFAULT_PAGE_SIZE = 50;

interface InfiniteScrollProps<T> {
  data: T[];
  renderItem: (data: T) => ReactNode;
  pageSize?: number;
  scrollableTarget?: ReactNode;
}

export function InfiniteScroll<T>({ data, renderItem, pageSize, scrollableTarget }: InfiniteScrollProps<T>) {
  const [items, setItems] = useState<T[]>([]);

  const next = useCallback(async () => {
    setTimeout(
      () =>
        setItems((prev) => {
          const result = data.slice(0, prev.length + (pageSize || DEFAULT_PAGE_SIZE));
          return result;
        }),
      0,
    );
  }, [data, pageSize]);

  useEffect(() => {
    setItems(data.slice(0, pageSize || DEFAULT_PAGE_SIZE));
  }, [data, pageSize]);

  return (
    <InfiniteScrollComponent
      scrollableTarget={scrollableTarget}
      dataLength={items.length}
      hasMore={items.length < data.length}
      loader={<LoaderFill />}
      next={next}
    >
      {items.map((data, index) => renderItem(data))}
    </InfiniteScrollComponent>
  );
}
