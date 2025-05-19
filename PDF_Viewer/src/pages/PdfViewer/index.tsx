import { useEffect, useState } from 'react';
import { Document, Page } from 'react-pdf';
import styles from './PdfViewer.module.scss';
import classNames from 'classnames/bind';
import Cookies from 'js-cookie';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowUpFromBracket, faDownload } from '@fortawesome/free-solid-svg-icons';
import { PermissionBox } from '../../components/PermissionBox';

const cx = classNames.bind(styles);

export interface sharedLink {
  access: string;
  token: string;
  _id: string;
}

export interface PdfData {
  _id: string;
  url: string;
  access: string;
  fileName: string;
  sharedLink: sharedLink[];
  sharedWith: Object[];
  isPublic: boolean;
}

const PdfViewer: React.FC = () => {
  const token = Cookies.get('DITokens');
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const shared = searchParams.get('shared');

  const [permissionPopup, setPermissionPopup] = useState(false);

  const [pdfData, setPdfData] = useState<PdfData | null>(null);
  const [numPages, setNumPages] = useState<number>(0);

  const getPdf = async () => {
    try {
      // console.log('URL: ', `${process.env.REACT_APP_BE_URI}/pdf-files/${id}`);
      const res = await fetch(`${process.env.REACT_APP_BE_URI}/pdf-files/${id}?shared=${shared}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.log('Error Response:', errorData);
        // if (errorData.message === 'File id not found') {
        //   console.log(err)
        // } else if (errorData.message === 'You have no permission') {
        // }
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const responseData = await res.json();
      console.log('Response: ', responseData.data);
      setPdfData({
        _id: responseData.data.file._id,
        url: responseData.data.file.storagePath,
        access: responseData.data.access,
        fileName: responseData.data.file.fileName,
        sharedLink: responseData.data.file.sharedLink,
        sharedWith: responseData.data.file.sharedWith,
        isPublic: responseData.data.file.isPublic,
      });
    } catch (error) {
      console.error('getPdf error:', error);
      return;
    }
  };

  const postRecentDocs = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BE_URI}/recent-document`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: id,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.log('Error Response:', errorData);
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const responseData = await res.json();
      console.log('Response postRecentDocs: ', responseData);
      // setPdfData({
      //   url: responseData.data.file.storagePath,
      //   access: responseData.data.access,
      //   fileName: responseData.data.file.fileName,
      // });
    } catch (error) {
      console.error('postRecentDocs error:', error);
      return;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await getPdf();
      await postRecentDocs();
    };

    fetchData();
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const toggleDownload = async () => {
    try {
      if (pdfData) {
        const response = await fetch(pdfData.url);
        const blob = await response.blob();

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'Filename.pdf');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); // cleanup
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <div className={cx('wrapper')}>
      <div className={cx('header')}>
        <FontAwesomeIcon
          style={{ justifySelf: 'center', height: '25px', width: '25px', cursor: 'pointer', marginLeft: '15px' }}
          icon={faArrowLeft}
          onClick={() => navigate(-1)}
        />

        <div className={cx('right-header')}>
          <div className={cx('button')} onClick={toggleDownload}>
            <FontAwesomeIcon style={{ marginRight: '10px' }} icon={faDownload} />
            Download
          </div>
          <div className={cx('button')} onClick={() => setPermissionPopup(true)}>
            <FontAwesomeIcon style={{ marginRight: '10px' }} icon={faArrowUpFromBracket} />
            Share
          </div>
        </div>
      </div>
      <div className={cx('pdf-section')}>
        {pdfData ? (
          <Document file={pdfData} onLoadSuccess={onDocumentLoadSuccess}>
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
          <p>Đang tải PDF...</p>
        )}
      </div>
      {permissionPopup && (
        <PermissionBox access={pdfData?.access} setPermissionPopup={setPermissionPopup} pdfData={pdfData} />
      )}{' '}
    </div>
  );
};

export default PdfViewer;
