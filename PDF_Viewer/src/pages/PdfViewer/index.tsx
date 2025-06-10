import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './PdfViewer.module.scss';
import classNames from 'classnames/bind';
import Cookies from 'js-cookie';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faAngleLeft,
  faAngleRight,
  faAnglesLeft,
  faAnglesRight,
  faArrowLeft,
  faArrowUpFromBracket,
  faCloud,
  faCloudArrowUp,
  faDownload,
  faMinus,
  faPlus,
} from '@fortawesome/free-solid-svg-icons';
import { PermissionBox } from '../../components/PermissionBox';
import { useAuth } from '../../layout/DashBoardLayout';
import { Loading } from '../../components/Loading';
import NotFoundLayout from '../../layout/NotFoundLayout';
import { NoPermission } from '../../components/NoPermission';
import WebViewer, { WebViewerInstance } from '@pdftron/webviewer';
import { Shape } from '~/components/DropDown/Shape';
import { ShapePop } from '~/components/Popup/ShapePop';
import { Text } from '~/components/DropDown/Text';
import { TextPop } from '~/components/Popup/TextPop';
import { OnSave } from '~/components/Popup/OnSave';
import { useTranslation } from 'react-i18next';
import { io, Socket } from 'socket.io-client';
import { deletePDF, getPDFWithAnnotations, savePDFWithAnnotations, updateXFDF } from '~/utils/indexedDB';
import { UploadWarning } from '~/components/Popup/UploadWarning';

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

interface StoredPDFData {
  id: string;
  file: Blob;
  fileName: string;
  xfdf: string;
}

const ZOOM_LEVELS = [50, 75, 90, 100, 125, 150, 200];

