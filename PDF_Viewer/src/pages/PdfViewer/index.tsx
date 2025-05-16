import { useEffect, useState } from 'react';
import { Document, Page } from 'react-pdf';
import styles from './PdfViewer.module.scss';
import classNames from 'classnames/bind';
import Cookies from 'js-cookie';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faDownload } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

const PdfViewer: React.FC = () => {
  const token = Cookies.get('DITokens');
  const navigate = useNavigate();
  const { id } = useParams();

  const [profile, setProfile] = useState<any>(null);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [access, setAccess] = useState('');

  const getProfile = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_BE_URI}/user/profile`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.log('Error Response:', errorData);
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const responseData = await res.json();
      // console.log('Response: ', responseData.data);
      setProfile(responseData.data);
    } catch (error) {
      console.error('Post subject error:', error);
      return;
    }
  };

  const getPdf = async () => {
    try {
      // console.log('URL: ', `${process.env.REACT_APP_BE_URI}/pdf-files/${id}`);
      const res = await fetch(`${process.env.REACT_APP_BE_URI}/pdf-files/${id}`, {
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
      setPdfData(responseData.data.file.storagePath);
      setAccess(responseData.data.access);
      console.log(access);
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
          userId: profile._id,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.log('Error Response:', errorData);
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const responseData = await res.json();
      console.log('Response: ', responseData.data);
      setPdfData(responseData.data.file.storagePath);
      setAccess(responseData.data.access);
      console.log(access);
    } catch (error) {
      console.error('postRecentDocs error:', error);
      return;
    }
  };

  

  useEffect(() => {
    const fetchData = async () => {
      await getPdf();
      await getProfile();
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
        const response = await fetch(pdfData);
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

  console.log('pdfData', pdfData);

  return (
    <div className={cx('wrapper')}>
      <div className={cx('header')}>
        <FontAwesomeIcon
          style={{ justifySelf: 'center', height: '25px', width: '25px', cursor: 'pointer', marginLeft: '15px' }}
          icon={faArrowLeft}
          onClick={() => navigate(-1)}
        />

        <div className={cx('right-header')} onClick={toggleDownload}>
          <FontAwesomeIcon style={{ marginRight: '10px' }} icon={faDownload} />
          Download
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
    </div>
  );

  // return (
  //   <div className="p-4">
  //     {pdfData ? (
  //       <Document file={ pdfData } onLoadSuccess={onDocumentLoadSuccess}>
  //         {Array.from(new Array(numPages), (_, index) => (
  //           <Page key={index} pageNumber={index + 1} />
  //         ))}
  //       </Document>
  //     ) : (
  //       <p>Đang tải PDF...</p>
  //     )}
  //   </div>
  // );
};

export default PdfViewer;
