import { useEffect } from 'react';

const SUFFIX = ' – Londynek.net';

export function useDocumentTitle(title: string, exact = false) {
  useEffect(() => {
    document.title = exact ? title : `${title}${SUFFIX}`;
  }, [title, exact]);
}
