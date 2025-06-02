import { useCallback, useEffect, useRef, useState } from 'react';
import styles from './PdfViewer.module.scss';
import classNames from 'classnames/bind';
import Cookies from 'js-cookie';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowUpFromBracket, faDownload, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
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
import { getPDFWithAnnotations, savePDFWithAnnotations } from '~/utils/indexedDB';

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

  const token = Cookies.get('DITokens');
  const navigate = useNavigate();
  const profile = useAuth();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const shared = searchParams.get('shared');

  const [permissionPopup, setPermissionPopup] = useState(false);

  const [pdfData, setPdfData] = useState<PdfData | null>(null);
  const [pdfBlob, setPdfBlob] = useState<StoredPDFData | null>(null);
  const [fileStatus, setFileStatus] = useState<string>('');
  const [isOwner, setIsOwner] = useState<boolean>(false);

  const viewerRef = useRef<HTMLDivElement>(null);
  const [instance, setInstance] = useState<WebViewerInstance | null>(null);

  const instanceRef = useRef<any>(null);
  const [zoomLevel, setZoomLevel] = useState(100);

  const [dropDown, setDropDown] = useState<string | null>(null);

  const [selectedAnnot, setSelectedAnnot] = useState<any>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const annotationManagerRef = useRef<any>(null);

  const [annotationManager, setAnnotationManager] = useState<any>(null);
  const [xfdf, setXfdf] = useState<string | null>(null);
  const [isDocumentLoaded, setIsDocumentLoaded] = useState<boolean>(false);

  const [onSave, setOnSave] = useState<boolean>(false);

  const isImporting = useRef(false);

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
      console.log(Boolean(data.message), '   ', Boolean(isDocumentLoaded));
      if (data.message && isDocumentLoaded) {
        isImporting.current = true;
        annotationManager.importAnnotations(data.message).then(() => {
          isImporting.current = false;
        });
      }
    });
  }, [isDocumentLoaded, annotationManager, socket]);

  const fetchPdfData = useCallback(
    async (pdfId: string) => {
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

        // console.log(responseData);

        setXfdf(responseData.data.annotation.xfdf);
        setPdfData(newPdfData);
        if (newPdfData.ownerId === profile?._id) setIsOwner(true);

        return newPdfData;
      } catch (error) {
        console.error('Error fetching PDF:', error);
      }
    },
    [profile, shared, token],
  );

  // Áp dụng annotations
  useEffect(() => {
    if (xfdf && isDocumentLoaded && annotationManager) {
      annotationManager.importAnnotations(xfdf);
    }
  }, [xfdf, isDocumentLoaded, annotationManager]);

  const postAnnotations = async () => {
    try {
      setOnSave(true);
      const xfdfString = await annotationManagerRef.current?.exportAnnotations();
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
        throw new Error(errorData.message || 'Invalid credentials');
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

  useEffect(() => {
    const getData = async () => {
      if (id) {
        const stored = await getPDFWithAnnotations(id);
        if (!stored) {
          console.log('fetchPdfData');
          const pdfData = await fetchPdfData(id);

          if (!pdfData || !xfdf) return;

          const saveToIndexedDB = async () => {
            const response = await fetch(pdfData.url);
            const blob = await response.blob();
            savePDFWithAnnotations(pdfData._id, blob, pdfData.fileName, xfdf);
            console.log('Saved to IndexDB');
          };

          saveToIndexedDB();
        } else {
          console.log('stored: ', stored);
          // const blobUrl = URL.createObjectURL(stored.file);
          setXfdf(stored.xfdf);
          setPdfBlob(stored);
        }
      }
    };
    getData();
  }, [id, fetchPdfData, xfdf]);

  // useEffect(() => {
  //   if (id) fetchPdfData(id);
  // }, [id, fetchPdfData]);

  const toggleDownload = async () => {
    if (!pdfData) return;

    if (instance) {
      instance.UI.downloadPdf({ filename: pdfData.fileName });
    }
  };

  const webViewerInitialized = useRef(false);

  useEffect(() => {
    if (!instance) return;

    const onZoomUpdated = () => {
      const zoom = instance.Core.documentViewer.getZoomLevel();
      setZoomLevel(zoom * 100); // Convert to percent
    };

    instance.Core.documentViewer.addEventListener('zoomUpdated', onZoomUpdated);

    return () => {
      instance.Core.documentViewer.removeEventListener('zoomUpdated', onZoomUpdated);
    };
  }, [instance]);

  // Tự động lưu mỗi 10s
  useEffect(() => {
    const interval = setInterval(async () => {
      if (pdfData && pdfData?.access !== 'View' && pdfData?.access !== 'Guest') {
        // console.log('Post annotations');
        await postAnnotations();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [pdfData]);

  useEffect(() => {
    setSelectedAnnot(false);
  }, [permissionPopup]);

  useEffect(() => {
    // console.log('Effect running!');
    // console.log('pdfData:', pdfData);
    // console.log('pdfUrl:', pdfBlob);
    // console.log(
    //   'Now1: ',
    //   webViewerInitialized.current,
    //   '  ',
    //   !viewerRef.current,
    //   '  ',
    //   pdfBlob,
    //   '  ',
    //   !viewerRef.current || webViewerInitialized.current || pdfBlob,
    // );
    if (!viewerRef.current || webViewerInitialized.current || pdfBlob === null) return;
    // console.log('Now: ', pdfData?.url, '  ', Boolean(!pdfBlob));
    WebViewer(
      {
        path: '/lib/webviewer',
        licenseKey: process.env.REACT_APP_LICENSE_KEY,
        initialDoc: `${pdfData?.url ? pdfData.url : undefined}`,
        disabledElements: ['annotationPopup', 'annotationStylePopup', 'contextMenuPopup'],
      },
      viewerRef.current!,
    ).then((instance) => {
      instanceRef.current = instance;
      setInstance(instance);

      instance.UI.setToolMode('Pan');

      instance.UI.loadDocument(pdfBlob.file, { filename: 'myFile.pdf' });

      Object.values(instance.UI.hotkeys.Keys).forEach((key) => {
        if (key === 'p' || key === 'ctrl+z' || key === 'escape') {
          return;
        }
        instance.UI.hotkeys.off(key as string);
      });

      instance.Core.documentViewer.addEventListener('documentLoaded', () => {
        setIsDocumentLoaded(true);
        instance.UI.setZoomLevel(`${zoomLevel}%`);
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
        if (action === 'add' || action === 'modify') {
          const xfdf = await annotationManager.exportAnnotations();
          console.log('Send message');
          socket.current?.emit('msgToServer', {
            pdfId: id,
            message: xfdf,
          });
        }
      });

      if (pdfData?.access === 'Guest' || pdfData?.access === 'View')
        instance.Core.annotationManager.enableReadOnlyMode();

      annotationManager.addEventListener('annotationChanged', async (annotations, action) => {
        if (action === 'add' || action === 'modify') console.log(annotations, ': ', action);
      });

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
  }, [pdfData, pdfBlob, xfdf, id, zoomLevel]);

  const handleMouseClick = (event: React.MouseEvent) => {
    if (!viewerRef.current) return;

    const rect = viewerRef.current.getBoundingClientRect();

    // Tính vị trí chuột tương đối so với container cha
    const relativeX = event.clientX - rect.left;
    const relativeY = event.clientY - rect.top + 70;

    setPopupPosition({ x: relativeX, y: relativeY });
  };

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
    const currentIndex = ZOOM_LEVELS.findIndex((z) => z === zoomLevel);
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      const newLevel = ZOOM_LEVELS[currentIndex + 1];
      setZoomLevel(newLevel);
      instanceRef.current?.UI.setZoomLevel(`${newLevel}%`);
    }
  };

  const zoomOut = () => {
    const currentIndex = ZOOM_LEVELS.findIndex((z) => z === zoomLevel);
    if (currentIndex > 0) {
      const newLevel = ZOOM_LEVELS[currentIndex - 1];
      setZoomLevel(newLevel);
      instanceRef.current?.UI.setZoomLevel(`${newLevel}%`);
    }
  };

  if (fileStatus === 'Not found') {
    return <NotFoundLayout />;
  } else if (fileStatus === 'No permission') {
    return <NoPermission />;
  }

  if ((token && !profile) || (!pdfData && !pdfBlob)) {
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
          position: 'relative',
          height: 'calc(100vh - 160px)',
          width: 'calc(100vw - 50px)',
          margin: '10px',
          borderRadius: '20px',
          backgroundColor: '#fff',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
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
        >
          {/* Render PDF pages here */}
        </div>

        {/* Fixed Zoom Controls */}
        <div
          style={{
            zIndex: 10,
            background: '#fff',
            padding: '6px 12px',
            borderRadius: '12px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          <button style={{ backgroundColor: 'white' }} onClick={zoomOut} disabled={zoomLevel === 50}>
            <FontAwesomeIcon
              icon={faMinus}
              style={{
                width: '15px',
                height: '15px',
                padding: '5px',
                border: '1px solid black',
                cursor: 'pointer',
                borderRadius: '50%',
              }}
            />
          </button>
          <select style={{ padding: '5px', border: 'white' }} value={zoomLevel.toString()} onChange={handleZoomChange}>
            {ZOOM_LEVELS.map((level) => (
              <option key={level} value={level.toString()}>
                {level}%
              </option>
            ))}
          </select>
          <button style={{ backgroundColor: 'white' }} onClick={zoomIn} disabled={zoomLevel === 200}>
            <FontAwesomeIcon
              icon={faPlus}
              style={{
                width: '15px',
                height: '15px',
                padding: '5px',
                border: '1px solid black',
                cursor: 'pointer',
                borderRadius: '50%',
              }}
            />
          </button>
        </div>

        {/* Shape/Anno Controls */}
        {pdfData && pdfData.access !== 'View' && pdfData.access !== 'Guest' && (
          <div
            style={{
              position: 'absolute',
              bottom: '50px',
              right: '20px',
              zIndex: 20, // Đảm bảo hiển thị trên nội dung khác
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
      {permissionPopup && (
        <PermissionBox access={pdfData?.access} setPermissionPopup={setPermissionPopup} pdfData={pdfData} />
      )}

      {selectedAnnot && popupPosition && pdfData && pdfData.access !== 'View' && pdfData.access !== 'Guest' && (
        <div
          style={{
            position: 'absolute',
            top: popupPosition.y,
            left: popupPosition.x,
            zIndex: 1001,
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
    </div>
  );
};

export default PdfViewer;
