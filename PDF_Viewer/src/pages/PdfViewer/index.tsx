import { useCallback, useEffect, useRef, useState } from 'react';
import { Document, Page } from 'react-pdf';
import styles from './PdfViewer.module.scss';
import classNames from 'classnames/bind';
import Cookies from 'js-cookie';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowUpFromBracket, faDownload, faSync } from '@fortawesome/free-solid-svg-icons';
import { PermissionBox } from '../../components/PermissionBox';
import { useAuth } from '../../layout/DashBoardLayout';
import { Loading } from '../../components/Loading';
import NotFoundLayout from '../../layout/NotFoundLayout';
import { NoPermission } from '../../components/NoPermission';
import WebViewer from '@pdftron/webviewer';

const cx = classNames.bind(styles);

export interface SharedLink {
  access: string;
  token: string;
  _id: string;
}

export interface SharedUser {
  userId: string;
  access: string;
}
export interface PdfData {
  _id: string;
  url: string;
  ownerId: string;
  access: string;
  fileName: string;
  sharedLink: SharedLink[];
  sharedWith: SharedUser[];
  isPublic: boolean;
  updatedAt: string;
}

interface PdfCacheEntry {
  data: PdfData;
  blobUrl: string;
  timestamp: number;
  etag?: string;
  lastModified?: string;
}

interface PdfCache {
  [pdfId: string]: PdfCacheEntry;
}

// Cache constants
const CACHE_EXPIRATION = 60 * 60 * 1000; // 1 giờ
const MAX_CACHE_SIZE = 50;

// Cache Service
const getPdfCache = (): PdfCache => {
  try {
    const cache = localStorage.getItem('pdfCache');
    return cache ? JSON.parse(cache) : {};
  } catch (error) {
    console.error('Error reading PDF cache:', error);
    return {};
  }
};

const savePdfCache = (cache: PdfCache) => {
  try {
    localStorage.setItem('pdfCache', JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving PDF cache:', error);
    // Nếu cache quá lớn, xóa bớt
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      const keys = Object.keys(cache);
      if (keys.length > 10) {
        // Giữ lại 10 file mới nhất
        const sortedKeys = keys.sort((a, b) => (cache[b].timestamp || 0) - (cache[a].timestamp || 0));
        const newCache: PdfCache = {};
        sortedKeys.slice(0, 10).forEach((key) => {
          newCache[key] = cache[key];
        });
        localStorage.setItem('pdfCache', JSON.stringify(newCache));
      }
    }
  }
};

const cleanPdfCache = () => {
  const cache = getPdfCache();
  const now = Date.now();
  let hasChanged = false;

  Object.keys(cache).forEach((pdfId) => {
    const entry = cache[pdfId];
    if (now - entry.timestamp > CACHE_EXPIRATION) {
      URL.revokeObjectURL(entry.blobUrl);
      delete cache[pdfId];
      hasChanged = true;
    }
  });

  // Giới hạn số lượng file trong cache
  if (Object.keys(cache).length > MAX_CACHE_SIZE) {
    const sortedKeys = Object.keys(cache).sort((a, b) => (cache[b].timestamp || 0) - (cache[a].timestamp || 0));
    sortedKeys.slice(MAX_CACHE_SIZE).forEach((key) => {
      URL.revokeObjectURL(cache[key].blobUrl);
      delete cache[key];
    });
    hasChanged = true;
  }

  if (hasChanged) savePdfCache(cache);
};