const PdfViewer: React.FC = () => {
  const { t } = useTranslation('pages/PdfViewer');

  const [token, setToken] = useState<string | undefined>(Cookies.get('DITokens'));
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const shared = searchParams.get('shared');

  const [warningPopup, setWarningPopup] = useState<Boolean>(false);
  const [permissionPopup, setPermissionPopup] = useState(false);

  const [pdfData, setPdfData] = useState<PdfData | null>(null);
  const [pdfBlob, setPdfBlob] = useState<StoredPDFData | null>(null);
  const [fileStatus, setFileStatus] = useState<string>('');
  const [isOwner, setIsOwner] = useState<boolean>(false);

  const viewerRef = useRef<HTMLDivElement>(null);
  const [instance, setInstance] = useState<WebViewerInstance | null>(null);

  const instanceRef = useRef<any>(null);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [dropDown, setDropDown] = useState<string | null>(null);

  const [selectedAnnot, setSelectedAnnot] = useState<any>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const annotationManagerRef = useRef<any>(null);

  const [annotationManager, setAnnotationManager] = useState<any>(null);
  const [xfdf, setXfdf] = useState<string | null>(null);
  const [isDocumentLoaded, setIsDocumentLoaded] = useState<boolean>(false);

  const [onSave, setOnSave] = useState<boolean>(false);

  const isImporting = useRef(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentToken = Cookies.get('DITokens');
      setToken((prevToken) => {
        if (prevToken !== currentToken) {
          return currentToken;
        }
        return prevToken;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // const socket = io(process.env.REACT_APP_SOCKET_URI);

  const socket = useRef<Socket | null>(null);

  // Tạo socket để real-time collab
  useEffect(() => {
    socket.current = io(process.env.REACT_APP_SOCKET_URI);

    socket.current.emit('joinPdfRoom', id);

    return () => {
      socket.current?.disconnect();
    };
  }, [id]);

  useEffect(() => {
    socket.current?.on('msgToClient', (data) => {
      console.log('Message receive: ', data.message, ' ', isDocumentLoaded);
      if (data.message && isDocumentLoaded) {
        isImporting.current = true;

        const annots = annotationManager.getAnnotationsList();
        annotationManager.deleteAnnotations(annots, { force: true });

        // Sau khi xóa, import ngay (vì không bất đồng bộ)
        annotationManager.importAnnotations(data.message);
        isImporting.current = false;
      }
    });
  }, [isDocumentLoaded, annotationManager, socket]);

  const fetchPdfData = async (pdfId: string) => {
    try {
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
          if (id) deletePDF(id);
        }
        console.log(errorData.message || 'Failed to fetch PDF');
      }

      const responseData = await res.json();
      const newPdfData: PdfData = {
        _id: responseData.data.file._id,
        url: responseData.data.url,
        ownerId: responseData.data.file.ownerId,
        access: responseData.data.access,
        fileName: responseData.data.file.fileName,
        sharedLink: responseData.data.file.sharedLink,
        sharedWith: responseData.data.file.sharedWith,
        isPublic: responseData.data.file.isPublic,
        updatedAt: responseData.data.file.updatedAt,
      };

      setIsOwner(responseData.data.access === 'Owner');
      setXfdf(responseData.data.annotation.xfdf);
      setPdfData(newPdfData);
      console.log('New pdfData: ', newPdfData);

      return { newPdfData, xfdfData: responseData.data.annotation.xfdf };
    } catch (error) {
      console.error('Error fetching PDF:', error);
    }
  };

  // Áp dụng annotations
  useEffect(() => {
    const importAnnotate = async () => {
      if (xfdf && isDocumentLoaded && annotationManager) {
        isImporting.current = true;
        annotationManager.importAnnotations(xfdf).then(() => {
          isImporting.current = false;
        });
      }
    };
    importAnnotate();
  }, [xfdf, isDocumentLoaded, annotationManager, pdfData]);

  const postAnnotations = async () => {
    try {
      setOnSave(true);
      const xfdfString = await annotationManagerRef.current?.exportAnnotations();
      if (!xfdfString) return;
      setXfdf(xfdfString);
      if (id) updateXFDF(id, xfdfString);

      const res = await fetch(`${process.env.REACT_APP_BE_URI}/annotations`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pdfId: id,
          xfdf: xfdfString,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.log('Error Response:', errorData);
        // throw new Error(errorData.message || 'Invalid credentials');
      }

      // const responseData = await res.json();
      // console.log('postAnnotations: ', responseData);
    } catch (error) {
      console.error('postAnnotations error:', error);
      return;
    } finally {
      setOnSave(false);
    }
  };

  const initialGetPdf = useRef(false);

  useEffect(() => {
    if (initialGetPdf.current) return;

    const getData = async () => {
      if (id) {
        const result = await fetchPdfData(id);

        let stored = await getPDFWithAnnotations(id);
        if (!stored) {
          console.log('fetchPdfData', result);

          if (!result) return;
          const { newPdfData, xfdfData } = result;
          const saveToIndexedDB = async () => {
            const response = await fetch(newPdfData.url);
            const blob = await response.blob();
            savePDFWithAnnotations(newPdfData._id, blob, newPdfData.fileName, xfdfData);
            // console.log('Saved to IndexDB');
          };

          await saveToIndexedDB();

          stored = await getPDFWithAnnotations(id);
          // console.log('fetchPdfData', stored);
        }

        if (stored) {
          console.log('stored: ', stored);
          setXfdf(stored.xfdf);
          setPdfBlob(stored);

          // getAnnotations();
        }
      }
    };
    getData();
    initialGetPdf.current = true;
  }, [id, xfdf, instanceRef]);

  // Tự động lưu mỗi 10s
  useEffect(() => {
    const interval = setInterval(async () => {
      if (id && pdfData && pdfData?.access !== 'View' && pdfData?.access !== 'Guest') {
        // console.log('Post annotations');
        await postAnnotations();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [pdfData]);

  const handleSave = () => {
    postAnnotations();
  };

  const toggleDownload = async () => {
    if (!pdfData || !webViewerInitialized.current) return;

    if (instance) {
      try {
        instance.UI.downloadPdf({ filename: pdfData.fileName });
      } catch {
        setWarningPopup(true);
        setInterval(() => setWarningPopup(false), 1000);
      }
    }
  };

  const webViewerInitialized = useRef(false);

  useEffect(() => {
    setSelectedAnnot(false);
  }, [permissionPopup]);

  useEffect(() => {
    if (!viewerRef.current || webViewerInitialized.current || !pdfData || !pdfBlob) return;

    WebViewer(
      {
        path: '/lib/webviewer',
        licenseKey: process.env.REACT_APP_LICENSE_KEY,
        // initialDoc: `${pdfData?.url}`,
        disabledElements: ['annotationPopup', 'annotationStylePopup', 'contextMenuPopup'],
      },
      viewerRef.current!,
    ).then((instance) => {
      instanceRef.current = instance;
      setInstance(instance);

      instance.UI.setToolMode('Pan');
      console.log('pdfBlob: ', pdfBlob);
      if (pdfBlob) {
        instance.UI.loadDocument(pdfBlob.file, { filename: pdfBlob.fileName });
      } else instance.UI.loadDocument(pdfData.url, { filename: pdfData.fileName });

      const allowedKeys = new Set(['p', 'ctrl+z', 'escape', 'ctrl+y', 'f', 't', 'o', 'r', 'a', 'l']);

      (Object.values(instance.UI.hotkeys.Keys) as string[]).forEach((key) => {
        if (!allowedKeys.has(key)) {
          instance.UI.hotkeys.off(key);
        }
      });

      instance.Core.documentViewer.addEventListener('documentLoaded', () => {
        setIsDocumentLoaded(true);
        instance.UI.setZoomLevel(`${zoomLevel}%`);
        instance.UI.setLayoutMode(instance.UI.LayoutMode.Single);
        setTotalPages(instance?.Core.documentViewer.getPageCount());
      });

      instance.Core.documentViewer.addEventListener('pageNumberUpdated', (pageNumber) => {
        setCurrentPage(pageNumber);
      });

      const { annotationManager } = instance.Core;

      setAnnotationManager(annotationManager);
      annotationManagerRef.current = annotationManager;

      annotationManager.addEventListener('annotationSelected', (annotations, action) => {
        if (action === 'selected' && annotations.length > 0) {
          const annot = annotations[0];
          setSelectedAnnot(annot);
        } else if (action === 'deselected') {
          setSelectedAnnot(null);
        }
      });

      annotationManager.addEventListener('annotationChanged', async (annotations, action) => {
        if (isImporting.current) return;
        if (action === 'add' || action === 'modify' || action === 'delete') {
          const xfdf = await annotationManager.exportAnnotations();
          console.log('Send message');
          socket.current?.emit('msgToServer', {
            pdfId: id,
            message: xfdf,
          });
        }
      });

      if (pdfData?.access === 'Guest' || pdfData?.access === 'View') {
        console.log('access', pdfData.access);
        instance.Core.annotationManager.enableReadOnlyMode();
      }

      const topHeader = new instance.UI.Components.ModularHeader({
        dataElement: 'header',
        items: [],
      });

      instance.UI.disableElements([
        'annotationPopup',
        'annotationStylePopup',
        'contextMenuPopup',
        'stylePanel',
        'annotationCommentButton',
        'annotationStyleEditButton',
        'linkButton',
        'annotationDeleteButton',
      ]);

      instance.UI.setModularHeaders([topHeader]);

      webViewerInitialized.current = true;
    });
  }, [viewerRef, pdfData, pdfBlob, xfdf, id, zoomLevel]);

  const handleMouseClick = (event: React.MouseEvent) => {
    const popupWidth = 300;
    const popupHeight = 200;

    let x = event.clientX;
    let y = event.clientY;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Điều chỉnh nếu popup bị tràn phải
    if (x + popupWidth > windowWidth) {
      x = windowWidth - popupWidth - 10; // chừa 10px
    }

    // Điều chỉnh nếu popup bị tràn xuống dưới
    if (y + popupHeight > windowHeight) {
      y = windowHeight - popupHeight - 10;
    }

    // Điều chỉnh nếu popup tràn lên trên
    if (y < 0) y = 10;

    // Điều chỉnh nếu popup tràn trái
    if (x < 0) x = 10;

    setPopupPosition({ x, y });
  };

  useEffect(() => {
    if (!instance) return;

    const onZoomUpdated = () => {
      const zoom = instance.Core.documentViewer.getZoomLevel();
      setZoomLevel(zoom * 100);
    };

    instance.Core.documentViewer.addEventListener('zoomUpdated', onZoomUpdated);

    return () => {
      instance.Core.documentViewer.removeEventListener('zoomUpdated', onZoomUpdated);
    };
  }, [instance]);

  useEffect(() => {
    const viewerEl = viewerRef.current;
    if (!viewerEl) return;

    const handleWheelZoom = (e: WheelEvent) => {
      if (!e.ctrlKey) return;

      e.preventDefault();

      const direction = e.deltaY > 0 ? 'out' : 'in';
      const currentIndex = ZOOM_LEVELS.findIndex((z) => z === zoomLevel);

      if (direction === 'in' && currentIndex < ZOOM_LEVELS.length - 1) {
        setZoom(ZOOM_LEVELS[currentIndex + 1]);
      } else if (direction === 'out' && currentIndex > 0) {
        setZoom(ZOOM_LEVELS[currentIndex - 1]);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey) return;

      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        const currentIndex = ZOOM_LEVELS.findIndex((z) => z === zoomLevel);
        if (currentIndex > 0) setZoom(ZOOM_LEVELS[currentIndex - 1]);
      }

      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        const currentIndex = ZOOM_LEVELS.findIndex((z) => z === zoomLevel);
        if (currentIndex < ZOOM_LEVELS.length - 1) setZoom(ZOOM_LEVELS[currentIndex + 1]);
      }
    };

    viewerEl.addEventListener('wheel', handleWheelZoom, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      viewerEl.removeEventListener('wheel', handleWheelZoom);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [zoomLevel]);

  // Ngăn chặn zoom default
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const setZoom = (level: number) => {
    if (!webViewerInitialized.current) return;
    const boundedLevel = Math.max(50, Math.min(200, level));
    setZoomLevel(boundedLevel);
    if (instanceRef.current) {
      instanceRef.current.UI.setZoomLevel(`${boundedLevel}%`);
    }
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setZoom(Number(e.target.value));
  };

  const zoomIn = () => {
    if (isDocumentLoaded === false) return;

    const currentIndex = ZOOM_LEVELS.findIndex((z) => z === zoomLevel);
    if (currentIndex < ZOOM_LEVELS.length - 1 && webViewerInitialized.current === true) {
      const newLevel = ZOOM_LEVELS[currentIndex + 1];
      setZoomLevel(newLevel);
      instanceRef.current?.UI.setZoomLevel(`${newLevel}%`);
    }
  };

  const zoomOut = () => {
    if (isDocumentLoaded === false) return;

    const currentIndex = ZOOM_LEVELS.findIndex((z) => z === zoomLevel && webViewerInitialized.current === true);
    if (currentIndex > 0) {
      const newLevel = ZOOM_LEVELS[currentIndex - 1];
      setZoomLevel(newLevel);
      instanceRef.current?.UI.setZoomLevel(`${newLevel}%`);
    }
  };

  useEffect(() => {
    const viewer = instanceRef.current?.Core.documentViewer;
    if (!viewer) return;

    const updatePageInfo = () => {
      setCurrentPage(viewer.getCurrentPage());
      setTotalPages(viewer.getPageCount());
    };

    viewer.addEventListener('pageNumberUpdated', updatePageInfo);
    viewer.addEventListener('documentLoaded', updatePageInfo);

    return () => {
      viewer.removeEventListener('pageNumberUpdated', updatePageInfo);
      viewer.removeEventListener('documentLoaded', updatePageInfo);
    };
  }, [instanceRef]);

  const goToPage = (page: number) => {
    if (!instance && !isDocumentLoaded) return;
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      instance?.Core.documentViewer.setCurrentPage(page, true);
    }
  };

  if (fileStatus === 'Not found') {
    return <NotFoundLayout />;
  } else if (fileStatus === 'No permission') {
    return <NoPermission />;
  }

  if (token && (!pdfData || !pdfBlob)) {
    return (
      <div
        style={{
          width: '100vw',
          height: 'calc(100vh - 60px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'white',
          overflowX: 'auto',
          overflowY: 'hidden',
          boxSizing: 'border-box',
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
          <h2>{pdfData ? pdfData.fileName : pdfBlob?.fileName}</h2>
        </div>

        <div className={cx('right-header')}>
          {pdfData?.access !== 'View' && pdfData?.access !== 'Guest' && (
            <button className={cx('button', 'button-save', { saving: onSave })} onClick={handleSave}>
              <FontAwesomeIcon
                className={cx('save-icon')}
                icon={onSave ? faCloudArrowUp : faCloud}
                style={{ marginRight: '10px' }}
              />
              {t('Save')}
            </button>
          )}

          <button className={cx('button')} onClick={toggleDownload}>
            <FontAwesomeIcon style={{ marginRight: '10px' }} icon={faDownload} />
            {t('Download')}
          </button>
          {isOwner && (
            <button className={cx('button')} onClick={() => setPermissionPopup(true)}>
              <FontAwesomeIcon style={{ marginRight: '10px' }} icon={faArrowUpFromBracket} />
              {t('Share')}
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 'calc(100vh - 160px)',
          width: '100vw',
          boxSizing: 'border-box',
          margin: '20px 0',
        }}
      >
        <div
          style={{
            width: 'calc(100vw - 60px)',
            position: 'relative',
            height: '100%',
            margin: '10px 15px',
            borderRadius: '20px',
            backgroundColor: '#fff',
            boxShadow: '0 0 10px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #E4E4E4',
          }}
        >
          {/* Scrollable PDF Viewer Area */}
          <div
            ref={viewerRef}
            style={{
              flex: 1,
              overflowY: 'hidden',
            }}
            onClick={handleMouseClick}
          ></div>

          <div>
            <div
              style={{
                zIndex: 10,
                background: '#fff',
                padding: '6px 16px',
                borderRadius: '12px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
              }}
            >
              <div className={cx('zoomControls')}>
                {/* Zoom Out */}
                <button
                  onClick={zoomOut}
                  disabled={zoomLevel === 50}
                  className={cx('zoomButton')}
                  aria-label="Zoom out"
                >
                  <FontAwesomeIcon icon={faMinus} className={cx('zoomIcon')} />
                </button>

                {/* Zoom Level Dropdown */}
                <select
                  className={cx('zoomSelect')}
                  value={zoomLevel.toString()}
                  onChange={handleZoomChange}
                  aria-label="Zoom level"
                >
                  {ZOOM_LEVELS.map((level) => (
                    <option key={level} value={level.toString()}>
                      {level}%
                    </option>
                  ))}
                </select>

                {/* Zoom In */}
                <button onClick={zoomIn} disabled={zoomLevel === 200} className={cx('zoomButton')} aria-label="Zoom in">
                  <FontAwesomeIcon icon={faPlus} className={cx('zoomIcon')} />
                </button>
              </div>

              <div className={cx('pagination')}>
                {/* First Page */}
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className={cx('paginationButton')}
                  aria-label="First page"
                >
                  <FontAwesomeIcon icon={faAnglesLeft} className={cx('paginationIcon')} />
                </button>

                {/* Previous Page */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={cx('paginationButton')}
                  aria-label="Previous page"
                >
                  <FontAwesomeIcon icon={faAngleLeft} className={cx('paginationIcon')} />
                </button>

                {/* Page Number Input */}
                <div className={cx('pageInputContainer')}>
                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={currentPage}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      if (!isNaN(val)) {
                        setCurrentPage(Math.max(1, Math.min(totalPages, val)));
                      }
                    }}
                    onBlur={() => goToPage(currentPage)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        goToPage(currentPage);
                      }
                    }}
                    className={cx('pageInput')}
                    aria-label="Current page number"
                  />
                  <span className={cx('totalPages')}>/ {totalPages}</span>
                </div>

                {/* Next Page */}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={cx('paginationButton')}
                  aria-label="Next page"
                >
                  <FontAwesomeIcon icon={faAngleRight} className={cx('paginationIcon')} />
                </button>

                {/* Last Page */}
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={cx('paginationButton')}
                  aria-label="Last page"
                >
                  <FontAwesomeIcon icon={faAnglesRight} className={cx('paginationIcon')} />
                </button>
              </div>
            </div>
          </div>

          {/* Shape/Anno Controls */}
          {pdfData && pdfData.access !== 'View' && pdfData.access !== 'Guest' && (
            <div
              style={{
                position: 'absolute',
                bottom: '60px',
                right: '20px',
                zIndex: 20,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                background: '#fff',
                padding: '8px',
                borderRadius: '10px',
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
              }}
            >
              <button
                className={cx('annotation-button', { choose: dropDown === 'shape' })}
                onClick={() => {
                  setDropDown((prev) => (prev === 'shape' ? null : 'shape'));
                }}
              >
                <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M1.54286 2V12H16.4571V2H1.54286ZM0 1.97727C0 1.1614 0.680295 0.5 1.51948 0.5H16.4805C17.3197 0.5 18 1.1614 18 1.97727V12.0227C18 12.8386 17.3197 13.5 16.4805 13.5H1.51948C0.680295 13.5 0 12.8386 0 12.0227V1.97727Z"
                    fill="#1E1E1E"
                  />
                </svg>
                <span>{t('Shape')}</span>
              </button>

              <span>|</span>

              <button
                className={cx('annotation-button', { choose: dropDown === 'text' })}
                onClick={() => {
                  if (instance) {
                    setDropDown((prev) => (prev === 'text' ? null : 'text'));
                    instance.UI.setToolMode('AnnotationCreateFreeText');
                  }
                }}
              >
                <svg width="20" height="16" viewBox="0 0 20 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M20 1.25V4.25C20 4.44891 19.921 4.63968 19.7803 4.78033C19.6397 4.92098 19.4489 5 19.25 5C19.0511 5 18.8603 4.92098 18.7197 4.78033C18.579 4.63968 18.5 4.44891 18.5 4.25V2H13.25V14H15.5C15.6989 14 15.8897 14.079 16.0303 14.2197C16.171 14.3603 16.25 14.5511 16.25 14.75C16.25 14.9489 16.171 15.1397 16.0303 15.2803C15.8897 15.421 15.6989 15.5 15.5 15.5H9.5C9.30109 15.5 9.11032 15.421 8.96967 15.2803C8.82902 15.1397 8.75 14.9489 8.75 14.75C8.75 14.5511 8.82902 14.3603 8.96967 14.2197C9.11032 14.079 9.30109 14 9.5 14H11.75V2H6.5V4.25C6.5 4.44891 6.42098 4.63968 6.28033 4.78033C6.13968 4.92098 5.94891 5 5.75 5C5.55109 5 5.36032 4.92098 5.21967 4.78033C5.07902 4.63968 5 4.44891 5 4.25V1.25C5 1.05109 5.07902 0.860322 5.21967 0.71967C5.36032 0.579018 5.55109 0.5 5.75 0.5H19.25C19.4489 0.5 19.6397 0.579018 19.7803 0.71967C19.921 0.860322 20 1.05109 20 1.25Z"
                    fill="#1E1E1E"
                  />
                  <path
                    d="M6 9.5C6 9.69891 5.92098 9.88968 5.78033 10.0303C5.63968 10.171 5.44891 10.25 5.25 10.25H3.75V11.75C3.75 11.9489 3.67098 12.1397 3.53033 12.2803C3.38968 12.421 3.19891 12.5 3 12.5C2.80109 12.5 2.61032 12.421 2.46967 12.2803C2.32902 12.1397 2.25 11.9489 2.25 11.75V10.25H0.75C0.551088 10.25 0.360323 10.171 0.21967 10.0303C0.079018 9.88968 0 9.69891 0 9.5C0 9.30109 0.079018 9.11032 0.21967 8.96967C0.360323 8.82902 0.551088 8.75 0.75 8.75H2.25V7.25C2.25 7.05109 2.32902 6.86032 2.46967 6.71967C2.61032 6.57902 2.80109 6.5 3 6.5C3.19891 6.5 3.38968 6.57902 3.53033 6.71967C3.67098 6.86032 3.75 7.05109 3.75 7.25V8.75H5.25C5.44891 8.75 5.63968 8.82902 5.78033 8.96967C5.92098 9.11032 6 9.30109 6 9.5Z"
                    fill="#1E1E1E"
                  />
                </svg>
                <span>{t('Type')}</span>
              </button>
              {dropDown === 'shape' && <Shape instance={instance} />}
              {dropDown === 'text' && <Text instance={instance} />}
            </div>
          )}
        </div>
      </div>
      {permissionPopup && (
        <PermissionBox access={pdfData?.access} setPermissionPopup={setPermissionPopup} pdfData={pdfData} />
      )}

      {selectedAnnot && popupPosition && pdfData && pdfData.access !== 'View' && pdfData.access !== 'Guest' && (
        <div
          style={{
            position: 'fixed',
            top: popupPosition.y - 50,
            left: popupPosition.x - 50,
            backgroundColor: 'transparent',
            zIndex: 1001,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            borderRadius: '10px',
            padding: '10px',
          }}
        >
          {selectedAnnot.Subject === 'Free Text' ? (
            <TextPop instance={instance} selectedAnnot={selectedAnnot} />
          ) : (
            <ShapePop instance={instance} selectedAnnot={selectedAnnot} />
          )}
        </div>
      )}

      {onSave && <OnSave />}
      {warningPopup && (
        <UploadWarning
          setWarningPopup={setWarningPopup}
          text={t('Unable to download the document. Please reload the page and try again.')}
        />
      )}
    </div>
  );
};

export default PdfViewer;