const cachePdfFile = async (pdfId: string, pdfData: PdfData, etag?: string, lastModified?: string): Promise<string> => {
  const cache = getPdfCache();

  try {
    const response = await fetch(pdfData.url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    cache[pdfId] = {
      data: pdfData,
      blobUrl,
      timestamp: Date.now(),
      etag,
      lastModified,
    };

    savePdfCache(cache);
    return blobUrl;
  } catch (error) {
    console.error('Error caching PDF file:', error);
    throw error;
  }
};

const getCachedPdf = (pdfId: string): PdfCacheEntry | null => {
  return getPdfCache()[pdfId] || null;
};

const PdfViewer: React.FC = () => {
  const token = Cookies.get('DITokens');
  const navigate = useNavigate();
  const profile = useAuth();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const shared = searchParams.get('shared');

  const [permissionPopup, setPermissionPopup] = useState(false);

  const [pdfData, setPdfData] = useState<PdfData | null>(null);
  const [fileStatus, setFileStatus] = useState<string>('');
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [numPages, setNumPages] = useState<number>(0);

  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const viewer = useRef<HTMLDivElement | null>(null);

  const checkFileModified = useCallback(
    async (pdfId: string, cachedEntry: PdfCacheEntry) => {
      try {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${token}`,
        };

        // Sử dụng conditional headers nếu có trong cache
        if (cachedEntry.etag) {
          headers['If-None-Match'] = cachedEntry.etag;
        }
        if (cachedEntry.lastModified) {
          headers['If-Modified-Since'] = cachedEntry.lastModified;
        }

        const res = await fetch(
          `${process.env.REACT_APP_BE_URI}/pdf-files/${pdfId}${shared ? `?shared=${shared}` : ''}`,
          {
            method: 'HEAD',
            headers,
          },
        );

        // 304 Not Modified - file không thay đổi
        if (res.status === 304) {
          return false;
        }

        // File đã thay đổi
        if (res.ok) {
          return true;
        }

        return false;
      } catch (error) {
        console.error('Error checking file modification:', error);
        return false;
      }
    },
    [shared, token],
  );

  const fetchPdfData = useCallback(
    async (pdfId: string, forceRefresh = false) => {
      cleanPdfCache();

      try {
        const cached = getCachedPdf(pdfId);
        let shouldUseCache = false;

        // Kiểm tra cache nếu không force refresh
        if (cached && !forceRefresh) {
          const isModified = await checkFileModified(pdfId, cached);
          shouldUseCache = !isModified;
        }

        if (cached && shouldUseCache) {
          setPdfData(cached.data);
          setPdfBlobUrl(cached.blobUrl);
          if (cached.data.ownerId === profile?._id) setIsOwner(true);
          return;
        }

        // Fetch từ server
        const res = await fetch(
          `${process.env.REACT_APP_BE_URI}/pdf-files/${pdfId}${shared ? `?shared=${shared}` : ''}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (!res.ok) {
          const errorData = await res.json();
          console.log('Error Response:', errorData);
          if (errorData.message === 'File id not found') {
            setFileStatus('Not found');
          } else {
            setFileStatus('No permission');
          }
          throw new Error(errorData.message || 'Failed to fetch PDF');
        }

        const responseData = await res.json();
        const newPdfData: PdfData = {
          _id: responseData.data.file._id,
          url: responseData.data.file.storagePath,
          ownerId: responseData.data.file.ownerId,
          access: profile && profile._id === responseData.data.file.ownerId ? 'Owner' : responseData.data.access,
          fileName: responseData.data.file.fileName,
          sharedLink: responseData.data.file.sharedLink,
          sharedWith: responseData.data.file.sharedWith,
          isPublic: responseData.data.file.isPublic,
          updatedAt: responseData.data.file.updatedAt,
        };

        // Cache file mới với ETag và Last-Modified
        const etag = res.headers.get('ETag');
        const lastModified = res.headers.get('Last-Modified') || newPdfData.updatedAt;

        const blobUrl = await cachePdfFile(pdfId, newPdfData, etag || undefined, lastModified || undefined);

        setPdfData(newPdfData);
        setPdfBlobUrl(blobUrl);
        if (newPdfData.ownerId === profile?._id) setIsOwner(true);
      } catch (error) {
        console.error('Error fetching PDF:', error);
      } finally {
        setIsRefreshing(false);
      }
    },
    [profile, shared, token, checkFileModified],
  );

  const refreshPdf = () => {
    if (!id) return;
    setIsRefreshing(true);
    fetchPdfData(id, true);
  };

  useEffect(() => {
    if (id) {
      fetchPdfData(id);
    }
  }, [id, fetchPdfData]);

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const toggleDownload = async () => {
    if (!pdfData) return;

    const cached = getCachedPdf(pdfData._id);
    const urlToDownload = cached?.blobUrl || pdfData.url;

    const link = document.createElement('a');
    link.href = urlToDownload;
    link.setAttribute('download', pdfData.fileName || 'document.pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const webViewerInitialized = useRef(false);

  useEffect(() => {
    if (viewer.current && pdfData && !webViewerInitialized.current) {
      WebViewer(
        {
          path: '/lib/webviewer',
          licenseKey: 'demo:1747966151004:61fcaa7a03000000004eb811cb6510e62177a6ce7cd9ebf0e5b241b5d5',
          initialDoc: pdfData.url,
        },
        viewer.current,
      ).then((instance) => {
        //TODO ...
        const { UI } = instance;
        const { Feature } = UI;
        console.log('UI: ', UI);
        console.log('Feature: ', Feature);
        UI.disableFeatures([Feature.Print, Feature.Download]);
        UI.disableElements(['saveAsButton', 'leftPanelButton']);

        webViewerInitialized.current = true;
      });
    }
  }, [pdfData]);

  if (fileStatus === 'Not found') {
    return <NotFoundLayout />;
  } else if (fileStatus === 'No permission') {
    return <NoPermission />;
  }

  if ((token && !profile) || !pdfData) {
    return (
      <div
        style={{
          width: '100vw',
          height: 'calc(100% - 60px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
        }}
      >
        <Loading />
      </div>
    );
  }

  return (
    <div className={cx('wrapper')}>
      <div className={cx('header')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <FontAwesomeIcon
            style={{ justifySelf: 'center', height: '25px', width: '25px', cursor: 'pointer', marginLeft: '15px' }}
            icon={faArrowLeft}
            onClick={() => navigate(-1)}
          />
          <h2>{pdfData.fileName}</h2>
        </div>

        <div className={cx('right-header')}>
          <button className={cx('button')} onClick={refreshPdf} disabled={isRefreshing}>
            <FontAwesomeIcon icon={faSync} spin={isRefreshing} style={{ marginRight: '10px' }} />
            Refresh
          </button>
          <button className={cx('button')} onClick={toggleDownload}>
            <FontAwesomeIcon style={{ marginRight: '10px' }} icon={faDownload} />
            Download
          </button>
          {isOwner && (
            <button className={cx('button')} onClick={() => setPermissionPopup(true)}>
              <FontAwesomeIcon style={{ marginRight: '10px' }} icon={faArrowUpFromBracket} />
              Share
            </button>
          )}
        </div>
      </div>
      {/* <div className={cx('pdf-section')}>
        {pdfData ? (
          <Document
            file={pdfBlobUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<Loading />}
            options={{
              cMapUrl: 'cmaps/',
              cMapPacked: true,
            }}
          >
            {Array.from(new Array(numPages), (_, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                renderAnnotationLayer={true}
                renderTextLayer={true}
                scale={1.5}
                className="mb-6"
              />
            ))}
          </Document>
        ) : (
          <p>On Loading PDF...</p>
        )}
      </div> */}
      <div
        className="webviewer"
        ref={viewer}
        style={{
          height: 'calc(100vh - 160px)',
          width: 'calc(100vw - 50px)',
          margin: '20px',
          borderRadius: '20px',
          overflowX: 'hidden',
          overflowY: 'hidden',
          backgroundColor: '#fff',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)', // tuỳ chọn
        }}
      ></div>
      {permissionPopup && (
        <PermissionBox access={pdfData?.access} setPermissionPopup={setPermissionPopup} pdfData={pdfData} />
      )}{' '}
    </div>
  );
};

export default PdfViewer;
